from django.contrib import admin

from core.models import Business

# Register your models here.
@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "address", "email", "phone_number", "email", "currency"]
