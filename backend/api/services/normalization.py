import io
import re
import math
import pandas as pd
from decimal import Decimal
from datetime import datetime
from api.models import RawRecord, EmissionRecord, AuditLog

# Coordinate mappings for major global airports to calculate travel distance if missing
AIRPORT_COORDINATES = {
    'JFK': (40.6398, -73.7789),
    'LHR': (51.4700, -0.4543),
    'CDG': (49.0097, 2.5479),
    'FRA': (50.0333, 8.5706),
    'HND': (35.5494, 139.7798),
    'SIN': (1.3644, 103.9915),
    'DXB': (25.2532, 55.3657),
    'SFO': (37.6190, -122.3749),
    'LAX': (33.9416, -118.4085),
    'ORD': (41.9742, -87.9073),
    'PEK': (40.0799, 116.5971),
    'AMS': (52.3105, 4.7683),
}

def haversine_distance(coord1, coord2):
    """Calculates distance between two coordinates in kilometers."""
    if not coord1 or not coord2:
        return 0.0
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371.0 # Earth's radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class NormalizationService:
    @staticmethod
    def parse_file_to_dataframe(file_obj, file_name):
        """Helper to load CSV or Excel files into a pandas dataframe."""
        if file_name.endswith('.csv'):
            content = file_obj.read()
            # Try parsing with UTF-8 first, fallback to ISO-8859-1
            try:
                decoded = content.decode('utf-8')
            except UnicodeDecodeError:
                decoded = content.decode('iso-8859-1')
            return pd.read_csv(io.StringIO(decoded))
        elif file_name.endswith(('.xlsx', '.xls')):
            return pd.read_excel(file_obj)
        else:
            raise ValueError("Unsupported file format. Please upload CSV or Excel (.xlsx).")

    @classmethod
    def ingest_batch(cls, batch):
        batch.processing_status = 'PROCESSING'
        batch.save()
        
        try:
            # Load file data
            file_path = batch.file_name
            with open(file_path, 'rb') as f:
                df = cls.parse_file_to_dataframe(f, file_path)
            
            batch.total_rows = len(df)
            batch.save()
            
            processed = 0
            failed = 0
            
            for index, row in df.iterrows():
                row_num = index + 1
                raw_payload = row.to_dict()
                
                # Replace NaN values with None for JSON serialization compatibility
                cleaned_payload = {}
                for k, v in raw_payload.items():
                    if pd.isna(v):
                        cleaned_payload[k] = None
                    else:
                        cleaned_payload[k] = v
                
                # Create RawRecord
                raw_record = RawRecord.objects.create(
                    batch=batch,
                    row_number=row_num,
                    raw_payload=cleaned_payload,
                    validation_errors=[]
                )
                
                try:
                    # Run target normalization engine depending on source type
                    if batch.source.source_type == 'SAP':
                        cls.normalize_sap_record(raw_record, batch)
                    elif batch.source.source_type == 'UTILITY':
                        cls.normalize_utility_record(raw_record, batch)
                    elif batch.source.source_type == 'TRAVEL':
                        cls.normalize_travel_record(raw_record, batch)
                        
                    raw_record.is_normalized = True
                    raw_record.save()
                    processed += 1
                except Exception as e:
                    raw_record.validation_errors.append(str(e))
                    raw_record.is_normalized = False
                    raw_record.save()
                    failed += 1
            
            batch.processed_rows = processed
            batch.failed_rows = failed
            batch.processing_status = 'COMPLETED' if failed == 0 else 'FAILED'
            batch.save()
            
            # Log audit trail
            AuditLog.objects.create(
                organization=batch.organization,
                entity_type='UPLOAD_BATCH',
                entity_id=str(batch.id),
                performed_by=batch.uploaded_by,
                action='INGEST_BATCH_COMPLETED',
                metadata={
                    'file_name': batch.file_name,
                    'total_rows': batch.total_rows,
                    'processed_rows': processed,
                    'failed_rows': failed,
                    'status': batch.processing_status
                }
            )
            
        except Exception as e:
            batch.processing_status = 'FAILED'
            batch.save()
            raise e

    @classmethod
    def normalize_sap_record(cls, raw_record, batch):
        payload = raw_record.raw_payload
        warnings = []
        errors = []
        
        # Header normalization mapping (German translation & SAP shortcuts)
        # We look for aliases in headers
        header_map = {
            'MATNR': ['MATNR', 'Materialnummer', 'Material_Number'],
            'WERKS': ['WERKS', 'Werk', 'Plant_Code', 'Plant'],
            'EKGRP': ['EKGRP', 'Einkaufsgruppe', 'Purchasing_Group'],
            'Fuel_Type': ['Fuel_Type', 'Fuel-Type', 'Kraftstoffart', 'FuelType'],
            'Menge': ['Menge', 'Quantity', 'Quantity_Value'],
            'Einheit': ['Einheit', 'Unit', 'Unit_Measure'],
            'Buchungsdatum': ['Buchungsdatum', 'Posting_Date', 'Date'],
            'Lieferant': ['Lieferant', 'Vendor', 'Supplier']
        }
        
        def get_value(key):
            for alias in header_map[key]:
                if alias in payload:
                    return payload[alias]
                # Try lowercase search
                if alias.lower() in payload:
                    return payload[alias.lower()]
            return None

        # Extract values
        matnr = get_value('MATNR')
        werks = get_value('WERKS')
        fuel_type = get_value('Fuel_Type')
        menge = get_value('Menge')
        einheit = get_value('Einheit')
        buchungsdatum = get_value('Buchungsdatum')
        lieferant = get_value('Lieferant')

        if not fuel_type:
            errors.append("Missing Fuel Type identifier.")
        if menge is None:
            errors.append("Missing raw Quantity value (Menge).")
        if not einheit:
            errors.append("Missing Unit of Measure (Einheit).")
            
        if errors:
            raise ValueError("; ".join(errors))

        # Check plant code config
        config = batch.source.configuration
        valid_plants = config.get('valid_plant_codes', ['1000', '2000', '3000', '4000'])
        if werks and str(werks) not in valid_plants:
            warnings.append(f"Unknown plant code WERKS: {werks}")

        # Normalize dates
        reporting_period = 'Unknown'
        if buchungsdatum:
            # Support multiple date structures: YYYY-MM-DD, DD.MM.YYYY, etc.
            date_str = str(buchungsdatum).strip()
            parsed_date = None
            for fmt in ('%Y-%m-%d', '%d.%m.%Y', '%d/%m/%Y', '%Y/%m/%d'):
                try:
                    parsed_date = datetime.strptime(date_str, fmt)
                    break
                except ValueError:
                    continue
            if parsed_date:
                reporting_period = parsed_date.strftime('%Y-%m')
            else:
                warnings.append(f"Unrecognized date format: {date_str}. Fallback to current month.")
                reporting_period = datetime.now().strftime('%Y-%m')
        else:
            reporting_period = datetime.now().strftime('%Y-%m')

        # Convert quantity based on units (Standard unit is Liters)
        try:
            raw_qty = float(menge)
        except ValueError:
            raise ValueError(f"Quantity value '{menge}' could not be parsed to number.")

        if raw_qty < 0:
            warnings.append("Negative usage quantity detected.")

        unit_str = str(einheit).upper().strip()
        normalized_unit = 'L'
        quantity = raw_qty
        
        if unit_str in ['GAL', 'GALLON', 'GALLONS']:
            quantity = raw_qty * 3.78541
            normalized_unit = 'L'
        elif unit_str in ['L', 'LITER', 'LITERS', 'LTR']:
            quantity = raw_qty
            normalized_unit = 'L'
        else:
            warnings.append(f"Unrecognized unit '{einheit}'; assumed Liters.")
            normalized_unit = 'L'

        # Emission Factors (kg CO2e per Liter)
        emission_factor_map = {
            'DIESEL': 2.68,
            'GASOLINE': 2.31,
            'PETROL': 2.31,
            'FUEL_OIL': 2.96,
            'HEAVY_FUEL': 2.96,
        }
        
        fuel_key = str(fuel_type).upper().replace(' ', '_')
        emission_factor = emission_factor_map.get(fuel_key, 2.50) # Fallback EF
        if fuel_key not in emission_factor_map:
            warnings.append(f"Default emission factor applied for unknown fuel '{fuel_type}'.")

        # Calculations: Quantity (L) * Emission Factor (kg/L) / 1000 = Metric Tonnes CO2e
        calculated_emissions = (quantity * emission_factor) / 1000.0

        # Anomaly flags
        confidence_score = 1.00
        if warnings:
            confidence_score = max(0.40, 1.00 - (len(warnings) * 0.15))

        if quantity > 50000:
            warnings.append("Extremely high fuel consumption volume detected.")
            confidence_score = min(confidence_score, 0.70)

        # Create Emission Record
        EmissionRecord.objects.create(
            organization=batch.organization,
            raw_record=raw_record,
            ingestion_batch=batch,
            source_type='SAP',
            scope=1,
            category='Stationary Combustion',
            activity_type=f"SAP Procurement - {fuel_type}",
            quantity=Decimal(str(quantity)),
            normalized_unit=normalized_unit,
            emission_factor=Decimal(str(emission_factor)),
            calculated_emissions=Decimal(str(calculated_emissions)),
            reporting_period=reporting_period,
            source_reference=str(matnr) if matnr else '',
            confidence_score=Decimal(str(confidence_score)),
            validation_warnings=warnings,
            review_status='PENDING'
        )

    @classmethod
    def normalize_utility_record(cls, raw_record, batch):
        payload = raw_record.raw_payload
        warnings = []
        errors = []

        meter_number = payload.get('meter_number')
        start_date = payload.get('billing_period_start')
        end_date = payload.get('billing_period_end')
        usage_kwh = payload.get('usage_kwh')
        cost = payload.get('cost')
        provider = payload.get('utility_provider', '')

        if not meter_number:
            errors.append("Meter number is missing.")
        if usage_kwh is None:
            errors.append("Usage in kWh is missing.")
            
        if errors:
            raise ValueError("; ".join(errors))

        try:
            qty = float(usage_kwh)
        except ValueError:
            raise ValueError("usage_kwh is not a numeric value.")

        if qty < 0:
            warnings.append("Negative usage values are invalid.")
            
        # Parse periods
        reporting_period = datetime.now().strftime('%Y-%m')
        if start_date and end_date:
            try:
                d_start = datetime.strptime(str(start_date).strip()[:10], '%Y-%m-%d')
                d_end = datetime.strptime(str(end_date).strip()[:10], '%Y-%m-%d')
                reporting_period = d_start.strftime('%Y-%m')
                
                # Check overlapping periods inside organization
                overlap = EmissionRecord.objects.filter(
                    organization=batch.organization,
                    source_type='UTILITY',
                    source_reference=str(meter_number),
                    reporting_period=reporting_period
                ).exists()
                if overlap:
                    warnings.append(f"Billing period overlaps with an existing invoice for meter {meter_number}.")
            except ValueError:
                warnings.append("Failed to parse billing start/end dates. Format must be YYYY-MM-DD.")

        # Anomaly flags
        confidence_score = 1.00
        if qty > 100000:
            warnings.append("Suspicious consumption spike detected (> 100k kWh).")
            confidence_score = 0.60

        try:
            cost_val = float(cost) if cost is not None else 0.0
            if cost_val < 0:
                warnings.append("Cost field cannot be negative.")
        except ValueError:
            warnings.append("Cost is not a numeric value.")

        # Scope 2 Factor: 0.40 kg CO2e / kWh
        emission_factor = 0.40
        calculated_emissions = (qty * emission_factor) / 1000.0

        if warnings:
            confidence_score = max(0.30, confidence_score - (len(warnings) * 0.15))

        EmissionRecord.objects.create(
            organization=batch.organization,
            raw_record=raw_record,
            ingestion_batch=batch,
            source_type='UTILITY',
            scope=2,
            category='Purchased Electricity',
            activity_type=f"Grid Electricity - {provider}",
            quantity=Decimal(str(qty)),
            normalized_unit='kWh',
            emission_factor=Decimal(str(emission_factor)),
            calculated_emissions=Decimal(str(calculated_emissions)),
            reporting_period=reporting_period,
            source_reference=str(meter_number),
            confidence_score=Decimal(str(confidence_score)),
            validation_warnings=warnings,
            review_status='PENDING'
        )

    @classmethod
    def normalize_travel_record(cls, raw_record, batch):
        payload = raw_record.raw_payload
        warnings = []
        errors = []

        traveler = payload.get('traveler_name')
        booking_type = str(payload.get('booking_type', '')).upper()
        cabin_class = str(payload.get('cabin_class', '')).upper()
        
        if not traveler:
            errors.append("Traveler name is missing.")
        if not booking_type:
            errors.append("Booking type is missing.")
            
        if errors:
            raise ValueError("; ".join(errors))

        distance = 0.0
        normalized_unit = 'km'
        emission_factor = 0.0
        calculated_emissions = 0.0
        category = 'Scope 3 Business Travel'

        if booking_type in ['FLIGHT', 'AIR']:
            origin = str(payload.get('origin_airport', '')).strip().upper()
            dest = str(payload.get('destination_airport', '')).strip().upper()
            
            raw_dist = payload.get('distance_km')
            if raw_dist is not None:
                try:
                    distance = float(raw_dist)
                except ValueError:
                    distance = 0.0
            
            # Calculate distance if missing
            if not distance and origin in AIRPORT_COORDINATES and dest in AIRPORT_COORDINATES:
                distance = haversine_distance(AIRPORT_COORDINATES[origin], AIRPORT_COORDINATES[dest])
                warnings.append(f"Distance calculated automatically from airports coordinates ({origin} to {dest}).")
            elif not distance:
                # Default fallback
                distance = 800.0
                warnings.append("Airport code coordinates mapping missing. Applied default travel distance of 800km.")

            if distance > 15000:
                warnings.append("Extremely high travel distance (>15,000 km) flagged as impossible travel.")

            # Cabin Class factors
            if 'FIRST' in cabin_class:
                emission_factor = 0.60
            elif 'BUS' in cabin_class:
                emission_factor = 0.43
            else:
                emission_factor = 0.15 # Economy default
                if 'ECON' not in cabin_class:
                    warnings.append(f"Defaulted to economy emission factor for unknown cabin class: '{cabin_class}'")
            
            calculated_emissions = (distance * emission_factor) / 1000.0
            quantity_val = distance
            normalized_unit = 'km'
            activity_type = f"Flight - {cabin_class}"

        elif booking_type in ['HOTEL', 'STAY']:
            nights = payload.get('hotel_nights', 1)
            try:
                qty_nights = float(nights)
            except ValueError:
                qty_nights = 1.0
                warnings.append("Invalid hotel nights value, defaulted to 1.")
            
            if qty_nights < 0:
                warnings.append("Hotel nights cannot be negative.")

            emission_factor = 15.0 # kg CO2e / night
            calculated_emissions = (qty_nights * emission_factor) / 1000.0
            quantity_val = qty_nights
            normalized_unit = 'nights'
            activity_type = "Hotel Stay"

        elif booking_type in ['GROUND', 'TAXI', 'CAR']:
            taxi_dist = payload.get('taxi_distance')
            if taxi_dist is not None:
                try:
                    distance = float(taxi_dist)
                except ValueError:
                    distance = 10.0
                    warnings.append("Invalid taxi distance value, defaulted to 10km.")
            else:
                distance = 10.0
                warnings.append("Taxi distance missing. Used default 10km.")

            if distance < 0:
                warnings.append("Taxi distance cannot be negative.")

            emission_factor = 0.18 # kg CO2e / km
            calculated_emissions = (distance * emission_factor) / 1000.0
            quantity_val = distance
            normalized_unit = 'km'
            activity_type = "Ground Transport"
        else:
            raise ValueError(f"Unknown booking type: {booking_type}")

        confidence_score = 1.00
        if warnings:
            confidence_score = max(0.50, 1.00 - (len(warnings) * 0.15))

        reporting_period = datetime.now().strftime('%Y-%m')

        # Create Record
        EmissionRecord.objects.create(
            organization=batch.organization,
            raw_record=raw_record,
            ingestion_batch=batch,
            source_type='TRAVEL',
            scope=3,
            category='Business Travel',
            activity_type=activity_type,
            quantity=Decimal(str(quantity_val)),
            normalized_unit=normalized_unit,
            emission_factor=Decimal(str(emission_factor)),
            calculated_emissions=Decimal(str(calculated_emissions)),
            reporting_period=reporting_period,
            source_reference=str(traveler),
            confidence_score=Decimal(str(confidence_score)),
            validation_warnings=warnings,
            review_status='PENDING'
        )
