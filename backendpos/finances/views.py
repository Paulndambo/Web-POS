from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from finances.models import StoreCredit, Expense
from finances.serializers import StoreCreditSerializer, ExpenseSerializer

# Create your views here.
class StoreCreditListCreateView(generics.ListCreateAPIView):
    queryset = StoreCredit.objects.all()
    serializer_class = StoreCreditSerializer
    permission_classes = [IsAuthenticated]


class ExpenseListCreateView(generics.ListCreateAPIView):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
