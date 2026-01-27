from rest_framework import serializers
from payments.models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    paid_by = serializers.SerializerMethodField()
    class Meta:
        model = Payment
        fields = ["id", "paid_by", "receipt_number", "payment_method", "amount_received", "status", "direction", "created_at"]

    def get_paid_by(self, obj):
        return obj.invoice.customer_name if obj.invoice else "One-Time Customer"
