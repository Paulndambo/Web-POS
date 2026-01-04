from django.shortcuts import render
from rest_framework import status, generics

from rest_framework.response import Response

from inventory.serializers import InventoryItemSerializer, CategorySerializer
from inventory.models import InventoryItem, Category
# Create your views here.
class CategoryAPIView(generics.ListCreateAPIView):
    queryset = Category.objects.all().order_by("-created_at")
    serializer_class = CategorySerializer


class InventoryItemAPIView(generics.ListCreateAPIView):
    queryset = InventoryItem.objects.all().order_by("-created_at")
    serializer_class = InventoryItemSerializer


class InventoryItemDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InventoryItem.objects.all().order_by("-created_at")
    serializer_class = InventoryItemSerializer

    lookup_field = "pk"