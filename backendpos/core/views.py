from django.shortcuts import render

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.models import Business, Branch
from core.serializers import BusinessSerializer, BranchSerializer
# Create your views here.
class BusinessListCreateAPIView(generics.ListCreateAPIView):
    queryset = Business.objects.all().order_by("-created_at")
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]


class BusinessDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Business.objects.all().order_by("-created_at")
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]

    lookup_field = "pk"


class BranchListCreateAPIView(generics.ListCreateAPIView):
    queryset = Branch.objects.all().order_by("-created_at")
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]


class BranchDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Branch.objects.all().order_by("-created_at")
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

    lookup_field = "pk"