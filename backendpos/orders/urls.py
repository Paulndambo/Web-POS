from django.urls import path
from orders.views import (
    POSOrderPlacementAPIView, OrderAPIView, 
    OrderDetailAPIView, PayOrderAPIView,
    CreateOrderItemsAPIView, OrderItemUpdateAPIView, OrderItemAPIView
)

urlpatterns = [
    path("", OrderAPIView.as_view(), name="orders"),
    path("<int:pk>/details/", OrderDetailAPIView.as_view(), name="order-details"),
    path("pos-place-order/", POSOrderPlacementAPIView.as_view(), name="pos-place-order"),
    path("pay-order/", PayOrderAPIView.as_view(), name="pay-order"),
    path("update-order-items/", OrderItemUpdateAPIView.as_view(), name="update-order-items"),
    path("create-order-items/", CreateOrderItemsAPIView.as_view(), name="create-order-items"),
    path("order-items/", OrderItemAPIView.as_view(), name="order-items")
]