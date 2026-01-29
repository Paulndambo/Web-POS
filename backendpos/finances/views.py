from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from core.mixins import BusinessScopedQuerysetMixin

from finances.models import PricingPlan, StoreCredit, Expense
from finances.serializers import StoreCreditSerializer, ExpenseSerializer, PricingPlanSerializer

# Create your views here.
class StoreCreditListCreateView(BusinessScopedQuerysetMixin, generics.ListCreateAPIView):
    queryset = StoreCredit.objects.all().order_by("-created_at")
    serializer_class = StoreCreditSerializer
    permission_classes = [IsAuthenticated]


class ExpenseListCreateView(BusinessScopedQuerysetMixin, generics.ListCreateAPIView):
    queryset = Expense.objects.all().order_by("-created_at")
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]


class PricingPlanListCreateView(generics.ListCreateAPIView):
    queryset = PricingPlan.objects.all().order_by("-created_at")
    serializer_class = PricingPlanSerializer
    permission_classes = [AllowAny]


