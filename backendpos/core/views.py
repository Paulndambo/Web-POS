from django.shortcuts import render

from rest_framework import status, generics
from rest_framework.response import Response

from core.models import Business
from core.serializers import BusinessSerializer
# Create your views here.
class BusinessListCreateAPIView(generics.ListCreateAPIView):
    queryset = Business.objects.all().order_by("-created_at")
    serializer_class = BusinessSerializer


class BusinessDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Business.objects.all().order_by("-created_at")
    serializer_class = BusinessSerializer

    lookup_field = "pk"