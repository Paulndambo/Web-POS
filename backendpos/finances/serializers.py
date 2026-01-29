from rest_framework import serializers

from finances.models import StoreLoan, Expense, PricingPlan, StoreLoanLog, StoreLoanRepayment
from customers.models import LoyaltyCard, LoyaltyCardRecharge, LoyaltyCardRedeem


class LoanRepaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreLoanRepayment
        fields = "__all__"

class LoanLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreLoanLog
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


class StoreCreditSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.customer_name', read_only=True)
    
    outstanding_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    class Meta:
        model = StoreLoan
        fields = ["id", "customer_name", "total_amount", "amount_paid", "outstanding_amount", "issued_date"]


class StoreCreditDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.customer_name', read_only=True)
    customer_email = serializers.CharField(source='customer.customer_email', read_only=True)
    customer_card_number = serializers.CharField(source='customer.card_number', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    issuer = serializers.CharField(source='issued_by.get_full_name', read_only=True)
    outstanding_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    repayments = LoanRepaymentSerializer(many=True)
    loanawards = LoanLogSerializer(many=True)
    class Meta:
        model = StoreLoan
        fields = "__all__"