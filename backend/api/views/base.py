from rest_framework import viewsets, permissions

class TenantBaseViewSet(viewsets.ModelViewSet):
    """Enforces organizational scoping at the database query level."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return self.queryset.none()
        return self.queryset.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)
