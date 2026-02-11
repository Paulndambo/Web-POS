from django.urls import path

from payments.views import (
    PaymentAPIView,
    BNPLInstallmentPaymentAPIView, MakeBNPLPaymentAPIView
)

urlpatterns = [
    path("", PaymentAPIView.as_view(), name="payments"),
    path("bnpl-payments/", BNPLInstallmentPaymentAPIView.as_view(), name="bnpl-payments"),
    path("make-bnpl-payment/", MakeBNPLPaymentAPIView.as_view(), name="make-bnpl-payment"),
]