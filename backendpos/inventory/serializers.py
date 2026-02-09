from rest_framework import serializers

from inventory.models import InventoryItem, Category, Menu, InventoryLog



class CategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    class Meta:
        model = Category
        fields = "__all__"

    def get_items_count(self, obj):
        return obj.products.count()


class InventoryItemSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    class Meta:
        model = InventoryItem
        fields = "__all__"
        read_only_files = ("category_name", )

    def get_category_name(self, obj):
        return obj.category.name
    

class MenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = Menu
        fields = "__all__"


class StockRestokSerializer(serializers.Serializer):
    inventory_item_id = serializers.IntegerField()
    action_type = serializers.CharField(max_length=255)
    quantity = serializers.FloatField(default=1)



class InventoryLogSerializer(serializers.ModelSerializer):
    business = serializers.CharField(source="business.name", read_only=True)
    branch = serializers.CharField(source="branch.name", read_only=True)
    item = serializers.CharField(source="item.name", read_only=True)
    actioned_by = serializers.CharField(source="actioned_by.get_full_name", read_only=True)
    class Meta:
        model = InventoryLog
        fields = "__all__"