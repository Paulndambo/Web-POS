from django.urls import path
from finances.views import StoreCreditListCreateView, ExpenseListCreateView

urlpatterns = [
    path("store-credits/", StoreCreditListCreateView.as_view(), name="store-credits"),
    path("expenses/", ExpenseListCreateView.as_view(), name="expenses"),
]