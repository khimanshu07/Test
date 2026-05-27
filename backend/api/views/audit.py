from rest_framework import viewsets, permissions
from api.models import AuditLog
from api.serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Exposes read-only historical event log streams for external audits."""
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return self.queryset.none()
        return self.queryset.filter(organization=user.organization)
