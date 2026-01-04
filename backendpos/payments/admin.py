from django.contrib import admin

from payments.models import Payment
# Register your models here.
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["id", "order", "invoice", "payment_method", "amount_received", "created_at"]
