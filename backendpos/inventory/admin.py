from django.contrib import admin

from inventory.models import InventoryItem, Menu, Category, InventoryLog
# Register your models here.
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "created_at"]

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "business", "category", "barcode", "quantity", "buying_price", "selling_price", "created_at"]


@admin.register(InventoryLog)
class InventoryLogAdmin(admin.ModelAdmin):
    list_display = ["id", "item", "action_type", "quantity", "actioned_by", "created_at"]


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "quantity", "price", "created_at"]