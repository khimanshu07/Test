from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from api.models import Organization, User, DataSource, UploadBatch, RawRecord, EmissionRecord, ReviewAction, AuditLog

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'organization', 'organization_name']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = '__all__'

class UploadBatchSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    source_name = serializers.CharField(source='source.name', read_only=True)
    source_type = serializers.CharField(source='source.source_type', read_only=True)

    class Meta:
        model = UploadBatch
        fields = '__all__'

class RawRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawRecord
        fields = '__all__'

class ReviewActionSerializer(serializers.ModelSerializer):
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)

    class Meta:
        model = ReviewAction
        fields = '__all__'

class EmissionRecordSerializer(serializers.ModelSerializer):
    raw_payload = serializers.SerializerMethodField()
    validation_errors = serializers.SerializerMethodField()
    review_actions = ReviewActionSerializer(many=True, read_only=True)
    uploaded_by = serializers.CharField(source='ingestion_batch.uploaded_by.username', read_only=True)
    
    class Meta:
        model = EmissionRecord
        fields = '__all__'

    def get_raw_payload(self, obj):
        if obj.raw_record:
            return obj.raw_record.raw_payload
        return None

    def get_validation_errors(self, obj):
        if obj.raw_record:
            return obj.raw_record.validation_errors
        return []

class AuditLogSerializer(serializers.ModelSerializer):
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'
