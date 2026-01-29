from django.db import models
from decimal import Decimal

from core.models import AbstractBaseModel
# Create your models here.
class LoyaltyCard(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businessloyaltycards")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchloyaltycards")
    card_number = models.CharField(max_length=255)
    customer_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=255)
    customer_email = models.EmailField(null=True)
    amount_spend = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    points = models.FloatField(default=0)
    address = models.CharField(max_length=255, null=True)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('100000'))
    available_credit = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('100000'))
    credit_issued = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))


    def __str__(self):
        return self.customer_name
    

class LoyaltyCardRedeem(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businessloyaltycardredeems")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchloyaltycardredeems")
    card = models.ForeignKey(LoyaltyCard, on_delete=models.CASCADE, related_name="redeems")
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))

    def __str__(self):
        return self.card.card_number
    

class LoyaltyCardRecharge(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businessloyaltycardrecharges")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchloyaltycardrecharges")
    card = models.ForeignKey(LoyaltyCard, on_delete=models.CASCADE, related_name="recharges")
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))

    def __str__(self):
        return self.card.card_number


class GiftCard(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.CASCADE)
    branch = models.ForeignKey("core.Branch", on_delete=models.CASCADE, null=True)
    card_number = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255)
    partner_name = models.CharField(max_length=255, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    expiry_date = models.DateField()
    status = models.CharField(max_length=50, default="Active")  # e.g., active, redeemed, expired

    def __str__(self):
        return self.card_number
    

class GiftCardRedeem(AbstractBaseModel):
    card = models.ForeignKey(GiftCard, on_delete=models.CASCADE, related_name="redeems")
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))

    def __str__(self):
        return self.card.card_number
    

class GiftCardRecharge(AbstractBaseModel):
    card = models.ForeignKey(GiftCard, on_delete=models.CASCADE, related_name="recharges")
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))

    def __str__(self):
        return self.card.card_number