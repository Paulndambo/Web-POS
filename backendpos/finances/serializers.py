from rest_framework import serializers

from finances.models import StoreCredit, Expense, PricingPlan

class StoreCreditSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreCredit
        fields = "__all__"


class ExpenseSerializer(serializers.ModelSerializer):
    creator = serializers.CharField(source='actioned_by.get_full_name', read_only=True)
    class Meta:
        model = Expense
        fields = "__all__"


class PricingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingPlan
        fields = "__all__"