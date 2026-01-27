from users.models import User

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
)
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework import generics, status
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

# Create your views here.
class UsersListAPIView(generics.ListAPIView):
    queryset = User.objects.all().order_by("-created_at")
    serializer_class = UserSerializer


class UserDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all().order_by("-created_at")
    serializer_class = UserSerializer

    lookup_field = "pk"


class UserLoginAPIView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RegisterUserAPIView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        serializer = self.get_serializer(data=data)

        if serializer.is_valid(raise_exception=True):
            user = serializer.save()
            user.business = request.user.business
            user.branch = request.user.branch
            user.set_password(request.data.get("password"))
            user.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)