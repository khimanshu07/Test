from rest_framework_simplejwt.views import TokenObtainPairView
from api.serializers import CustomTokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from api.models import User, Organization

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login endpoint exposing user scope credentials."""
    serializer_class = CustomTokenObtainPairSerializer

class UserSignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        company_name = request.data.get('company_name', '')

        if not email or not password:
            return Response({"error": "Email and password are required fields."}, status=status.HTTP_400_BAD_REQUEST)

        email_lower = email.strip().lower()

        if User.objects.filter(username=email_lower).exists() or User.objects.filter(email=email_lower).exists():
            return Response({"error": "A user with this email address already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create organization
        org = None
        if company_name:
            org, _ = Organization.objects.get_or_create(name=company_name.strip())

        # Create user (inactive by default, requires admin approval)
        user = User.objects.create(
            username=email_lower,
            email=email_lower,
            first_name=first_name,
            last_name=last_name,
            organization=org,
            role='CLIENT_USER',  # Default requested role
            is_active=False      # Inactive until approved by Admin
        )
        user.set_password(password)
        user.save()

        return Response({
            "message": "Registration request submitted successfully. Account is pending admin activation.",
            "email": user.email
        }, status=status.HTTP_201_CREATED)
