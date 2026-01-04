from django.urls import path
from core.views import BusinessListCreateAPIView, BusinessDetailAPIView

urlpatterns = [
    path("businesses/", BusinessListCreateAPIView.as_view(), name="businesses"),
    path("businesses/<int:pk>/details/", BusinessDetailAPIView.as_view(), name="business-details"),
]