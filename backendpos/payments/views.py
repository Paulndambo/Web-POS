from decimal import Decimal
from django.db import transaction

from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework import generics, status
from django.utils import timezone
from datetime import datetime
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response


from payments.serializers import PaymentSerializer, BNPLInstallmentPaymentSerializer, MakeBNPLPaymentSerializer, MpesaSTKPushSerializer, ConfirmPaymentSerializer
from payments.models import Payment, BNPLInstallmentPayment, BusinessLedger
from bnpl.models import BNPLInstallment, BNPLPurchase

from core.mixins import BusinessScopedQuerysetMixin

date_today = datetime.now().date()

# Create your views here.
class PaymentAPIView(BusinessScopedQuerysetMixin, generics.ListAPIView):
    queryset = Payment.objects.all().order_by("-created_at")
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]



class BNPLInstallmentPaymentAPIView(BusinessScopedQuerysetMixin, generics.ListAPIView):
    queryset = Payment.objects.filter(payment_method="BNPL").order_by("-created_at")
    serializer_class = BNPLInstallmentPaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.filter(installment__isnull=False)
        return queryset



class MakeBNPLPaymentAPIView(BusinessScopedQuerysetMixin, generics.CreateAPIView):
    queryset = Payment.objects.all()
    serializer_class = MakeBNPLPaymentSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid(raise_exception=True):
            if serializer.validated_data["payment_type"].lower() == "single":
                
                installment=BNPLInstallment.objects.get(purchase_id=serializer.validated_data["loan"], id=serializer.validated_data["installment"])
                installment.status = "Paid"
                installment.amount_paid = serializer.validated_data["amount"]
                installment.paid_date = timezone.now()
                installment.save()

                installment.purchase.amount_paid += Decimal(serializer.validated_data["amount"])
                installment.purchase.save()

                installment.purchase.order.amount_paid += Decimal(serializer.validated_data["amount"])
                installment.purchase.order.amount_received += Decimal(serializer.validated_data["amount"])
                installment.purchase.order.save()
                installment.purchase.order.refresh_status()

                installment.purchase.status = "Paid" if installment.purchase.amount_paid >= installment.purchase.total_amount else "Partially Paid"
                installment.purchase.save()

                BNPLInstallmentPayment.objects.create(
                    business=installment.business,
                    branch=installment.branch,
                    loan=installment.purchase,
                    customer=installment.purchase.customer,
                    provider=installment.purchase.service_provider,
                    installment=installment,
                    amount_paid=installment.amount_paid,
                    payment_date=timezone.now(),
                    payment_type=serializer.validated_data["payment_type"],
                    payment_method=serializer.validated_data["payment_method"],
                    reference_number=serializer.validated_data["receipt_number"]
                )

                Payment.objects.create(
                    business=installment.business,
                    branch=installment.branch,
                    installment=installment,
                    order=installment.purchase.order,
                    amount_received=installment.amount_paid,
                    payment_method=serializer.validated_data["payment_method"],
                    receipt_number=serializer.validated_data["receipt_number"],
                    payment_date=timezone.now(),
                    status="Completed",
                    direction="Incoming",
                )

                BusinessLedger.objects.create(
                    business=installment.business,
                    branch=installment.branch,
                    source="BNPL Payment",
                    record_type="Debit",
                    debit=installment.amount_paid,
                    credit=0,
                    date=date_today,
                    description=f"BNPL Payment for {installment.purchase.customer.customer_name} for {installment.purchase.service_provider.name}",
                    reference=serializer.validated_data["receipt_number"]
                )

            else:
                print(serializer.validated_data)
                purchase = BNPLPurchase.objects.get(id=serializer.validated_data["loan"])

                installments = BNPLInstallment.objects.filter(purchase=purchase, status="Pending").order_by("due_date")[:serializer.validated_data["installments_count"]]
                for installment in installments:
                    installment.status = "Paid"
                    installment.amount_paid = serializer.validated_data["amount"]
                    installment.paid_date = timezone.now()
                    installment.save()

                    BNPLInstallmentPayment.objects.create(
                        business=purchase.business,
                        branch=purchase.branch,
                        loan=purchase,
                        customer=purchase.customer,
                        provider=purchase.service_provider,
                        installment=installment,
                        amount_paid=installment.amount_paid,
                        payment_date=timezone.now(),
                        payment_type=serializer.validated_data["payment_type"],
                        payment_method=serializer.validated_data["payment_method"],
                        reference_number=serializer.validated_data["receipt_number"]
                    )


                purchase.amount_paid += Decimal(serializer.validated_data["amount"])
                purchase.save()

                purchase.status = "Paid" if purchase.amount_paid >= purchase.total_amount else "Partially Paid"
                purchase.save()

                purchase.order.amount_paid += Decimal(serializer.validated_data["amount"])
                purchase.order.amount_received += Decimal(serializer.validated_data["amount"])
                purchase.order.save()
                purchase.order.refresh_status()

                Payment.objects.create(
                    business=purchase.business,
                    branch=purchase.branch,
                    order=purchase.order,
                    amount_received=Decimal(serializer.validated_data["amount"]),
                    payment_method=serializer.validated_data["payment_method"],
                    receipt_number=serializer.validated_data["receipt_number"],
                    payment_date=timezone.now(),
                    status="Completed",
                    direction="Incoming",
                )


                BusinessLedger.objects.create(
                    business=purchase.business,
                    branch=purchase.branch,
                    source="BNPL Payment",
                    record_type="Debit",
                    debit=serializer.validated_data["amount"],
                    credit=0,
                    date=date_today,
                    description=f"BNPL Payment for {purchase.customer.customer_name} for {purchase.service_provider.name}",
                    reference=serializer.validated_data["receipt_number"]
                )
                
            return Response({"success": "Installment payment made successfully", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
