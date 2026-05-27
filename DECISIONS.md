# Design Decisions & Assumptions

This document explains the core ingestion choices, engineering assumptions, ignored complexities, and product management (PM) questions addressed during development.

---

## Ingestion Architecture Choices
1. **Raw Payload Archiving**: Raw data parsed from CSV/Excel is stored directly as a JSON payload in the database. This allows analysts to view exact input rows side-by-side with normalized values without keeping file pointers or re-parsing the original file.
2. **Synchronous vs. Asynchronous Normalization**: For local testing and simplicity, ingestion runs synchronously immediately after upload. In production, this can be offloaded to Celery tasks (handled in our architecture via decoupled service layers).
3. **Graceful Pipeline Fault-Tolerance**: If a row fails parsing (e.g. invalid date or string where decimal is expected), we do not abort the entire batch upload. We store the raw payload, tag it with `processing_status = FAILED`, log the exact validation errors, and continue processing other rows. This enables iterative fixes.

---

## Key Assumptions
- **SAP Unit Mappings**: Default plant codes (e.g., `WERKS` values `1000`, `2000`) are mapped in the client organization's configuration. German headers (`Menge`, `Einheit`, etc.) are translated automatically. Liters (`L`) and Gallons (`GAL`) are converted to liters as standard.
- **Utility Invoices**: Electricity usage spikes are defined dynamically (e.g., usage > 3x the running average of previous months or > 100,000 kWh). Overlapping invoice periods for the same meter are flagged as warning anomalies.
- **Scope Categorization**: 
  - Scope 1: SAP fuel procurement (combustion).
  - Scope 2: Utility electricity usage.
  - Scope 3: Corporate travel (hotel, flights, taxis).

---

## PM Clarifications & Questions Resolved
- *How should duplicate travel bookings be flagged?* We calculate travel distance if missing (using origin/destination airport coordinates or a default distance factor), and detect duplicates by matching traveler name, destination, and booking date.
- *What if an emission factor is missing?* The record is stored with warning tags and a default factor of `0.0`, with the confidence score set low so the analyst is forced to review it.
