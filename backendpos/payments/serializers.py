from rest_framework import serializers
from payments.models import Payment, CustomerInvoicePayment


class PaymentSerializer(serializers.ModelSerializer):
    paid_by = serializers.SerializerMethodField()
    class Meta:
        model = Payment
        fields = ["id", "paid_by", "receipt_number", "payment_method", "amount_received", "status", "direction", "created_at"]

    def get_paid_by(self, obj):
        return obj.invoice.customer_name if obj.invoice else "One-Time Customer"


class CustomerInvoicePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerInvoicePayment
        fields = ["id", "amount_paid", "payment_method", "created_at"]


class MpesaCallbackSerializer(serializers.Serializer):
    Body = serializers.JSONField()


class MpesaSTKPushSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)



class ConfirmPaymentSerializer(serializers.Serializer):
    MerchantRequestID = serializers.CharField(max_length=255)
    CheckoutRequestID = serializers.CharField(max_length=255)


class BNPLInstallmentPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "installment", "amount_received", "payment_method", "created_at"]


class MakeBNPLPaymentSerializer(serializers.Serializer):
    business = serializers.IntegerField()
    branch = serializers.IntegerField()
    loan = serializers.IntegerField()
    installment = serializers.IntegerField(required=False)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.CharField(max_length=50)
    receipt_number = serializers.CharField(max_length=255, required=False)
    payment_type = serializers.CharField(max_length=50)
    installments_count = serializers.IntegerField(required=False)