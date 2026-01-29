from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


from bnpl.models import BNPLServiceProvider, BNPLPurchase, BNPLInstallment
from bnpl.serializers import BNPLServiceProviderSerializer, BNPLPurchaseSerializer, BNPLInstallmentSerializer, BNPLPurchaseDetailSerializer

# Create your views here.
class BNPLServiceProviderListCreateView(generics.ListCreateAPIView):
    queryset = BNPLServiceProvider.objects.all()
    serializer_class = BNPLServiceProviderSerializer
    permission_classes = [IsAuthenticated]


class BNPLServiceProviderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BNPLServiceProvider.objects.all()
    serializer_class = BNPLServiceProviderSerializer
    permission_classes = [IsAuthenticated]

    lookup_field = 'pk'


class BNPLPurchaseListView(generics.ListAPIView):
    queryset = BNPLPurchase.objects.all()
    serializer_class = BNPLPurchaseSerializer
    permission_classes = [IsAuthenticated]


class BNPLPurchaseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BNPLPurchase.objects.all()
    serializer_class = BNPLPurchaseDetailSerializer
    permission_classes = [IsAuthenticated]

    lookup_field = 'pk'