from decimal import Decimal
from rest_framework import serializers
from invoices.models import Invoice, InvoiceItem, SupplierInvoice, SupplierInvoiceItem
from payments.models import SupplierPayment

class InvoiceItemSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()
    class Meta:
        model = InvoiceItem
        fields = ["id", "item_name", "unit_price", "quantity", "item_total"]

    def get_item_name(self, obj):
        return obj.item.name
    

    def get_unit_price(self, obj):
        return obj.item.selling_price



class InvoiceSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ("balance", "items_count")

    
    def get_balance(self, obj):
        return obj.total_amount - obj.amount_paid
    
    def get_items_count(self, obj):
        return obj.invoiceitems.count()



class InvoiceDetailSerializer(serializers.ModelSerializer):
    invoiceitems = InvoiceItemSerializer(many=True)
    balance = serializers.SerializerMethodField()
    class Meta:
        model = Invoice
        fields = "__all__"

    def get_balance(self, obj):
        return obj.total_amount - obj.amount_paid


class CreateInvoiceSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=255)
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(max_length=255)
    address = serializers.CharField(max_length=255, required=False)
    due_date = serializers.DateField()
    invoice_number = serializers.CharField(max_length=255)
    items = serializers.JSONField(default=list)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2)
    sub_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)



class CreateInvoiceItemsSerializer(serializers.Serializer):
    invoice = serializers.IntegerField()
    items = serializers.JSONField(default=list)
    


class InvoiceItemUpdateSerializer(serializers.Serializer):
    invoice_item = serializers.IntegerField()
    action_type = serializers.CharField(max_length=255)
    amount = serializers.IntegerField(default=0)



class InvoicePaymentSerializer(serializers.Serializer):
    invoice = serializers.IntegerField()
    subtotal = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    tax = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    total = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    paymentMethod = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    amountReceived = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    change = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    mobileNumber = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    mobileNetwork = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    splitCashAmount = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    splitMobileAmount = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    status = serializers.CharField(max_length=255)
    date = serializers.DateField(required=False, allow_null=True)
    

class SupplierInvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = SupplierInvoiceItem
        fields = "__all__"


class SupplierInvoiceSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(source='branch.name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    class Meta:
        model = SupplierInvoice
        fields = "__all__"



class SupplierInvoiceDetailSerializer(serializers.ModelSerializer):
    invoiceitems = SupplierInvoiceItemSerializer(many=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    class Meta:
        model = SupplierInvoice
        fields = "__all__"



class SupplierInvoicePaymentSerializer(serializers.Serializer):
    supplier_invoice = serializers.IntegerField()
    amount_paid = serializers.DecimalField(max_digits=100, decimal_places=2)
    payment_date = serializers.DateField()
    payment_method = serializers.CharField(max_length=255)
    reference_number = serializers.CharField(max_length=255)