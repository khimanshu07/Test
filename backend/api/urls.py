from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from api.views import (
    DataSourceViewSet, UploadBatchViewSet, EmissionRecordViewSet,
    AuditLogViewSet, DashboardAnalyticsView, CustomTokenObtainPairView
)

router = DefaultRouter()
router.register('sources', DataSourceViewSet, basename='datasource')
router.register('batches', UploadBatchViewSet, basename='uploadbatch')
router.register('records', EmissionRecordViewSet, basename='emissionrecord')
router.register('auditlogs', AuditLogViewSet, basename='auditlog')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('analytics/', DashboardAnalyticsView.as_view(), name='dashboard_analytics'),
    path('', include(router.urls)),
]
