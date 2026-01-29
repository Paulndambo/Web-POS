from django.db import models

from core.models import AbstractBaseModel

# Create your models here.
class StoreLoan(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.CASCADE, null=True, blank=True)
    branch = models.ForeignKey("core.Branch", on_delete=models.CASCADE, null=True, blank=True)
    customer = models.ForeignKey("customers.LoyaltyCard", on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    issued_date = models.DateField(auto_now_add=True)
    issued_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Store Loan of {self.total_amount} for {self.customer}"
    

    @property
    def outstanding_amount(self):
        return self.total_amount - self.amount_paid
    

class StoreLoanRepayment(AbstractBaseModel):
    loan = models.ForeignKey(StoreLoan, on_delete=models.CASCADE, related_name="repayments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    repayment_date = models.DateField(auto_now_add=True)
    received_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    channel = models.CharField(max_length=100, default="Cash", choices=[
        ("Cash", "Cash"),
        ("Credit Card", "Credit Card"),
        ("Bank Transfer", "Bank Transfer"),
        ("Mobile Money", "Mobile Money"),
        ("Cheque", "Cheque"),
    ])

    def __str__(self):
        return f"Repayment of {self.amount} for Loan ID {self.loan.id}"
    

class StoreLoanLog(AbstractBaseModel):
    loan = models.ForeignKey(StoreLoan, on_delete=models.CASCADE, related_name="loanawards")
    action = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    performed_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Log for Loan ID {self.loan.id} - {self.action}"


class Expense(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.CASCADE, null=True, blank=True)
    branch = models.ForeignKey("core.Branch", on_delete=models.CASCADE, null=True, blank=True)
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
    


class BusinessSubscription(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.CASCADE)
    branch = models.ForeignKey("core.Branch", on_delete=models.CASCADE, null=True, blank=True)
    pricing_plan = models.ForeignKey(PricingPlan, on_delete=models.CASCADE)
    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.business.name} - {self.pricing_plan.name}"