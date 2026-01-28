from django.db import models
from decimal import Decimal
from django.core.exceptions import ValidationError

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



class BusinessLedger(AbstractBaseModel):

    class Source(models.TextChoices):
        ORDER = "ORDER", "Order"
        INVOICE = "INVOICE", "Invoice"
        PAYMENT = "PAYMENT", "Payment"
        EXPENSE = "EXPENSE", "Expense"
        ADJUSTMENT = "ADJUSTMENT", "Adjustment"

    class RecordType(models.TextChoices):
        DEBIT = "DEBIT", "Debit"
        CREDIT = "CREDIT", "Credit"

    class Reason(models.TextChoices):
        SALE = "SALE", "Sale"
        REFUND = "REFUND", "Refund"
        PAYMENT_RECEIVED = "PAYMENT_RECEIVED", "Payment Received"
        EXPENSE_PAID = "EXPENSE_PAID", "Expense Paid"
        WRITE_OFF = "WRITE_OFF", "Write-off"
        MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT", "Manual Adjustment"

    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="ledgers")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="ledgers")
    source = models.CharField(max_length=20, choices=Source.choices, null=True, blank=True)
    record_type = models.CharField(max_length=10, choices=RecordType.choices)
    date = models.DateField(db_index=True)
    description = models.CharField(max_length=255)
    reason = models.CharField(max_length=30, choices=Reason.choices, null=True, blank=True)
    debit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    credit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    class Meta:
        ordering = ["date", "created_at"]
        indexes = [
            models.Index(fields=["business", "date"]),
            models.Index(fields=["branch", "date"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(debit__gt=0, credit=0)
                    | models.Q(credit__gt=0, debit=0)
                ),
                name="only_one_of_debit_or_credit",
            )
        ]

    def clean(self):
        """
        Enforce logical consistency between record_type and amounts.
        """
        if self.record_type == self.RecordType.DEBIT and self.debit <= 0:
            raise ValidationError("Debit entries must have a debit amount > 0.")

        if self.record_type == self.RecordType.CREDIT and self.credit <= 0:
            raise ValidationError("Credit entries must have a credit amount > 0.")

    @property
    def amount(self):
        """
        Signed amount: Credit positive, Debit negative.
        """
        return self.credit - self.debit

    def __str__(self):
        return (
            f"{self.date} | {self.record_type} | "
            f"{self.amount} | {self.description}"
        )


class SupplierPayment(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businesssupplierpayments")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchsupplierpayments")
    supplier = models.ForeignKey("supplychain.Supplier", on_delete=models.CASCADE, related_name="supplierpayments")
    supplier_invoice = models.ForeignKey("invoices.SupplierInvoice", on_delete=models.SET_NULL, null=True, related_name="supplierinvoicepayments")
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=255)
    reference_number = models.CharField(max_length=255, null=True)

    def __str__(self):
        return f"Payment of {self.amount_paid} to {self.supplier.name}"