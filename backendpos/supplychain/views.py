from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, status

from django.utils import timezone

from django.db import transaction

from supplychain.models import Supplier, ProductSupplier, SupplyRequest, PurchaseOrder, PurchaseOrderItem
from supplychain.serializers import (
    SupplierSerializer,
    ProductSupplierSerializer,
    SupplyRequestSerializer,
    PurchaseOrderSerializer,
    PurchaseOrderDetailSerializer,
    PurchaseOrderItemCreateSerializer,
    PurchaseOrderItemUpdateSerializer,
    ReceivePurchaseOrderItemSerializer,
    PurchaseOrderItemSerializer
)
from inventory.models import InventoryItem, InventoryLog
from invoices.models import SupplierInvoice, SupplierInvoiceItem
# Create your views here.
class SupplierListCreateView(generics.ListCreateAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]


class SupplierRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"


class ProductSupplierListCreateView(generics.ListCreateAPIView):
    queryset = ProductSupplier.objects.all()
    serializer_class = ProductSupplierSerializer
    permission_classes = [IsAuthenticated]


    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            supplier = serializer.save()
            supplier.product.buying_price = supplier.cost_price
            supplier.product.save()
            return Response({"detail": "Product Supplier created successfully.", "id": supplier.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductSupplierRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductSupplier.objects.all()
    serializer_class = ProductSupplierSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"

    def perform_update(self, serializer):
        with transaction.atomic():
            product_supplier = serializer.save()

            # Ensure related product exists
            if product_supplier.product:
                product_supplier.product.buying_price = product_supplier.cost_price
                product_supplier.product.save(update_fields=["buying_price"])


class SupplyRequestListCreateView(generics.ListCreateAPIView):
    queryset = SupplyRequest.objects.all()
    serializer_class = SupplyRequestSerializer
    permission_classes = [IsAuthenticated]


class SupplyRequestRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SupplyRequest.objects.all()
    serializer_class = SupplyRequestSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"


class PurchaseOrderListCreateView(generics.ListCreateAPIView):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]


class PurchaseOrderRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"


class PurchaseOrderItemListView(generics.ListAPIView):
    queryset = PurchaseOrderItem.objects.filter(status="Pending", purchase_order__status="Completed")
    serializer_class = PurchaseOrderItemSerializer
    permission_classes = [IsAuthenticated]


class PurchaseOrderItemCreateView(generics.CreateAPIView):
    serializer_class = PurchaseOrderItemCreateSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid(raise_exception=True):

            purchase_order_id = serializer.validated_data["purchase_order"]
            supply_request_id = serializer.validated_data["supply_request"]
            quantity = serializer.validated_data["quantity"]

            try:
                purchase_order = PurchaseOrder.objects.get(id=purchase_order_id)
                supply_request = SupplyRequest.objects.get(id=supply_request_id)

                product = InventoryItem.objects.get(id=supply_request.product.id)
                product_supplier = ProductSupplier.objects.filter(product=product, supplier=purchase_order.supplier).first()

            except (PurchaseOrder.DoesNotExist, SupplyRequest.DoesNotExist, InventoryItem.DoesNotExist):
                return Response({"detail": "Purchase Order or Product not found."}, status=status.HTTP_404_NOT_FOUND)

            item_total = product_supplier.cost_price * quantity if product_supplier else product.buying_price * quantity

            PurchaseOrderItem.objects.create(
                purchase_order=purchase_order,
                product=product,
                quantity=quantity,
                unit_cost=product_supplier.cost_price if product_supplier else product.buying_price,
                item_total=item_total,
            )

            # Update total amount in PurchaseOrder
            purchase_order.total_amount += item_total
            purchase_order.save()

            supply_request.status = "Added to PO"
            supply_request.save()

            return Response({"detail": "Purchase Order Item created successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class PurchaseOrderItemUpdateView(generics.CreateAPIView):
    serializer_class = PurchaseOrderItemUpdateSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid(raise_exception=True):

            purchase_order_item_id = serializer.validated_data["purchase_order_item"]
            action_type = serializer.validated_data["action_type"]
            quantity = serializer.validated_data.get("quantity", 0)

            try:
                poi = PurchaseOrderItem.objects.get(id=purchase_order_item_id)
                purchase_order = poi.purchase_order
            except PurchaseOrderItem.DoesNotExist:
                return Response({"detail": "Purchase Order Item not found."}, status=status.HTTP_404_NOT_FOUND)

            if action_type == "Increase":
                poi.quantity += quantity
            elif action_type == "Decrease":
                poi.quantity = max(1, poi.quantity - quantity)
            elif action_type == "Remove":
                purchase_order.total_amount -= poi.item_total
                purchase_order.save()

                supply_request = SupplyRequest.objects.filter(
                    product=poi.product
                ).first()

                if supply_request:
                    supply_request.status = "Pending"
                    supply_request.save()
                

                poi.delete()
                return Response({"detail": "Purchase Order Item removed successfully."}, status=status.HTTP_200_OK)

            poi.item_total = poi.unit_cost * poi.quantity
            poi.save()

            # Recalculate total amount in PurchaseOrder
            total_amount = sum(item.item_total for item in purchase_order.orderitems.all())
            purchase_order.total_amount = total_amount
            purchase_order.save()
            return Response({"detail": "Purchase Order Item updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class ReceivePurchaseOrderItemView(generics.CreateAPIView):
    serializer_class = ReceivePurchaseOrderItemSerializer

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid(raise_exception=True):
            purchase_order_item_id = serializer.validated_data["purchase_order_item"]
            received_quantity = serializer.validated_data["received_quantity"]

            try:
                poi = PurchaseOrderItem.objects.get(id=purchase_order_item_id)
                purchase_order = poi.purchase_order
            except PurchaseOrderItem.DoesNotExist:
                return Response({"detail": "Purchase Order Item not found."}, status=status.HTTP_404_NOT_FOUND)
            if received_quantity > poi.quantity:
                return Response({"detail": "Received quantity cannot exceed ordered quantity."}, status=status.HTTP_400_BAD_REQUEST)
            
            poi.received_quantity += received_quantity
            poi.save()

            poi.product.quantity += received_quantity
            poi.product.save()

            InventoryLog.objects.create(
                business=purchase_order.business,
                branch=purchase_order.branch,
                item=poi.product,
                quantity=received_quantity,
                action="Received",
                actioned_by=request.user
            )

            # Create or update SupplierInvoice
            supplier_invoice, created = SupplierInvoice.objects.get_or_create(
                purchase_order=purchase_order,
                defaults={
                    "business": purchase_order.business,
                    "branch": purchase_order.branch,
                    "supplier": purchase_order.supplier,
                    "invoice_date": timezone.now().date(),
                    "total_amount": 0,
                },
            )

            item_total = poi.unit_cost * received_quantity
            SupplierInvoiceItem.objects.create(
                invoice=supplier_invoice,
                product=poi.product,
                quantity=received_quantity,
                unit_cost=poi.unit_cost,
                item_total=item_total,
            )
            supplier_invoice.total_amount += item_total
            supplier_invoice.invoice_number = f"INV-{purchase_order.id}"
            supplier_invoice.save()
            supplier_invoice.refresh_total_amount()
            
            poi.status = "Received" if poi.quantity > poi.received_quantity else "Partially Received"
            poi.save()


            return Response({"detail": "Purchase Order Item received successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)