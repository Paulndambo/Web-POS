from django.db import models
from decimal import Decimal

from core.models import AbstractBaseModel

# Create your models here.
class Category(AbstractBaseModel):
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=255, null=True)

    def __str__(self):
        return self.name

class InventoryItem(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True)
    barcode = models.CharField(max_length=255, null=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    buying_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))

    def __str__(self):
        return self.name
    

class InventoryLog(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True)
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True)
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=255)
    quantity = models.IntegerField(default=0)
    actioned_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)
    

class Menu(AbstractBaseModel):
    name = models.CharField(max_length=255)
    quantity = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)