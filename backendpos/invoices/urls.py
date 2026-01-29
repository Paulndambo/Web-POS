from django.urls import path
from invoices.views import (
    InvoiceAPIView, InvoiceDetailAPIView, 
    InvoiceItemUpdateAPIView, CreateInvoiceItemsAPIView,
    InvoicePaymentAPIView,
    SupplierInvoiceAPIView, SupplierInvoiceDetailAPIView,
    SupplierInvoicePaymentAPIView
)

urlpatterns = [
    path("", InvoiceAPIView.as_view(), name="invoices"),
    path("<int:pk>/details/", InvoiceDetailAPIView.as_view(), name="invoice-details"),
    path("invoice-item-update/", InvoiceItemUpdateAPIView.as_view(), name="invoice-item-update"),
    path("new-invoice-items/", CreateInvoiceItemsAPIView.as_view(), name="new-invoice-items"),
    path("invoice-payment/", InvoicePaymentAPIView.as_view(), name="invoice-payment"),
    path("supplier-invoices/", SupplierInvoiceAPIView.as_view(), name="supplier-invoices"),
    path("supplier-invoices/<int:pk>/details/", SupplierInvoiceDetailAPIView.as_view(), name="supplier-invoice-details"),
    path("supplier-invoice-payment/", SupplierInvoicePaymentAPIView.as_view(), name="supplier-invoice-payment"),
]