import os
import django
from decimal import Decimal
from datetime import datetime, timedelta

# Initialize django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esg_backend.settings')
django.setup()

from api.models import Organization, User, DataSource, UploadBatch, RawRecord, EmissionRecord, ReviewAction, AuditLog

def seed_data():
    print("Seeding database...")
    
    # 1. Create Organization
    org, created = Organization.objects.get_or_create(
        name="Acme ESG Corp",
        industry="Industrial Manufacturing"
    )
    print(f"Tenant organization: {org.name}")

    # 2. Create Users
    admin_user, _ = User.objects.get_or_create(
        username="admin",
        email="admin@acme.com",
        role="ADMIN",
        organization=org,
        is_staff=True,
        is_superuser=True
    )
    admin_user.set_password("admin123")
    admin_user.save()

    analyst_user, _ = User.objects.get_or_create(
        username="analyst",
        email="analyst@acme.com",
        role="ANALYST",
        organization=org
    )
    analyst_user.set_password("analyst123")
    analyst_user.save()

    client_user, _ = User.objects.get_or_create(
        username="client",
        email="client@acme.com",
        role="CLIENT_USER",
        organization=org
    )
    client_user.set_password("client123")
    client_user.save()
    print("Role-based users created: admin/admin123, analyst/analyst123, client/client123")

    # 3. Create DataSources
    sap_source, _ = DataSource.objects.get_or_create(
        organization=org,
        name="SAP ERP Procurement",
        source_type="SAP",
        configuration={"valid_plant_codes": ["1000", "2000", "3000"]},
        is_active=True
    )

    utility_source, _ = DataSource.objects.get_or_create(
        organization=org,
        name="Grid Utility Billing",
        source_type="UTILITY",
        configuration={"multiplier": 1.0},
        is_active=True
    )

    travel_source, _ = DataSource.objects.get_or_create(
        organization=org,
        name="Corporate Travel System",
        source_type="TRAVEL",
        configuration={},
        is_active=True
    )
    print("Ingestion sources configured.")

    # 4. Create dummy UploadBatch
    batch = UploadBatch.objects.create(
        organization=org,
        source=sap_source,
        uploaded_by=client_user,
        file_name="SAP_PROCUREMENT_MAY_2026.csv",
        processing_status="COMPLETED",
        total_rows=3,
        processed_rows=3,
        failed_rows=0
    )

    # 5. Prepopulate RawRecords and EmissionRecords for dashboard charts
    records_data = [
        # SAP (Scope 1)
        {
            'source_type': 'SAP', 'scope': 1, 'category': 'Stationary Combustion',
            'activity_type': 'SAP Procurement - Diesel', 'quantity': 12000.0, 'unit': 'L',
            'factor': 2.68, 'emissions': 32.16, 'period': '2026-04', 'ref': 'MAT-49291', 'status': 'APPROVED',
            'warnings': [], 'confidence': 1.0, 'raw': {"MATNR": "MAT-49291", "WERKS": "1000", "Fuel_Type": "Diesel", "Menge": 12000, "Einheit": "L"}
        },
        {
            'source_type': 'SAP', 'scope': 1, 'category': 'Stationary Combustion',
            'activity_type': 'SAP Procurement - Gasoline', 'quantity': 4500.0, 'unit': 'L',
            'factor': 2.31, 'emissions': 10.395, 'period': '2026-05', 'ref': 'MAT-10023', 'status': 'PENDING',
            'warnings': ["Unknown plant code WERKS: 5000"], 'confidence': 0.85, 'raw': {"MATNR": "MAT-10023", "WERKS": "5000", "Fuel_Type": "Gasoline", "Menge": 4500, "Einheit": "L"}
        },
        
        # Utility (Scope 2)
        {
            'source_type': 'UTILITY', 'scope': 2, 'category': 'Purchased Electricity',
            'activity_type': 'Grid Electricity - Duke Energy', 'quantity': 84000.0, 'unit': 'kWh',
            'factor': 0.40, 'emissions': 33.60, 'period': '2026-04', 'ref': 'METER-99120', 'status': 'APPROVED',
            'warnings': [], 'confidence': 1.0, 'raw': {"meter_number": "METER-99120", "usage_kwh": 84000, "utility_provider": "Duke Energy"}
        },
        {
            'source_type': 'UTILITY', 'scope': 2, 'category': 'Purchased Electricity',
            'activity_type': 'Grid Electricity - Duke Energy', 'quantity': 155000.0, 'unit': 'kWh',
            'factor': 0.40, 'emissions': 62.00, 'period': '2026-05', 'ref': 'METER-99120', 'status': 'PENDING',
            'warnings': ["Suspicious consumption spike detected (> 100k kWh)"], 'confidence': 0.60, 'raw': {"meter_number": "METER-99120", "usage_kwh": 155000, "utility_provider": "Duke Energy"}
        },

        # Travel (Scope 3)
        {
            'source_type': 'TRAVEL', 'scope': 3, 'category': 'Business Travel',
            'activity_type': 'Flight - BUSINESS', 'quantity': 5567.0, 'unit': 'km',
            'factor': 0.43, 'emissions': 2.3938, 'period': '2026-04', 'ref': 'John Doe', 'status': 'APPROVED',
            'warnings': [], 'confidence': 1.0, 'raw': {"traveler_name": "John Doe", "booking_type": "Flight", "origin_airport": "JFK", "destination_airport": "LHR", "cabin_class": "Business"}
        },
        {
            'source_type': 'TRAVEL', 'scope': 3, 'category': 'Business Travel',
            'activity_type': 'Flight - ECONOMY', 'quantity': 12000.0, 'unit': 'km',
            'factor': 0.15, 'emissions': 1.80, 'period': '2026-05', 'ref': 'Jane Smith', 'status': 'PENDING',
            'warnings': ["Distance calculated automatically from airports coordinates (SFO to HND)"], 'confidence': 0.85, 'raw': {"traveler_name": "Jane Smith", "booking_type": "Flight", "origin_airport": "SFO", "destination_airport": "HND", "cabin_class": "Economy"}
        },
    ]

    for item in records_data:
        raw_rec = RawRecord.objects.create(
            batch=batch,
            row_number=1,
            raw_payload=item['raw'],
            validation_errors=item['warnings'],
            is_normalized=True
        )
        
        er = EmissionRecord.objects.create(
            organization=org,
            raw_record=raw_rec,
            ingestion_batch=batch,
            source_type=item['source_type'],
            scope=item['scope'],
            category=item['category'],
            activity_type=item['activity_type'],
            quantity=Decimal(str(item['quantity'])),
            normalized_unit=item['unit'],
            emission_factor=Decimal(str(item['factor'])),
            calculated_emissions=Decimal(str(item['emissions'])),
            reporting_period=item['period'],
            source_reference=item['ref'],
            confidence_score=Decimal(str(item['confidence'])),
            validation_warnings=item['warnings'],
            review_status=item['status']
        )

        if item['status'] == 'APPROVED':
            ReviewAction.objects.create(
                emission_record=er,
                reviewer=analyst_user,
                action_type='APPROVE',
                old_value='PENDING',
                new_value='APPROVED'
            )
            
    # Add audit logs
    AuditLog.objects.create(
        organization=org,
        entity_type="SYSTEM",
        entity_id="SEED",
        performed_by=admin_user,
        action="SEED_DATABASE",
        metadata={"status": "completed"}
    )
    
    print("Database seeding completed successfully.")

if __name__ == '__main__':
    seed_data()
