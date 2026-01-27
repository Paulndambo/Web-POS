from django.urls import path
from customers.views import (
    LoyaltyCardAPIView,
    LoyaltyCardDetailAPIView,
    LoyaltyCardUpdateAPIView,
    GiftCardAPIView,
    GiftCardDetailAPIView,
    GiftCardUpdateAPIView
)

urlpatterns = [
    path("loyalty-cards/", LoyaltyCardAPIView.as_view(), name="loyalty-cards"),
    path("loyalty-cards/<int:pk>/details/", LoyaltyCardDetailAPIView.as_view(), name="loyalty-card-details"),
    path("loyalty-card-update/", LoyaltyCardUpdateAPIView.as_view(), name="loyalty-card-update"),
    path("gift-cards/", GiftCardAPIView.as_view(), name="gift-cards"),
    path("gift-cards/<int:pk>/details/", GiftCardDetailAPIView.as_view(), name="gift-card-details"),
    path("gift-card-update/", GiftCardUpdateAPIView.as_view(), name="gift-card-update"),
]