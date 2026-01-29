from rest_framework import serializers

from orders.models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "item_name", "unit_price", "quantity", "item_total"]

    
    def get_item_name(self, obj):
        return obj.inventory_item.name
    

    def get_unit_price(self, obj):
        return obj.inventory_item.selling_price if obj.inventory_item else obj.menu_item.price



class OrderSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()
    seller = serializers.SerializerMethodField()
    business_name = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = "__all__"
        

    def get_balance(self, obj):
        return obj.total_amount - obj.amount_received
    
    def get_seller(self, obj):
        return obj.sold_by.get_full_name() if obj.sold_by.first_name else obj.sold_by.username
    
    def get_business_name(self, obj):
        return obj.business.name
    
    def get_items_count(self, obj):
        return obj.items.count()
    

class OrderDetailSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True)
    payments = serializers.SerializerMethodField()
    seller = serializers.SerializerMethodField()
    business_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = "__all__"

    def get_balance(self, obj):
        return obj.total_amount - obj.amount_received
    

    def get_seller(self, obj):
        return obj.sold_by.get_full_name() if obj.sold_by.first_name else obj.sold_by.username
    
    def get_business_name(self, obj):
        return obj.business.name
    

    def get_payments(self, obj):
        return obj.orderpayments.values('id', 'payment_method', 'amount_received', 'change')


class PlacePOSOrderSerializer(serializers.Serializer):
    data = serializers.DictField()
    #items = serializers.JSONField(default=list)
    #subtotal = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    #tax = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    #total = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    #paymentMethod = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    #amountReceived = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    #change = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    #mobileNumber = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    #mobileNetwork = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    #splitCashAmount = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    #splitMobileAmount = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    #status = serializers.CharField(max_length=255)
    #date = serializers.DateField(required=False, allow_null=True)
    #receiptNo = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    #storeCreditCardNumber = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    #storeCreditUsed = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    #storeCreditBalance = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    #storeCreditCustomerId = serializers.IntegerField(required=False, allow_null=True)
    #storeCreditCustomerName = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    #loyalty_card = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    #bnplDownPayment = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    #bnplInstallments = serializers.IntegerField(default=0)
    #bnplInterval = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    #bnplCustomerId = serializers.IntegerField(required=False, allow_null=True)
    #bnplCustomerName = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    



class PayOrderSerializer(serializers.Serializer):
    order = serializers.IntegerField()
    paymentMethod = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    amountReceived = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    change = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    mobileNumber = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    mobileNetwork = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    splitCashAmount = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    splitMobileAmount = serializers.DecimalField(max_digits=100, decimal_places=2, default=0, required=False)
    status = serializers.CharField(max_length=255)
    date = serializers.DateField(required=False, allow_null=True)
    

class OrderItemUpdateSerializer(serializers.Serializer):
    order_item = serializers.IntegerField()
    action_type = serializers.CharField(max_length=255)
    quantity = serializers.IntegerField(default=0)


class CreateOrderItemsSerializer(serializers.Serializer):
    order = serializers.IntegerField()
    item = serializers.JSONField(default=dict)