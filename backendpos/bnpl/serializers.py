from rest_framework import serializers
from .models import BNPLServiceProvider, BNPLPurchase, BNPLInstallment


class BNPLInstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BNPLInstallment
        fields = '__all__'


class BNPLPurchaseSerializer(serializers.ModelSerializer):
    customer_name=serializers.CharField(source="customer.customer_name", read_only=True)
    class Meta:
        model = BNPLPurchase
        fields = '__all__'


class BNPLPurchaseDetailSerializer(serializers.ModelSerializer):
    customer_name=serializers.CharField(source="customer.customer_name", read_only=True)
    installments = BNPLInstallmentSerializer(many=True)
    class Meta:
        model = BNPLPurchase
        fields = '__all__'


class BNPLServiceProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = BNPLServiceProvider
        fields = '__all__'


class BNPLServiceProviderDetailSerializer(serializers.ModelSerializer):
    business_name=serializers.CharField(source="business.name", read_only=True)
    branch_name=serializers.CharField(source="branch.name", read_only=True)
    bnpl_purchases = BNPLPurchaseSerializer(many=True)
    class Meta:
        model = BNPLServiceProvider
        fields = '__all__'