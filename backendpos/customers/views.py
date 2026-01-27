from rest_framework import status, generics
from rest_framework.response import Response 
from rest_framework.permissions import IsAuthenticated


from customers.models import (
    LoyaltyCard, LoyaltyCardRecharge, LoyaltyCardRedeem,
    GiftCard, GiftCardRedeem, GiftCardRecharge
)

from customers.serializers import (
    LoyaltyCardSerializer, LoyaltyCardDetailSerializer, LoyaltyCardUpdateSerializer,
    GiftCardSerializer, GiftCardUpdateSerializer, GiftCardDetailSerializer
)

# Create your views here.
class LoyaltyCardAPIView(generics.ListCreateAPIView):
    queryset = LoyaltyCard.objects.all().order_by("-created_at")
    serializer_class = LoyaltyCardSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        data["business"] = request.user.id

        serializer = self.serializer_class(data=data)
        if serializer.is_valid(raise_exception=True):
            card = serializer.save()
            return Response({"success": "Loyalty card successfully created", "card_number": card.card_number}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class LoyaltyCardDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LoyaltyCard.objects.all().order_by("-created_at")
    serializer_class = LoyaltyCardDetailSerializer
    permission_classes = [IsAuthenticated]

    lookup_field = "pk"


class LoyaltyCardUpdateAPIView(generics.CreateAPIView):
    serializer_class = LoyaltyCardUpdateSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid(raise_exception=True):
            card = LoyaltyCard.objects.get(
                id=serializer.validated_data.get("card_id"),
                card_number=serializer.validated_data.get("card_number"),
                business=request.user.business
            )

            if serializer.validated_data["action_type"].lower() == "redeem":
                LoyaltyCardRedeem.objects.create(
                    card=card,
                    amount=serializer.validated_data["quantity"]
                )
                card.points -= serializer.validated_data["quantity"]
                card.save()
            elif serializer.validated_data["action_type"].lower() == "add":
                LoyaltyCardRecharge.objects.create(
                    card=card,
                    amount=serializer.validated_data["quantity"]
                )
                card.points += serializer.validated_data["quantity"]
                card.amount_spend += serializer.validated_data["money_spend"]
                card.save()
            return Response({"success": "Loyalty card points updated successfully!!"}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GiftCardAPIView(generics.ListCreateAPIView):
    queryset = GiftCard.objects.all().order_by("-created_at")
    serializer_class = GiftCardSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        data["business"] = request.user.id
        print(data)
        
        serializer = self.serializer_class(data=data)
        if serializer.is_valid(raise_exception=True):
            card = serializer.save()
            return Response({"success": "Gift card successfully created", "card_number": card.card_number}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class GiftCardDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = GiftCard.objects.all()
    serializer_class = GiftCardDetailSerializer
    permission_classes = [IsAuthenticated]

    lookup_field = "pk"
    


class GiftCardUpdateAPIView(generics.CreateAPIView):
    serializer_class = GiftCardUpdateSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid(raise_exception=True):
            card = GiftCard.objects.get(
                card_number=serializer.validated_data.get("card_number"),
                business=request.user.business
            )

            if serializer.validated_data["action_type"].lower() == "redeem":
                GiftCardRedeem.objects.create(
                    card=card,
                    amount=serializer.validated_data["amount"]
                )
                card.initial_balance -= serializer.validated_data["amount"]
                card.save()
            elif serializer.validated_data["action_type"].lower() == "reload":
                GiftCardRecharge.objects.create(
                    card=card,
                    amount=serializer.validated_data["amount"]
                )
                card.initial_balance += serializer.validated_data["amount"]
                card.save()
            return Response({"success": "Gift card updated successfully!!"}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)