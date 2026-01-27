from rest_framework import serializers
from decimal import Decimal

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
    recharges = LoyaltyCardRechargeSerializer(many=True)
    redeems = LoyaltyCardRedeemSerializer(many=True)
    class Meta:
        model = LoyaltyCard
        fields = "__all__"

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
    recharges = GiftCardRechargeSerializer(many=True)
    redeems = GiftCardRedeemSerializer(many=True)
    class Meta:
        model = GiftCard
        fields = "__all__"


class GiftCardUpdateSerializer(serializers.Serializer):
    card_number = serializers.CharField(max_length=255)
    action_type = serializers.CharField(max_length=255)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))