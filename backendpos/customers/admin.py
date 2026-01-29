from django.contrib import admin
from customers.models import LoyaltyCard, GiftCard, LoyaltyCardRecharge, LoyaltyCardRedeem, GiftCardRedeem, GiftCardRecharge
# Register your models here.
@admin.register(LoyaltyCard)
class LoyaltyCardAdmin(admin.ModelAdmin):
    list_display = ["id", "customer_name", "card_number", "points", "available_credit", "credit_limit", "created_at"]


@admin.register(LoyaltyCardRecharge)
class LoyaltyCardRechargeAdmin(admin.ModelAdmin):
    list_display = ["id", "card", "amount", "created_at"]


@admin.register(LoyaltyCardRedeem)
class LoyaltyCardRedeemAdmin(admin.ModelAdmin):
    list_display = ["id", "card", "amount", "created_at"]


@admin.register(GiftCard)
class GiftCardAdmin(admin.ModelAdmin):
    list_display = ["id", "business", "card_number", "issuer", "amount", "created_at"]


@admin.register(GiftCardRedeem)
class GiftCardRedeemAdmin(admin.ModelAdmin):
    list_display = ["id", "card", "amount", "created_at"]



@admin.register(GiftCardRecharge)
class GiftCardRechargeAdmin(admin.ModelAdmin):
    list_display = ["id", "card", "amount", "created_at"]