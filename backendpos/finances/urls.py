from django.urls import path
from finances.views import StoreCreditListCreateView, ExpenseListCreateView, PricingPlanListCreateView

urlpatterns = [
    path("store-credits/", StoreCreditListCreateView.as_view(), name="store-credits"),
    path("expenses/", ExpenseListCreateView.as_view(), name="expenses"),
    path("pricing-plans/", PricingPlanListCreateView.as_view(), name="pricing-plans"),
]