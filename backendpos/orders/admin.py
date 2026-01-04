from django.contrib import admin

from orders.models import Order, OrderItem
# Register your models here.
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "customer_name", "order_number", "total_amount", "status", "sold_by", "created_at"]



@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ["id", "order", "inventory_item", "quantity", "item_total"]
