from decimal import Decimal
from django.db import transaction

from invoices.serializers import (
    InvoiceSerializer, InvoiceDetailSerializer, InvoiceItemUpdateSerializer, 
    CreateInvoiceSerializer, CreateInvoiceItemsSerializer, InvoicePaymentSerializer
)
from invoices.models import InvoiceItem, Invoice
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework import generics, status
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from payments.models import Payment

# Create your views here.
class InvoiceAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Invoice.objects.all().order_by("-created_at")
    serializer_class = InvoiceSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data
        serializer = CreateInvoiceSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            invoice = Invoice.objects.create(
                customer_name=serializer.validated_data.get("customer_name"),
                email=serializer.validated_data.get("email"),
                phone_number=serializer.validated_data.get("phone_number"),
                address=serializer.validated_data.get("address"),
                due_date=serializer.validated_data.get("due_date"),
                invoice_number=serializer.validated_data.get("invoice_number"),
                tax=serializer.validated_data.get("tax"),
                sub_total=serializer.validated_data.get("sub_total"),
                total_amount=serializer.validated_data.get("total_amount"),
                amount_paid=0
            )

            for x in serializer.validated_data.get("items"):
                InvoiceItem.objects.create(
                    invoice=invoice,
                    item_id=x["item_id"],
                    quantity=x["quantity"],
                    item_total=x["item_total"]
                )
            return Response({"id": invoice.id, "success": "Invoice created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class InvoiceDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Invoice.objects.all().order_by("-created_at")
    serializer_class = InvoiceDetailSerializer

    lookup_field = "pk"


class CreateInvoiceItemsAPIView(generics.CreateAPIView):
    serializer_class = CreateInvoiceItemsSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid(raise_exception=True):
            invoice = Invoice.objects.get(id=serializer.validated_data.get("invoice"))

            for x in serializer.validated_data.get("items"):
                invoice_item = InvoiceItem.objects.filter(invoice=invoice, item__id=x["item_id"]).first()
                if invoice_item:
                    invoice_item.quantity += x["quantity"]
                    invoice_item.item_total += x["item_total"]
                    invoice_item.save()
                else:
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        item_id=x["item_id"],
                        quantity=x["quantity"],
                        item_total=x["item_total"]
                    )
            invoice.refresh_total_amount()
            return Response({"success": "Invoice items added successfully!!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class InvoiceItemUpdateAPIView(generics.CreateAPIView):
    serializer_class = InvoiceItemUpdateSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data
        serializer = self.serializer_class(data=data)
        if serializer.is_valid(raise_exception=True):
            action_type = serializer.validated_data.get("action_type")

            if action_type in ["delete", "remove"]:
                invoice_item = InvoiceItem.objects.get(id=serializer.validated_data["invoice_item"])
                print(f"Invoice Item: {invoice_item}")
                invoice = Invoice.objects.get(id=invoice_item.invoice.id)

                invoice_item.delete()
                #invoice_item.refresh_from_db()
                invoice.refresh_total_amount()
                return Response({"success": "Invoice item deleted successfully"}, status=status.HTTP_201_CREATED)
            elif action_type in ["increase", "increment"]:
                invoice_item = InvoiceItem.objects.get(id=serializer.validated_data["invoice_item"])
                invoice_item.quantity += int(serializer.validated_data["amount"])
                invoice_item.save()
                invoice_item.item_total = Decimal(invoice_item.quantity) * Decimal(invoice_item.item.selling_price)
                invoice_item.save()

                invoice_item.refresh_from_db()
                invoice_item.invoice.refresh_total_amount()
                invoice_item.invoice.save()

                return Response({"success": "Invoice item increased successfully"}, status=status.HTTP_201_CREATED)
            
            elif action_type in ["decrease", "decrement"]:
                invoice_item = InvoiceItem.objects.get(id=serializer.validated_data["invoice_item"])
                invoice_item.quantity -= int(serializer.validated_data["amount"])
                invoice_item.save()
                invoice_item.item_total = Decimal(invoice_item.quantity) * Decimal(invoice_item.item.selling_price)
                invoice_item.save()

                invoice_item.refresh_from_db()
                invoice_item.invoice.refresh_total_amount()
                return Response({"success": "Invoice item decreased successfully"}, status=status.HTTP_201_CREATED)
            else:
                return Response({"failed": "The action you provided is unknown here!!"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class InvoicePaymentAPIView(generics.CreateAPIView):
    serializer_class = InvoicePaymentSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        print(request.data)

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid(raise_exception=True):

            invoice = Invoice.objects.get(id=serializer.validated_data["invoice"])
            invoice.amount_paid += serializer.validated_data.get("amountReceived")
            invoice.status=serializer.validated_data.get("status")
            invoice.save()

            invoice.refresh_total_amount()

            Payment.objects.create(
                invoice=invoice,
                subtotal=serializer.validated_data.get("subtotal"), 
                tax=serializer.validated_data.get("tax"), 
                total=serializer.validated_data.get("total"), 
                payment_method=serializer.validated_data.get("paymentMethod"), 
                amount_received=serializer.validated_data.get("amountReceived"), 
                change=serializer.validated_data.get("change"), 
                mobile_number=serializer.validated_data.get("mobileNumber"), 
                mobile_network=serializer.validated_data.get("mobileNetwork"), 
                split_cash_amount=serializer.validated_data.get("splitCashAmount"), 
                split_mobile_amount=serializer.validated_data.get("splitMobileAmount"), 
                status=invoice.status, 
                payment_date=serializer.validated_data.get("date"), 
                receipt_number=invoice.invoice_number,
                customer_name=invoice.customer_name
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)