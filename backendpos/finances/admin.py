from django.contrib import admin

from finances.models import StoreCredit, Expense

# Register your models here.


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("id", "description", "amount", "actioned_by", "created_at")
    search_fields = ("description", "actioned_by__username", "actioned_by__email")
    list_filter = ("created_at",)