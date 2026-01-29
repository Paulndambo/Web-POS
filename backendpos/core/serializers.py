from rest_framework import serializers

from core.models import Business, Branch

class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = "__all__"



class BranchSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='branch_manager.get_full_name', read_only=True)
    class Meta:
        model = Branch
        fields = "__all__"



class BusinessOnboardingSerializer(serializers.Serializer):
    business_details = serializers.DictField()
    branch_details = serializers.DictField()
    manager_details = serializers.DictField()
    pricing_plan = serializers.DictField()