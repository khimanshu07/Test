from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from api.models import User, Organization
from api.serializers import UserSerializer

class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_superuser)

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUserRole]
    queryset = User.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return User.objects.all().order_by('-date_joined')
        if not user.organization:
            return User.objects.none()
        # Admin can manage users in their organization
        return User.objects.filter(organization=user.organization).order_by('-date_joined')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        user_to_approve = self.get_object()
        user_to_approve.is_active = True
        
        role = request.data.get('role')
        if role:
            user_to_approve.role = role
            
        user_to_approve.save()
        return Response(UserSerializer(user_to_approve).data, status=status.HTTP_200_OK)
