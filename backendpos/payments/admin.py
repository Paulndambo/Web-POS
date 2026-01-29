from django.contrib import admin

from payments.models import Payment, BusinessLedger
# Register your models here.
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["id", "order", "invoice", "payment_method", "amount_received", "created_at"]


@admin.register(BusinessLedger)
class BusinessLedgerAdmin(admin.ModelAdmin):
    list_display = ["id", "business", "branch", "record_type", "date", "debit", "credit", "created_at"]