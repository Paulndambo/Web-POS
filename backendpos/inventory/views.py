from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response
from django.db import transaction

from core.mixins import BusinessScopedQuerysetMixin

from inventory.serializers import (
    InventoryItemSerializer, CategorySerializer,
    MenuSerializer,
    StockRestokSerializer,
    InventoryLogSerializer
)
from inventory.models import InventoryItem, Category, Menu, InventoryLog
# Create your views here.
class CategoryAPIView(BusinessScopedQuerysetMixin, generics.ListCreateAPIView):
    queryset = Category.objects.all().order_by("-created_at")
    serializer_class = CategorySerializer


class CategoryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all().order_by("-created_at")
    serializer_class = CategorySerializer

    lookup_field = "pk"


class InventoryItemAPIView(BusinessScopedQuerysetMixin, generics.ListCreateAPIView):
    queryset = InventoryItem.objects.all().order_by("-created_at")
    serializer_class = InventoryItemSerializer


class InventoryItemDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InventoryItem.objects.all().order_by("-created_at")
    serializer_class = InventoryItemSerializer

    lookup_field = "pk"



class MenuAPIView(BusinessScopedQuerysetMixin, generics.ListCreateAPIView):
    queryset = Menu.objects.all().order_by("-created_at")
    serializer_class = MenuSerializer


class MenuDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Menu.objects.all().order_by("-created_at")
    serializer_class = MenuSerializer

    lookup_field = "pk"



class StockRestockAPIView(generics.CreateAPIView):
    serializer_class = StockRestokSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        print(request.data)

        if serializer.is_valid(raise_exception=True):
            inventory_item_id = serializer.validated_data.get("inventory_item_id")
            action_type = serializer.validated_data.get("action_type")
            quantity = serializer.validated_data.get("quantity")

            print(serializer.validated_data)

            item = InventoryItem.objects.get(id=inventory_item_id)

            if action_type.lower() == "add stock":
                item.quantity += int(quantity)
                item.save()
            elif action_type.lower() == "remove stock":
                if item.quantity < int(quantity):
                    return Response({ "failed": "You cannot remove more that what is available" }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    item.quantity -= int(quantity)
                    item.save()

            InventoryLog.objects.create(
                item=item,
                action_type=action_type,
                quantity=quantity,
                actioned_by=request.user
            )
            return Response({"success": "Stock item successfully updated"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class InventoryLogAPIView(BusinessScopedQuerysetMixin, generics.ListAPIView):
    queryset = InventoryLog.objects.all().order_by("-created_at")
    serializer_class = InventoryLogSerializer
    permission_classes = [IsAuthenticated]