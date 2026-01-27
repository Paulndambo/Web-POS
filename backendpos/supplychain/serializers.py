from rest_framework import serializers
from supplychain.models import Supplier, ProductSupplier, SupplyRequest, PurchaseOrder, PurchaseOrderItem

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class ProductSupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSupplier
        fields = '__all__'


class SupplyRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplyRequest
        fields = '__all__'




class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = PurchaseOrderItem
        fields = '__all__'



class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = '__all__'


class PurchaseOrderDetailSerializer(serializers.ModelSerializer):
    orderitems = PurchaseOrderItemSerializer(many=True, read_only=True)
    bussiness_name = serializers.CharField(source='business.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'


class PurchaseOrderItemCreateSerializer(serializers.Serializer):
    purchase_order = serializers.IntegerField()
    supply_request = serializers.IntegerField()
    quantity = serializers.IntegerField()


class PurchaseOrderItemUpdateSerializer(serializers.Serializer):
    purchase_order_item = serializers.IntegerField()
    action_type = serializers.ChoiceField(choices=['Increase', 'Decrease', 'Remove'])
    quantity = serializers.IntegerField(default=0)