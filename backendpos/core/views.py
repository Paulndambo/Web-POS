from django.shortcuts import render

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from core.models import Business, Branch
from core.serializers import BusinessSerializer, BranchSerializer, BusinessOnboardingSerializer
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


class BusinessOnboardingAPIView(generics.CreateAPIView):
    serializer_class = BusinessOnboardingSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid(raise_exception=True):
            business_data = serializer.validated_data['business_details']
            branch_data = serializer.validated_data['branch_details']
            manager_data = serializer.validated_data['manager_details']
            pricing_plan = serializer.validated_data['pricing_plan']

            print(serializer.validated_data)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)