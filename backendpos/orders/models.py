from django.db import models
from decimal import Decimal

from core.models import AbstractBaseModel
# Create your models here.
ORDER_TYPES = [
    ("BNPL", "BNPL"),
    ("Paid", "Paid"),
]

class Order(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.CASCADE, related_name="businessorders")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchorders")
    order_number = models.CharField(max_length=100, unique=True)
    customer_name = models.CharField(max_length=255, null=True, blank=True)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    sub_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    amount_received = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    change = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    status = models.CharField(max_length=50)
    sold_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, related_name="orders")
    order_type = models.CharField(max_length=50, default="Paid", choices=ORDER_TYPES)

    def __str__(self):
        return self.order_number
    
    def refresh_status(self):
        if Decimal(self.amount_received) == Decimal(self.total_amount) or Decimal(self.amount_received) >= Decimal(self.total_amount):
            self.status = "Paid"
            self.save()
        elif Decimal(self.amount_received) >= Decimal('0'):
            self.status = "Partially Paid"
            self.save()
        else:
            self.status = "Pending"
            self.save()

    def refresh_total_amount(self):
        self.sub_total = sum(self.items.values_list("item_total", flat=True))
        self.tax = Decimal(sum(self.items.values_list("item_total", flat=True))) * Decimal(0.08)
        self.total_amount = sum(self.items.values_list("item_total", flat=True)) + (Decimal(sum(self.items.values_list("item_total", flat=True))) * Decimal(0.08))
        self.save()

class OrderItem(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.CASCADE)
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    inventory_item = models.ForeignKey("inventory.InventoryItem", on_delete=models.SET_NULL, null=True)
    menu_item = models.ForeignKey("inventory.Menu", on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField()
    item_total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Order: {self.order.order_number}"