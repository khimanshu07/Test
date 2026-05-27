import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    industry = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('ANALYST', 'Analyst'),
        ('CLIENT_USER', 'Client User'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CLIENT_USER')

    # Explicit related_name to avoid clashes with default User model
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        verbose_name='groups',
        help_text='The groups this user belongs to.',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        verbose_name='user permissions',
        help_text='Specific permissions for this user.',
    )

    def __str__(self):
        return f"{self.username} ({self.role})"

class DataSource(models.Model):
    SOURCE_TYPES = (
        ('SAP', 'SAP Fuel & Procurement'),
        ('UTILITY', 'Utility Electricity'),
        ('TRAVEL', 'Corporate Travel'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='data_sources')
    name = models.CharField(max_length=255)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES)
    configuration = models.JSONField(default=dict, blank=True) # maps plants, units, default rules
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.source_type} ({self.organization.name})"

class UploadBatch(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='upload_batches')
    source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name='batches')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_batches')
    file_name = models.CharField(max_length=255)
    upload_timestamp = models.DateTimeField(auto_now_add=True)
    processing_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    total_rows = models.IntegerField(default=0)
    processed_rows = models.IntegerField(default=0)
    failed_rows = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.file_name} ({self.processing_status})"

class RawRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(UploadBatch, on_delete=models.CASCADE, related_name='raw_records')
    row_number = models.IntegerField()
    raw_payload = models.JSONField(default=dict)
    validation_errors = models.JSONField(default=list, blank=True)
    is_normalized = models.BooleanField(default=False)

    def __str__(self):
        return f"Batch {self.batch.id} - Row {self.row_number}"

class EmissionRecord(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='emission_records')
    raw_record = models.OneToOneField(RawRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='emission_record')
    ingestion_batch = models.ForeignKey(UploadBatch, on_delete=models.CASCADE, related_name='emission_records')
    source_type = models.CharField(max_length=20, choices=DataSource.SOURCE_TYPES)
    
    # Unified normalized fields
    scope = models.IntegerField(choices=((1, 'Scope 1'), (2, 'Scope 2'), (3, 'Scope 3')))
    category = models.CharField(max_length=255)
    activity_type = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=18, decimal_places=4)
    normalized_unit = models.CharField(max_length=50)
    emission_factor = models.DecimalField(max_digits=12, decimal_places=6)
    calculated_emissions = models.DecimalField(max_digits=18, decimal_places=6) # Metric Tonnes CO2e
    reporting_period = models.CharField(max_length=20) # e.g. '2026-05' or '2026-Q2'
    source_reference = models.CharField(max_length=255, blank=True)
    
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)
    validation_warnings = models.JSONField(default=list, blank=True)
    review_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    comment = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.activity_type} - {self.calculated_emissions} t CO2e ({self.review_status})"

class ReviewAction(models.Model):
    ACTION_CHOICES = (
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
        ('COMMENT', 'Add Comment'),
        ('CORRECT', 'Manual Correction'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    emission_record = models.ForeignKey(EmissionRecord, on_delete=models.CASCADE, related_name='review_actions')
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='review_actions')
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    field_name = models.CharField(max_length=100, blank=True, null=True)
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action_type} by {self.reviewer.username if self.reviewer else 'System'} on {self.timestamp}"

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='audit_logs')
    entity_type = models.CharField(max_length=100) # USER, DATASOURCE, EMISSION_RECORD, etc.
    entity_id = models.CharField(max_length=255)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=255) # e.g. CREATE_USER, UPLOAD_BATCH, MANUAL_EDIT
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.action} on {self.entity_type} by {self.performed_by.username if self.performed_by else 'System'}"
