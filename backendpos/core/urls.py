from django.urls import path
from core.views import (
    BranchDetailAPIView, BranchListCreateAPIView, 
    BusinessListCreateAPIView, BusinessDetailAPIView
)

urlpatterns = [
    path("businesses/", BusinessListCreateAPIView.as_view(), name="businesses"),
    path("businesses/<int:pk>/details/", BusinessDetailAPIView.as_view(), name="business-details"),
    path("branches/", BranchListCreateAPIView.as_view(), name="branches"),
    path("branches/<int:pk>/details/", BranchDetailAPIView.as_view(), name="branch-details"),
]