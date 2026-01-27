from django.urls import path
from inventory.views import (
    InventoryItemAPIView, InventoryItemDetailAPIView, 
    CategoryAPIView, CategoryDetailAPIView,
    MenuAPIView, MenuDetailAPIView,
    StockRestockAPIView
)   

urlpatterns = [
    path("", InventoryItemAPIView.as_view(), name="items"),
    path("<int:pk>/details/", InventoryItemDetailAPIView.as_view(), name="item-details"),
    path("categories/", CategoryAPIView.as_view(), name="categories"),
    path("categories/<int:pk>/details/", CategoryDetailAPIView.as_view(), name="category-details"),

    path("menus/", MenuAPIView.as_view(), name="menus"),
    path("menus/<int:pk>/details/", MenuDetailAPIView.as_view(), name="menu-details"),
    path("update-stock-item/", StockRestockAPIView.as_view(), name="update-stock-item")
]