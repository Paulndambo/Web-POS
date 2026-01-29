from django.db import models

from core.models import AbstractBaseModel

# Create your models here.
class StoreCredit(AbstractBaseModel):
    customer = models.ForeignKey("customers.LoyaltyCard", on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    issued_date = models.DateField(auto_now_add=True)
    expiry_date = models.DateField(null=True, blank=True)
    issued_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Store Credit of {self.amount} for {self.customer}"


class Expense(AbstractBaseModel):
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date_incurred = models.DateField()
    category = models.CharField(max_length=100)
    actioned_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    channel = models.CharField(max_length=100, default="Bank Transfer", choices=[
        ("Cash", "Cash"),
        ("Credit Card", "Credit Card"),
        ("Bank Transfer", "Bank Transfer"),
        ("Mobile Money", "Mobile Money"),
        ("Cheque", "Cheque"),
    ])

    def __str__(self):
        return f"{self.description} - {self.amount}"
    


class PricingPlan(AbstractBaseModel):
    name = models.CharField(max_length=255)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    pilot_period = models.IntegerField(default=30)
    duration_days = models.IntegerField(default=30)

    def __str__(self):
        return self.name