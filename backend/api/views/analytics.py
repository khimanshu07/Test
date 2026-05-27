import os
from django.db.models import Sum
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from api.models import EmissionRecord, RawRecord, UploadBatch

class DashboardAnalyticsView(APIView):
    """Calculates summary KPIs and chart aggregates (Scope, Source, monthly trend, success ratios)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.organization:
            return Response({"error": "User does not belong to any organization."}, status=status.HTTP_400_BAD_REQUEST)

        org = user.organization

        # Summary KPIs
        total_rows = EmissionRecord.objects.filter(organization=org).count()
        failed_rows = RawRecord.objects.filter(batch__organization=org, is_normalized=False).count()
        pending_review = EmissionRecord.objects.filter(organization=org, review_status='PENDING').count()
        approved_rows = EmissionRecord.objects.filter(organization=org, review_status='APPROVED').count()
        rejected_rows = EmissionRecord.objects.filter(organization=org, review_status='REJECTED').count()
        
        total_emissions = EmissionRecord.objects.filter(organization=org, review_status='APPROVED').aggregate(total=Sum('calculated_emissions'))['total'] or 0.0

        # Emissions by Scope (1, 2, 3)
        scope_data = EmissionRecord.objects.filter(organization=org).values('scope').annotate(emissions=Sum('calculated_emissions')).order_by('scope')
        scope_analytics = {f"Scope {item['scope']}": float(item['emissions'] or 0.0) for item in scope_data}

        # Emissions by Source Type
        source_data = EmissionRecord.objects.filter(organization=org).values('source_type').annotate(emissions=Sum('calculated_emissions')).order_by('source_type')
        source_analytics = {item['source_type']: float(item['emissions'] or 0.0) for item in source_data}

        # Monthly Trends (Apportioned by reporting period)
        trend_data = EmissionRecord.objects.filter(organization=org).values('reporting_period').annotate(
            emissions=Sum('calculated_emissions')
        ).order_by('reporting_period')
        monthly_trend = [{'period': item['reporting_period'], 'emissions': float(item['emissions'] or 0.0)} for item in trend_data]

        # Approval Distribution
        approval_dist = {
            'Pending': pending_review,
            'Approved': approved_rows,
            'Rejected': rejected_rows
        }

        # Failed Ingestion Trend
        batches = UploadBatch.objects.filter(organization=org).order_by('upload_timestamp')[:10]
        failed_trend = [{
            'file': batch.file_name.split(os.sep)[-1],
            'total': batch.total_rows,
            'failed': batch.failed_rows,
            'date': batch.upload_timestamp.strftime('%m-%d %H:%M')
        } for batch in batches]

        return Response({
            'kpis': {
                'total_rows': total_rows,
                'failed_rows': failed_rows,
                'pending_review': pending_review,
                'approved_rows': approved_rows,
                'rejected_rows': rejected_rows,
                'total_emissions': float(total_emissions)
            },
            'scope_analytics': scope_analytics,
            'source_analytics': source_analytics,
            'monthly_trend': monthly_trend,
            'approval_dist': approval_dist,
            'failed_trend': failed_trend
        })
