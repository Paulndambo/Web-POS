from django.contrib import admin

from finances.models import StoreLoan, Expense, StoreLoanLog, StoreLoanRepayment, PricingPlan
# Register your models here.


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("id", "description", "amount", "actioned_by", "created_at")
    search_fields = ("description", "actioned_by__username", "actioned_by__email")
    list_filter = ("created_at",)


@admin.register(StoreLoan)
class StoreLoanAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "amount_paid", "total_amount", "issued_by", "created_at")
    search_fields = ("customer__customer_name", "issued_by__username", "issued_by__email")
    list_filter = ("created_at",)


@admin.register(StoreLoanLog)
class StoreLoanLogAdmin(admin.ModelAdmin):
    list_display = ("id", "loan", "amount", "action", "created_at")


@admin.register(StoreLoanRepayment)
class StoreLoanRepaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "loan", "amount", "channel", "created_at")
    

@admin.register(PricingPlan)
class PricingPlan(admin.ModelAdmin):
    list_display = ["id", "name", "cost", "pilot_period", "duration_days"]