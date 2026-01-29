from django.db import models
from decimal import Decimal

from core.models import AbstractBaseModel
# Create your models here.
class BNPLServiceProvider(AbstractBaseModel):
    business=models.ForeignKey("core.Business", on_delete=models.CASCADE, related_name="bnpl_service_providers")
    branch=models.ForeignKey("core.Branch", on_delete=models.CASCADE, related_name="bnpl_service_providers")
    down_payment_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    interest_rate_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    name = models.CharField(max_length=255, unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name


class BNPLPurchase(AbstractBaseModel):
    business=models.ForeignKey("core.Business", on_delete=models.CASCADE, related_name="bnpl_purchases")
    branch=models.ForeignKey("core.Branch", on_delete=models.CASCADE, related_name="bnpl_purchases")
    customer = models.ForeignKey("customers.LoyaltyCard", on_delete=models.CASCADE)
    service_provider = models.ForeignKey(BNPLServiceProvider, on_delete=models.CASCADE)
    order = models.ForeignKey("orders.Order", on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    down_payment = models.DecimalField(max_digits=10, decimal_places=2)
    bnpl_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    purchase_date = models.DateTimeField(auto_now_add=True)
    number_of_installments = models.PositiveIntegerField()
    payment_interval_days = models.PositiveIntegerField()
    installment_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    status = models.CharField(max_length=50, default="Active")

    def __str__(self):
        return f"Purchase {self.id} by {self.customer.customer_name} from {self.service_provider.name}"



class BNPLInstallment(AbstractBaseModel):
    business=models.ForeignKey("core.Business", on_delete=models.CASCADE, related_name="bnpl_installments")
    branch=models.ForeignKey("core.Branch", on_delete=models.CASCADE, related_name="bnpl_installments")
    purchase = models.ForeignKey(BNPLPurchase, on_delete=models.CASCADE, related_name="installments")
    amount_expected = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    due_date = models.DateTimeField()
    paid_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=50, default="Pending")

    def __str__(self):
        return f"Installment {self.id} for Purchase {self.purchase.id}"