from django.db import models
from decimal import Decimal

from core.models import AbstractBaseModel
from supplychain.models import Supplier
# Create your models here.
INVOICE_STATUSES = (
    ("Pending Payment", "Pending Payment"),
    ("Paid", "Paid"),
    ("Cancelled", "Cancelled"),
    ("Declined", "Declined"),
    ("Pending", "Pending"),
    ("Accepted", "Accepted"),
    ("Partially Paid", "Partially Paid")
)

class Invoice(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businessinvoices")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchinvoices")
    customer_name = models.CharField(max_length=255)
    email = models.EmailField(null=True)
    phone_number = models.CharField(max_length=255)
    address = models.CharField(max_length=255, null=True)
    due_date = models.DateField()
    invoice_number = models.CharField(max_length=255)
    status = models.CharField(max_length=255, default="Pending", choices=INVOICE_STATUSES)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    sub_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.customer_name} #{self.invoice_number}"
    

    def refresh_total_amount(self):
        self.sub_total = sum(self.invoiceitems.values_list("item_total", flat=True))
        self.tax = round(Decimal(self.sub_total) * Decimal(0.08), 2)
        self.total_amount = sum(self.invoiceitems.values_list("item_total", flat=True)) + self.tax
        self.save()


class InvoiceItem(AbstractBaseModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="invoiceitems")
    item = models.ForeignKey("inventory.InventoryItem", on_delete=models.CASCADE)
    quantity = models.FloatField(default=1)
    item_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))

    def __str__(self):
        return self.item.name
    


class SupplierInvoice(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businesssupplierinvoices")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchsupplierinvoices")
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="invoices")
    purchase_order = models.ForeignKey("supplychain.PurchaseOrder", on_delete=models.SET_NULL, null=True, related_name="supplierinvoices")
    invoice_number = models.CharField(max_length=255, null=True)
    invoice_date = models.DateField()
    due_date = models.DateField(null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    status = models.CharField(max_length=50, default="Unpaid")

    def __str__(self):
        return f"Invoice #{self.id} - {self.supplier.name}"
    

    def refresh_total_amount(self):
        self.total_amount = sum(self.invoiceitems.values_list("item_total", flat=True))
        self.save()


    @property
    def balance_due(self):
        return self.total_amount - self.amount_paid
    

class SupplierInvoiceItem(AbstractBaseModel):
    invoice = models.ForeignKey(SupplierInvoice, on_delete=models.CASCADE, related_name="invoiceitems")
    product = models.ForeignKey("inventory.InventoryItem", on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    item_total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
    