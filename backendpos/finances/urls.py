from django.urls import path
from finances.views import (
    StoreCreditListCreateView, ExpenseListCreateView, PricingPlanListCreateView, DebtorsListView, DebtorDetailView)

urlpatterns = [
    path("store-credits/", StoreCreditListCreateView.as_view(), name="store-credits"),
    path("expenses/", ExpenseListCreateView.as_view(), name="expenses"),
    path("pricing-plans/", PricingPlanListCreateView.as_view(), name="pricing-plans"),
    path("debtors/", DebtorsListView.as_view(), name="debtors"),
    path("debtors/<int:pk>/details/", DebtorDetailView.as_view(), name="debtor-detail"),
]