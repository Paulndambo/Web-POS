from rest_framework import serializers
from decimal import Decimal

from django.db import models
from customers.models import LoyaltyCard, LoyaltyCardRecharge, LoyaltyCardRedeem, GiftCard, GiftCardRedeem, GiftCardRecharge


class LoyaltyCardRedeemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyCardRedeem
        fields = "__all__"


class LoyaltyCardRechargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyCardRecharge
        fields = "__all__"



class LoyaltyCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyCard
        fields = "__all__"


class LoyaltyCardDetailSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    total_recharged = serializers.SerializerMethodField()
    total_redeemed = serializers.SerializerMethodField()


    class Meta:
        model = LoyaltyCard
        fields = "__all__"

    
    def get_total_recharged(self, obj):
        return obj.recharges.aggregate(total=models.Sum('amount'))['total'] or Decimal('0')
    
    def get_total_redeemed(self, obj):
        return obj.redeems.aggregate(total=models.Sum('amount'))['total'] or Decimal('0')

class LoyaltyCardUpdateSerializer(serializers.Serializer):
    card_number = serializers.CharField(max_length=255)
    card_id = serializers.IntegerField()
    action_type = serializers.CharField(max_length=255)
    quantity = serializers.IntegerField()
    money_spend = serializers.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))


class GiftCardRedeemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftCardRedeem
        fields = "__all__"


class GiftCardRechargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftCardRecharge
        fields = "__all__"


class GiftCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftCard
        fields = "__all__"


class GiftCardDetailSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    class Meta:
        model = GiftCard
        fields = "__all__"


class GiftCardUpdateSerializer(serializers.Serializer):
    card_number = serializers.CharField(max_length=255)
    action_type = serializers.CharField(max_length=255)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))