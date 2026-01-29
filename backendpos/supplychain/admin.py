from django.contrib import admin


from supplychain.models import Supplier, ProductSupplier, SupplyRequest, PurchaseOrder, PurchaseOrderItem
# Register your models here.
@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("id","name", "business", "branch", "email", "phone_number", "status", "lead_time_days", "payment_terms")
    search_fields = ("name", "email", "phone_number")


@admin.register(ProductSupplier)
class ProductSupplierAdmin(admin.ModelAdmin):
    list_display = ("id","product", "business", "branch", "supplier", "supplier_product_code", "cost_price", "moq")
    search_fields = ("product__name", "supplier__name", "supplier_product_code")

@admin.register(SupplyRequest)
class SupplyRequestAdmin(admin.ModelAdmin):
    list_display = ("id","product", "business", "branch", "quantity", "requested_by", "status", "created_at")
    search_fields = ("product__name", "requested_by__username", "status")

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ("id", "supplier", "business", "branch", "order_date", "expected_delivery_date", "status", "total_amount")
    search_fields = ("supplier__name", "status")


@admin.register(PurchaseOrderItem)
class PurchaseOrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "business", "purchase_order", "product", "quantity", "unit_cost", "received_quantity")
    search_fields = ("purchase_order__id", "product__name")