from django.contrib import admin

from inventory.models import InventoryItem
# Register your models here.
@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "category", "barcode", "quantity", "price", "created_at"]