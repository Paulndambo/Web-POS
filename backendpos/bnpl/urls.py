from django.urls import path

from bnpl.views import (
    BNPLServiceProviderListCreateView,
    BNPLServiceProviderDetailView,
    BNPLPurchaseListView,
    BNPLPurchaseDetailView,
)

urlpatterns = [
    path('service-providers/', BNPLServiceProviderListCreateView.as_view(), name='bnpl-service-providers'),
    path('service-providers/<int:pk>/details/', BNPLServiceProviderDetailView.as_view(), name='bnpl-service-provider-detail'),
    path('purchases/', BNPLPurchaseListView.as_view(), name='bnpl-purchases'),
    path('purchases/<int:pk>/details/', BNPLPurchaseDetailView.as_view(), name='bnpl-purchase-detail'),
]