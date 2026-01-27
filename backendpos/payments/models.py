from django.db import models
from decimal import Decimal

from core.models import AbstractBaseModel
# Create your models here.
class Payment(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businesspayments")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchpayments")
    order = models.ForeignKey("orders.Order", on_delete=models.SET_NULL, null=True, related_name="orderpayments")
    invoice = models.ForeignKey("invoices.Invoice", on_delete=models.SET_NULL, null=True, related_name="invoicepayments")
    customer_name = models.CharField(max_length=255, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    amount_received = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    change = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    split_cash_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    split_mobile_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    status = models.CharField(max_length=255)
    payment_date = models.DateField()
    receipt_number = models.CharField(max_length=255, null=True)
    mobile_number = models.CharField(max_length=255, null=True)
    payment_method = models.CharField(max_length=255, null=True)
    mobile_network = models.CharField(max_length=255, null=True)
    direction = models.CharField(max_length=255, default="Incoming")


