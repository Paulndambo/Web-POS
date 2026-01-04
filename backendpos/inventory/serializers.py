from rest_framework import serializers

from inventory.models import InventoryItem, Category



class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"

class InventoryItemSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    class Meta:
        model = InventoryItem
        fields = "__all__"
        read_only_files = ("category_name", )

    def get_category_name(self, obj):
        return obj.category.name
    

