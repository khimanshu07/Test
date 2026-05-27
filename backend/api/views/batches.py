import os
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from api.models import DataSource, UploadBatch
from api.serializers import UploadBatchSerializer
from api.views.base import TenantBaseViewSet
from api.services.normalization import NormalizationService

class UploadBatchViewSet(TenantBaseViewSet):
    """Handles incoming file uploads, raw files saving, and ingestion pipeline executes."""
    queryset = UploadBatch.objects.all().order_by('-upload_timestamp')
    serializer_class = UploadBatchSerializer

    def create(self, request, *args, **kwargs):
        user = request.user
        if not user.organization:
            return Response({"error": "User does not belong to any organization."}, status=status.HTTP_400_BAD_REQUEST)

        source_id = request.data.get('source')
        uploaded_file = request.FILES.get('file')

        if not source_id:
            return Response({"error": "DataSource ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not uploaded_file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            source = DataSource.objects.get(id=source_id, organization=user.organization)
        except DataSource.DoesNotExist:
            return Response({"error": "DataSource not found."}, status=status.HTTP_404_NOT_FOUND)

        # Ensure upload folder exists
        upload_dir = os.path.join(settings.BASE_DIR, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)

        # Save file to disk
        file_path = os.path.join(upload_dir, uploaded_file.name)
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        # Create UploadBatch
        batch = UploadBatch.objects.create(
            organization=user.organization,
            source=source,
            uploaded_by=user,
            file_name=file_path,
            processing_status='PENDING'
        )

        # Run normalization synchronously
        try:
            NormalizationService.ingest_batch(batch)
        except Exception as e:
            return Response({
                "error": f"Ingestion failed: {str(e)}",
                "batch": UploadBatchSerializer(batch).data
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response(UploadBatchSerializer(batch).data, status=status.HTTP_201_CREATED)
