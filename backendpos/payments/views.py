from decimal import Decimal
from django.db import transaction

from payments.serializers import PaymentSerializer
from payments.models import Payment
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework import generics, status
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.mixins import BusinessScopedQuerysetMixin

# Create your views here.
class PaymentAPIView(BusinessScopedQuerysetMixin, generics.ListAPIView):
    queryset = Payment.objects.all().order_by("-created_at")
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]