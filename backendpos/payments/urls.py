from django.urls import path

from payments.views import PaymentAPIView

urlpatterns = [
    path("", PaymentAPIView.as_view(), name="payments")
]