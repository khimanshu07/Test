# Architecture Trade-offs & Skipped Items

This document details the engineering compromises made during initial implementation and maps out future improvements.

---

## 1. Intentionally Skipped Complexities

### Celery / Redis Asynchronous Processing
- **Trade-off**: To avoid requiring a running Redis instance for local development, we process file uploads synchronously in Django. 
- **Future Pathway**: The normalization engine is structured as a decoupled Service Class (`NormalizationService`), making it trivial to execute inside a Celery task without altering core parsing logic.

### Dynamic Emission Factor Management UI
- **Trade-off**: We store emission factors in a static registry inside the backend database/service rather than providing a full management UI.
- **Future Pathway**: An `EmissionFactor` model can be introduced with complete CRUD APIs.

### OCR PDF Invoice Parsing
- **Trade-off**: Utility data ingestion expects structured CSV/Excel formats. PDF OCR is skipped to focus on the robust validation and normalization pipeline.

---

## 2. Key Architectural Choices

### Relational Database over NoSQL
- **Choice**: PostgreSQL/SQLite with structured normalization tables.
- **Reasoning**: ESG reporting requires rigorous mathematical audit trails, and strict schema validation. A relational structure with foreign keys to organizations, upload batches, and audit logs provides complete data integrity.

### Raw vs. Normalized Storage
- **Choice**: Duplicate data storage (storing both raw payload and normalized target columns).
- **Reasoning**: Allows analysts to see the exact input document side-by-side with normalized data, which is essential for audit transparency.
