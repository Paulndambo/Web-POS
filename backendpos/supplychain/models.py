from django.db import models
from decimal import Decimal

from core.models import AbstractBaseModel
# Create your models here.
class Supplier(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businesssuppliers")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchsuppliers")
    name = models.CharField(max_length=255)
    email = models.EmailField(null=True)
    phone_number = models.CharField(max_length=255)
    address = models.CharField(max_length=255, null=True)
    status = models.CharField(max_length=50, default="Active")
    lead_time_days = models.IntegerField(default=0)
    payment_terms = models.CharField(max_length=255, null=True)

    def __str__(self):
        return self.name


class ProductSupplier(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businessproductsuppliers")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchproductsuppliers")
    product = models.ForeignKey("inventory.InventoryItem", on_delete=models.CASCADE, related_name="productsuppliers")
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="suppliedproducts")
    supplier_product_code = models.CharField(max_length=255, null=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    moq = models.IntegerField(default=1)  # Minimum Order Quantity

    def __str__(self):
        return f"{self.product.name} - {self.supplier.name}"
    

class SupplyRequest(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businesssupplyrequests")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchsupplyrequests")
    product = models.ForeignKey("inventory.InventoryItem", on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    requested_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=50, default="Pending")

    def __str__(self):
        return f"Supply Request for {self.product.name} - {self.quantity}"


class PurchaseOrder(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businesspurchaseorders")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchpurchaseorders")
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="purchaseorders")
    order_date = models.DateField()
    expected_delivery_date = models.DateField(null=True)
    status = models.CharField(max_length=50, default="Pending")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))

    def __str__(self):
        return f"PO #{self.id} - {self.supplier.name}"
    
    
class PurchaseOrderItem(AbstractBaseModel):
    business = models.ForeignKey("core.Business", on_delete=models.SET_NULL, null=True, related_name="businesspurchaseorderitems")
    branch = models.ForeignKey("core.Branch", on_delete=models.SET_NULL, null=True, related_name="branchpurchaseorderitems")
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="orderitems")
    product = models.ForeignKey("inventory.InventoryItem", on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    received_quantity = models.IntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    item_total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, default="Pending")

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
    
