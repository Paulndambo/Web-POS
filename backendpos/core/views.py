from django.shortcuts import render
from django.db import transaction

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from datetime import timedelta

from core.mixins import BusinessScopedQuerysetMixin

from core.models import Business, Branch
from finances.models import PricingPlan, BusinessSubscription
from users.models import User
from core.serializers import BusinessSerializer, BranchSerializer, BusinessOnboardingSerializer
# Create your views here.
class BusinessListCreateAPIView(BusinessScopedQuerysetMixin, generics.ListCreateAPIView):
    queryset = Business.objects.all().order_by("-created_at")
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]


class BusinessDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Business.objects.all().order_by("-created_at")
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]

    lookup_field = "pk"


class BranchListCreateAPIView(BusinessScopedQuerysetMixin, generics.ListCreateAPIView):
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

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid(raise_exception=True):
            business_data = serializer.validated_data['business_details']
            branch_data = serializer.validated_data['branch_details']
            manager_data = serializer.validated_data['manager_details']
            pricing_plan = serializer.validated_data['pricing_plan']

            print(serializer.validated_data)

            business = Business.objects.create(**business_data)
            branch = Branch.objects.create(business=business, **branch_data)
            manager = User.objects.create(**manager_data)
            branch.branch_manager = manager
            branch.save()

            manager.set_password(manager_data['password'])
            manager.business = business
            manager.branch = branch
            manager.username = manager_data['email']
            manager.save()

            business.owner = manager
            business.save()

            BusinessSubscription.objects.create(
                business=business,
                branch=branch,
                pricing_plan=PricingPlan.objects.get(id=pricing_plan['id']),
                end_date=business.created_at.date() + timedelta(days=pricing_plan['pilot_period'])
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)