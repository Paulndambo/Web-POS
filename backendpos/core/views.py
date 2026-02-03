from django.shortcuts import render
from django.db import transaction
from datetime import datetime
from django.db.models import Sum, Count, Q
from django.utils import timezone

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView

from datetime import timedelta

from core.mixins import BusinessScopedQuerysetMixin

from core.models import Business, Branch
from finances.models import PricingPlan, BusinessSubscription
from users.models import User
from core.serializers import BusinessSerializer, BranchSerializer, BusinessOnboardingSerializer

from orders.models import Order
from payments.models import Payment
from invoices.models import Invoice

date_today = datetime.now().date()

# Create your views here.
class MetricsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        business = getattr(request.user, "business", None)
        if not business:
            return Response(
                {"detail": "User has no associated business"},
                status=status.HTTP_400_BAD_REQUEST
            )

        date_today = timezone.localdate()

        orders_qs = Order.objects.filter(
            business=business,
            created_at__date=date_today
        )

        invoices_qs = Invoice.objects.filter(
            business=business,
            created_at__date=date_today
        )

        payments_qs = Payment.objects.filter(
            business=business,
            direction="Incoming",
            created_at__date=date_today
        )

        order_metrics = orders_qs.aggregate(
            orders_count=Count("id"),
            paid_orders=Count("id", filter=Q(status="Paid")),
            pending_orders=Count(
                "id",
                filter=Q(status__in=["Pending", "Pending Payment"])
            ),
            orders_total_paid=Sum("amount_paid"),
            orders_total_amount=Sum("total_amount"),
        )

        invoice_metrics = invoices_qs.aggregate(
            invoices_count=Count("id"),
            pending_invoices=Count(
                "id",
                filter=Q(status__in=["Pending", "Pending Payment"])
            ),
            paid_invoices=Count(
                "id",
                filter=Q(status__in=["Paid", "Completed", "Complete"])
            ),
            invoices_total=Sum("total_amount"),
            invoices_paid_amount=Sum("amount_paid"),
        )

        revenue_today = payments_qs.aggregate(
            revenue=Sum("amount_received")
        )["revenue"] or 0

        orders_total_amount = order_metrics["orders_total_amount"] or 0
        orders_total_paid = order_metrics["orders_total_paid"] or 0

        invoices_total = invoice_metrics["invoices_total"] or 0
        invoices_paid = invoice_metrics["invoices_paid_amount"] or 0

        return Response(
            {
                **order_metrics,
                "orders_total_pending": orders_total_amount - orders_total_paid,

                **invoice_metrics,
                "invoices_pending_amount": invoices_total - invoices_paid,

                "revenue_today": revenue_today,
            },
            status=status.HTTP_200_OK
        )




class BusinessListCreateAPIView(BusinessScopedQuerysetMixin, generics.ListCreateAPIView):
    queryset = Business.objects.all().order_by("-created_at")
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]


class BusinessDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Business.objects.all().order_by("-created_at")
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]

    lookup_field = "pk"


class BranchListCreateAPIView(BusinessScopedQuerysetMixin, generics.ListCreateAPIView):
    queryset = Branch.objects.all().order_by("-created_at")
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]


class BranchDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Branch.objects.all().order_by("-created_at")
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

    lookup_field = "pk"


class BusinessOnboardingAPIView(generics.CreateAPIView):
    serializer_class = BusinessOnboardingSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid(raise_exception=True):
            business_data = serializer.validated_data['business_details']
            branch_data = serializer.validated_data['branch_details']
            manager_data = serializer.validated_data['manager_details']
            pricing_plan = serializer.validated_data['pricing_plan']

            print(serializer.validated_data)

            business = Business.objects.create(**business_data)
            branch = Branch.objects.create(business=business, **branch_data)
            manager = User.objects.create(**manager_data)
            branch.branch_manager = manager
            branch.save()

            manager.set_password(manager_data['password'])
            manager.business = business
            manager.branch = branch
            manager.username = manager_data['email']
            manager.save()

            business.owner = manager
            business.save()

            BusinessSubscription.objects.create(
                business=business,
                branch=branch,
                pricing_plan=PricingPlan.objects.get(id=pricing_plan['id']),
                end_date=business.created_at.date() + timedelta(days=pricing_plan['pilot_period'])
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)