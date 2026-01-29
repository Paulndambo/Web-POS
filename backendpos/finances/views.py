from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction

from core.mixins import BusinessScopedQuerysetMixin

from finances.models import PricingPlan, StoreLoan, Expense
from payments.models import BusinessLedger
from customers.models import LoyaltyCard

from finances.serializers import StoreCreditSerializer, ExpenseSerializer, PricingPlanSerializer, StoreCreditDetailSerializer

# Create your views here.
class StoreCreditListCreateView(BusinessScopedQuerysetMixin, generics.ListCreateAPIView):
    queryset = StoreLoan.objects.all().order_by("-created_at")
    serializer_class = StoreCreditSerializer
    permission_classes = [IsAuthenticated]


class ExpenseListCreateView(BusinessScopedQuerysetMixin, generics.ListCreateAPIView):
    queryset = Expense.objects.all().order_by("-created_at")
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid(raise_exception=True):
            expense = serializer.save()
            # Create a BusinessLedger entry for the expense
            BusinessLedger.objects.create(
                business=request.user.business,
                branch=request.user.branch,
                record_type="Debit",
                date=serializer.validated_data.get("date_incurred"),
                reason="Expense Payment",
                debit=serializer.validated_data.get("amount"),
                description=f"Expense: {expense.description} recorded"
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PricingPlanListCreateView(generics.ListCreateAPIView):
    queryset = PricingPlan.objects.all().order_by("-created_at")
    serializer_class = PricingPlanSerializer
    permission_classes = [AllowAny]



class DebtorsListView(BusinessScopedQuerysetMixin, generics.ListAPIView):
    queryset = StoreLoan.objects.all().order_by("-created_at")
    serializer_class = StoreCreditSerializer
    permission_classes = [IsAuthenticated]


class DebtorDetailView(BusinessScopedQuerysetMixin, generics.RetrieveAPIView):
    queryset = StoreLoan.objects.all()
    serializer_class = StoreCreditDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"