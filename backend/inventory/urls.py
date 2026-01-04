from django.urls import path
from inventory.views import InventoryItemAPIView, InventoryItemDetailAPIView, CategoryAPIView

urlpatterns = [
    path("", InventoryItemAPIView.as_view(), name="items"),
    path("<int:pk>/details/", InventoryItemDetailAPIView.as_view(), name="item-details"),
    path("categories/", CategoryAPIView.as_view(), name="categories"),
]