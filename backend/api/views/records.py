from decimal import Decimal
from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from api.models import EmissionRecord, ReviewAction, AuditLog
from api.serializers import EmissionRecordSerializer
from api.views.base import TenantBaseViewSet

class EmissionRecordViewSet(TenantBaseViewSet):
    """Analyst Audit Queue: Filter, search, manually correct, and bulk approve footprint items."""
    queryset = EmissionRecord.objects.all().order_by('-created_at')
    serializer_class = EmissionRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        
        # Apply filters
        scope = self.request.query_params.get('scope')
        if scope:
            qs = qs.filter(scope=scope)

        source_type = self.request.query_params.get('source_type')
        if source_type:
            qs = qs.filter(source_type=source_type)

        review_status = self.request.query_params.get('review_status')
        if review_status:
            qs = qs.filter(review_status=review_status)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(activity_type__icontains=search) |
                Q(category__icontains=search) |
                Q(source_reference__icontains=search)
            )

        return qs

    @action(detail=True, methods=['post'], url_path='approve')
    def approve_record(self, request, pk=None):
        record = self.get_object()
        user = request.user
        
        if user.role not in ['ANALYST', 'ADMIN']:
            return Response({"error": "Insufficient permissions to review records."}, status=status.HTTP_403_FORBIDDEN)

        old_status = record.review_status
        record.review_status = 'APPROVED'
        record.save()

        # Log action
        ReviewAction.objects.create(
            emission_record=record,
            reviewer=user,
            action_type='APPROVE',
            old_value=old_status,
            new_value='APPROVED'
        )
        AuditLog.objects.create(
            organization=user.organization,
            entity_type='EMISSION_RECORD',
            entity_id=str(record.id),
            performed_by=user,
            action='APPROVE_RECORD'
        )

        return Response(EmissionRecordSerializer(record).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_record(self, request, pk=None):
        record = self.get_object()
        user = request.user
        comment = request.data.get('comment', '')

        if user.role not in ['ANALYST', 'ADMIN']:
            return Response({"error": "Insufficient permissions to review records."}, status=status.HTTP_403_FORBIDDEN)

        old_status = record.review_status
        record.review_status = 'REJECTED'
        if comment:
            record.comment = comment
        record.save()

        # Log action
        ReviewAction.objects.create(
            emission_record=record,
            reviewer=user,
            action_type='REJECT',
            old_value=old_status,
            new_value='REJECTED'
        )
        if comment:
            ReviewAction.objects.create(
                emission_record=record,
                reviewer=user,
                action_type='COMMENT',
                new_value=comment
            )
        AuditLog.objects.create(
            organization=user.organization,
            entity_type='EMISSION_RECORD',
            entity_id=str(record.id),
            performed_by=user,
            action='REJECT_RECORD',
            metadata={'comment': comment}
        )

        return Response(EmissionRecordSerializer(record).data)

    @action(detail=False, methods=['post'], url_path='bulk-approve')
    def bulk_approve(self, request):
        user = request.user
        record_ids = request.data.get('ids', [])

        if user.role not in ['ANALYST', 'ADMIN']:
            return Response({"error": "Insufficient permissions."}, status=status.HTTP_403_FORBIDDEN)

        records = self.get_queryset().filter(id__in=record_ids, review_status='PENDING')
        updated_count = records.count()

        with transaction.atomic():
            for record in records:
                record.review_status = 'APPROVED'
                record.save()

                ReviewAction.objects.create(
                    emission_record=record,
                    reviewer=user,
                    action_type='APPROVE',
                    old_value='PENDING',
                    new_value='APPROVED'
                )

            AuditLog.objects.create(
                organization=user.organization,
                entity_type='EMISSION_RECORD',
                entity_id='BULK',
                performed_by=user,
                action='BULK_APPROVE_RECORDS',
                metadata={'count': updated_count, 'record_ids': record_ids}
            )

        return Response({"message": f"Successfully approved {updated_count} records."})

    @action(detail=False, methods=['post'], url_path='bulk-reject')
    def bulk_reject(self, request):
        user = request.user
        record_ids = request.data.get('ids', [])
        comment = request.data.get('comment', 'Bulk rejected by analyst.')

        if user.role not in ['ANALYST', 'ADMIN']:
            return Response({"error": "Insufficient permissions."}, status=status.HTTP_403_FORBIDDEN)

        records = self.get_queryset().filter(id__in=record_ids, review_status='PENDING')
        updated_count = records.count()

        with transaction.atomic():
            for record in records:
                record.review_status = 'REJECTED'
                record.comment = comment
                record.save()

                ReviewAction.objects.create(
                    emission_record=record,
                    reviewer=user,
                    action_type='REJECT',
                    old_value='PENDING',
                    new_value='REJECTED'
                )
                ReviewAction.objects.create(
                    emission_record=record,
                    reviewer=user,
                    action_type='COMMENT',
                    new_value=comment
                )

            AuditLog.objects.create(
                organization=user.organization,
                entity_type='EMISSION_RECORD',
                entity_id='BULK',
                performed_by=user,
                action='BULK_REJECT_RECORDS',
                metadata={'count': updated_count, 'record_ids': record_ids}
            )

        return Response({"message": f"Successfully rejected {updated_count} records."})

    @action(detail=True, methods=['post'], url_path='correct')
    def correct_record(self, request, pk=None):
        record = self.get_object()
        user = request.user
        
        if user.role not in ['ANALYST', 'ADMIN']:
            return Response({"error": "Insufficient permissions."}, status=status.HTTP_403_FORBIDDEN)

        field = request.data.get('field_name')
        new_value = request.data.get('new_value')

        if not field or new_value is None:
            return Response({"error": "field_name and new_value are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not hasattr(record, field):
            return Response({"error": f"Invalid field '{field}' on emission record."}, status=status.HTTP_400_BAD_REQUEST)

        old_val = str(getattr(record, field))
        
        # Apply change and update emissions if quantity/factor changed
        with transaction.atomic():
            if field in ['quantity', 'emission_factor']:
                setattr(record, field, Decimal(str(new_value)))
                record.calculated_emissions = record.quantity * record.emission_factor / Decimal('1000.0')
            else:
                setattr(record, field, new_value)
            
            # Since manually edited, confidence rises/resets
            record.confidence_score = Decimal('1.00')
            record.save()

            # Audit logs
            ReviewAction.objects.create(
                emission_record=record,
                reviewer=user,
                action_type='CORRECT',
                field_name=field,
                old_value=old_val,
                new_value=str(new_value)
            )
            AuditLog.objects.create(
                organization=user.organization,
                entity_type='EMISSION_RECORD',
                entity_id=str(record.id),
                performed_by=user,
                action='MANUAL_CORRECTION',
                metadata={'field': field, 'old_value': old_val, 'new_value': str(new_value)}
            )

        return Response(EmissionRecordSerializer(record).data)
