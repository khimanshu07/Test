from api.models import DataSource
from api.serializers import DataSourceSerializer
from api.views.base import TenantBaseViewSet

class DataSourceViewSet(TenantBaseViewSet):
    """CRUD viewset for organization-registered ingestion integrations."""
    queryset = DataSource.objects.all()
    serializer_class = DataSourceSerializer
