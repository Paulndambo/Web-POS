from django.contrib import admin

from bnpl.models import BNPLServiceProvider, BNPLPurchase, BNPLInstallment
# Register your models here.
@admin.register(BNPLServiceProvider)
class BNPLServiceProviderAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "phone_number", "email", "website")

@admin.register(BNPLPurchase)
class BNPLPurchaseAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "service_provider", "total_amount", "payment_interval_days", "status")
    

@admin.register(BNPLInstallment)
class BNPLInstallmentAdmin(admin.ModelAdmin):
    list_display = ("id", "purchase", "amount_expected", "due_date", "status")
    
