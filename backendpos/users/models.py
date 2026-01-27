from django.db import models

from core.models import AbstractBaseModel
from django.contrib.auth.models import AbstractUser
# Create your models here.
USER_ROLES = (
    ("Admin", "Admin"),
    ("Cashier", "Cashier"),
    ("Manager", "Manager"),
)

class User(AbstractUser, AbstractBaseModel):
    role = models.CharField(max_length=50, default="Cashier")
    business = models.ForeignKey('core.Business', on_delete=models.CASCADE, null=True, blank=True, related_name="businessusers")
    branch = models.ForeignKey('core.Branch', on_delete=models.CASCADE, null=True, blank=True, related_name="branchusers")
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    status = models.CharField(max_length=255, default="Active")

    def __str__(self):
        return self.username
    
    def name(self):
        return self.get_full_name()
    
