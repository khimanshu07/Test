from rest_framework_simplejwt.views import TokenObtainPairView
from api.serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login endpoint exposing user scope credentials."""
    serializer_class = CustomTokenObtainPairSerializer
