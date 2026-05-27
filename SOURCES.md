# Research & Sources

This document describes the research base and emissions assumptions used for our ingestion types.

---

## 1. SAP Fuel & Procurement
- **SAP Table Headers**: 
  - `MATNR` (Material Number): Used to map fuel type (e.g. Diesel, Fuel Oil, Gasoline).
  - `WERKS` (Plant/Facility Code): Maps to specific locations to identify Scope 1 vs. Scope 3 boundaries.
  - `EKGRP` (Purchasing Group): Helps scope departmental ownership.
  - `Menge` / `Einheit` (Quantity / Unit): Typically parsed using German locale format (e.g. `1.000,50` to `1000.50`).
- **German Headers translation**: Supports `Buchungsdatum` (Posting Date) and `Lieferant` (Vendor).

## 2. Utility Electricity Billing
- **Scope 2 Emissions**: Focuses on electricity consumption in kilowatt-hours (kWh).
- **Emissions Calculations**: Uses regional grid subregion emission factors (e.g. US eGRID, EPA, or European Environment Agency factors).
- **Billing Period Alignment**: Utility bills do not always start/end on calendar month boundaries. We compute daily usage rates and apportion emissions into standard monthly periods for linear reporting.

## 3. Corporate Travel (Scope 3, Category 6)
- **Cabin Class Factors**: Short-haul vs. long-haul flights have significantly different emission profiles depending on cabin class. Economy flights have a lower footprint per passenger compared to Business/First class because of spacing density.
  - Economy: ~0.15 kg CO2e / passenger-km
  - Business: ~0.43 kg CO2e / passenger-km
  - First: ~0.60 kg CO2e / passenger-km
- **Distance Calculations**: Uses Haversine distance formula based on origin/destination airport IATA codes (coordinates mapping dictionary included).

## 4. Realistic Limitations
- **Indirect Land Use Change (ILUC)**: Excluded from biofuels.
- **Radiative Forcing**: High-altitude flight impacts are estimated using standard multipliers (e.g., 1.9x to 2.7x) in advanced calculators. In this platform, basic greenhouse gas (GHG) protocol standards are used.
