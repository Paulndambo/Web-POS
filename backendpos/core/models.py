from django.db import models

# Create your models here.
class AbstractBaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True



class Business(AbstractBaseModel):
    name = models.CharField(max_length=255)
    owner_name = models.CharField(max_length=255, null=True)
    address = models.TextField()
    city = models.CharField(max_length=255, null=True)
    country = models.CharField(max_length=255, default="Kenya")
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(null=True, blank=True)
    currency = models.CharField(max_length=10, default='KES')
    business_type = models.CharField(max_length=255, null=True)
    tax_number = models.CharField(max_length=255, null=True)
    status = models.CharField(max_length=255, default="Active")

    def __str__(self):
        return self.name
    

class Branch(AbstractBaseModel):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="branches")
    name = models.CharField(max_length=255)
    address = models.TextField()
    city = models.CharField(max_length=255, null=True)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(null=True, blank=True)
    status = models.CharField(max_length=255, default="Active")
    branch_manager = models.OneToOneField('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_branch')

    def __str__(self):
        return f"{self.name} - {self.business.name}"