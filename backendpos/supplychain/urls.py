from django.urls import path

from supplychain.views import (
    SupplierListCreateView,
    SupplierRetrieveUpdateDestroyView,
    ProductSupplierListCreateView,
    ProductSupplierRetrieveUpdateDestroyView,
    SupplyRequestListCreateView,
    SupplyRequestRetrieveUpdateDestroyView,
    PurchaseOrderListCreateView,    
    PurchaseOrderRetrieveUpdateDestroyView,
    PurchaseOrderItemCreateView,
    PurchaseOrderItemUpdateView,
)

urlpatterns = [
    path("suppliers/", SupplierListCreateView.as_view(), name="supplier-list-create"),
    path("suppliers/<int:pk>/", SupplierRetrieveUpdateDestroyView.as_view(), name="supplier-detail"),
    path("productsuppliers/", ProductSupplierListCreateView.as_view(), name="productsupplier-list-create"),
    path("productsuppliers/<int:pk>/", ProductSupplierRetrieveUpdateDestroyView.as_view(), name="productsupplier-detail"),
    path("supplyrequests/", SupplyRequestListCreateView.as_view(), name="supplyrequest-list-create"),
    path("supplyrequests/<int:pk>/", SupplyRequestRetrieveUpdateDestroyView.as_view(), name="supplyrequest-detail"),
    path("purchaseorders/", PurchaseOrderListCreateView.as_view(), name="purchaseorder-list-create"),
    path("purchaseorders/<int:pk>/", PurchaseOrderRetrieveUpdateDestroyView.as_view(), name="purchaseorder-detail"),
    path("purchaseorderitems/create/", PurchaseOrderItemCreateView.as_view(), name="purchaseorderitem-create"),
    path("purchaseorderitems/update/", PurchaseOrderItemUpdateView.as_view(), name="purchaseorderitem-update"),
]