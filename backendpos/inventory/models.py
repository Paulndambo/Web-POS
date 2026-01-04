from django.db import models

from core.models import AbstractBaseModel

# Create your models here.
class Category(AbstractBaseModel):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class InventoryItem(AbstractBaseModel):
    barcode = models.CharField(max_length=255, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name
    