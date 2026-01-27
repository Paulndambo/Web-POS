from django.shortcuts import render
from django.db import transaction
from rest_framework import status, generics
from decimal import Decimal

from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


from orders.serializers import (
    PlacePOSOrderSerializer, PayOrderSerializer, 
    OrderSerializer, OrderDetailSerializer,
    OrderItemUpdateSerializer, CreateOrderItemsSerializer
)
from orders.models import Order, OrderItem
from payments.models import Payment
# Create your views here.
class OrderAPIView(generics.ListCreateAPIView):
    queryset = Order.objects.all().order_by("-created_at")
    serializer_class = OrderSerializer


class OrderDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all().order_by("-created_at")
    serializer_class = OrderDetailSerializer

    lookup_field = "pk"


class POSOrderPlacementAPIView(generics.CreateAPIView):
    serializer_class = PlacePOSOrderSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data
        serializer = self.serializer_class(data=data)
        if serializer.is_valid(raise_exception=True):
            order = Order.objects.create(
                business=request.user.business,
                order_number=serializer.validated_data.get("receiptNo"),
                tax=serializer.validated_data.get("tax"),
                sub_total=serializer.validated_data.get("subtotal"),
                total_amount=serializer.validated_data.get("total"),
                amount_received=serializer.validated_data.get("amountReceived"),
                status=serializer.validated_data.get("status"),
                sold_by=request.user
            )
            order.status == "Paid" if order.amount_received >= order.total_amount else serializer.validated_data.get("status")
            order.save()
            Payment.objects.create(
                order=order,
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
                status=order.status, 
                payment_date=serializer.validated_data.get("date"), 
                receipt_number=serializer.validated_data.get("receiptNo")
            )

            for x in serializer.validated_data.get("items"):
                OrderItem.objects.create(
                    order=order,
                    business=request.user.business,
                    inventory_item_id=x["id"],
                    quantity=x["quantity"],
                    item_total=x["total_price"]
                )

            for item in order.items.all():
                item.inventory_item.quantity -= item.quantity
                item.inventory_item.save()
            return Response({"success": "Order successfully placed"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class PayOrderAPIView(generics.CreateAPIView):
    serializer_class = PayOrderSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data
        print(data)
        serializer = self.serializer_class(data=data)
        if serializer.is_valid(raise_exception=True):
            order = Order.objects.get(id=serializer.validated_data["order"])
            order.amount_received += serializer.validated_data.get("amountReceived")
            order.save()

            Payment.objects.create(
                order=order,
                subtotal=order.sub_total, 
                tax=order.tax, 
                total=order.total_amount, 
                payment_method=serializer.validated_data.get("paymentMethod"), 
                amount_received=serializer.validated_data.get("amountReceived"), 
                change=serializer.validated_data.get("change"), 
                mobile_number=serializer.validated_data.get("mobileNumber"), 
                mobile_network=serializer.validated_data.get("mobileNetwork"), 
                split_cash_amount=serializer.validated_data.get("splitCashAmount"), 
                split_mobile_amount=serializer.validated_data.get("splitMobileAmount"), 
                status="Paid",
                payment_date=serializer.validated_data.get("date"), 
                receipt_number=order.order_number
            )
            order.refresh_from_db()
            order.refresh_status()
            return Response({"success": "Order payment was successfully completed"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class OrderItemUpdateAPIView(generics.CreateAPIView):
    serializer_class = OrderItemUpdateSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data
        serializer = self.serializer_class(data=data)
        if serializer.is_valid(raise_exception=True):
            action_type = serializer.validated_data.get("action_type")

            if action_type in ["delete", "remove"]:
                order_item = OrderItem.objects.get(id=serializer.validated_data["order_item"])
                print(f"Order Item: {order_item}")
                order = Order.objects.get(id=order_item.order.id)

                order_item.delete()
                order.refresh_total_amount()
                return Response({"success": "Order item deleted successfully"}, status=status.HTTP_201_CREATED)
            elif action_type in ["increase", "increment"]:
                order_item = OrderItem.objects.get(id=serializer.validated_data["order_item"])
                order_item.quantity += int(serializer.validated_data["quantity"])
                order_item.save()
                order_item.item_total = Decimal(order_item.quantity) * Decimal(order_item.inventory_item.selling_price)
                order_item.save()

                order_item.refresh_from_db()
                order_item.order.refresh_total_amount()
                order_item.order.save()
                return Response({"success": "Order item increased successfully"}, status=status.HTTP_201_CREATED)
            
            elif action_type in ["decrease", "decrement"]:
                order_item = OrderItem.objects.get(id=serializer.validated_data["order_item"])
                order_item.quantity -= int(serializer.validated_data["quantity"])
                order_item.save()
                order_item.item_total = Decimal(order_item.quantity) * Decimal(order_item.inventory_item.selling_price)
                order_item.save()

                order_item.refresh_from_db()
                order_item.order.refresh_total_amount()
                return Response({"success": "Order item decreased successfully"}, status=status.HTTP_201_CREATED)
            else:
                return Response({"failed": "The action you provided is unknown here!!"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class CreateOrderItemsAPIView(generics.CreateAPIView):
    serializer_class = CreateOrderItemsSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid(raise_exception=True):
            order = Order.objects.get(id=serializer.validated_data.get("order"))
            item = serializer.validated_data["item"]

            order_item = OrderItem.objects.filter(order=order, inventory_item__id=item["id"]).first()
            if order_item:
                order_item.quantity += item["quantity"]
                order_item.item_total += item["item_total"]
                order_item.save()
            else:
                OrderItem.objects.create(
                    business=request.user.business,
                    order=order,
                    inventory_item_id=item["id"],
                    quantity=item["quantity"],
                    item_total=item["item_total"]
                )
            order.refresh_total_amount()
            return Response({"success": "Order items added successfully!!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)