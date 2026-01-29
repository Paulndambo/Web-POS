from django.contrib import admin

from invoices.models import Invoice, InvoiceItem, SupplierInvoice
# Register your models here.
@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["id", "customer_name", "phone_number", "email", "total_amount", "status"]


@admin.register(InvoiceItem)
class InvoiceItem(admin.ModelAdmin):
    list_display = ['id', 'invoice', 'item', 'quantity']


@admin.register(SupplierInvoice)
class SupplierInvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'supplier', 'invoice_number', 'total_amount', 'amount_paid', 'status']
