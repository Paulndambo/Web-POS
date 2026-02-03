from customers.models import LoyaltyCard, LoyaltyCardRedeem, LoyaltyCardRecharge
from decimal import Decimal
from django.db import transaction
from users.models import User


class CustomerPointsProcessor:
    def __init__(self, card_number: str, amount: Decimal, user: User):
        self.card_number = card_number
        self.amount = amount
        self.user = user


    def run(self):
        if not self.card_number:
            return {"message": "Loyalty card number not found!!"}
        else:
            self.__process_points()


    @transaction.atomic
    def __process_points(self):
        loyalty_card = LoyaltyCard.objects.get(card_number=self.card_number)
        points_earned = int(self.amount // Decimal(100))
        loyalty_card.points += points_earned
        loyalty_card.amount_spend += self.amount
        loyalty_card.save()

        LoyaltyCardRecharge.objects.create(
            business=self.user.business,
            branch=self.user.branch,
            card=loyalty_card,
            amount=points_earned
        )

        print(f"{points_earned} points added to card {self.card_number}")



class CustomerPointsRedeemer:
    def __init__(self, card_number: str, points_to_redeem: int, user: User):
        self.card_number = card_number
        self.points_to_redeem = points_to_redeem
        self.user = user


    def run(self):
        if not self.card_number:
            return {"message": "Loyalty card number not found!!"}
        else:
            self.__redeem_points()


    @transaction.atomic
    def __redeem_points(self):
        loyalty_card = LoyaltyCard.objects.get(card_number=self.card_number)

        if loyalty_card.points < self.points_to_redeem:
            raise ValueError("Insufficient points to redeem.")

        loyalty_card.points -= self.points_to_redeem
        loyalty_card.available_credit += Decimal(self.points_to_redeem)
        loyalty_card.save()

        LoyaltyCardRedeem.objects.create(
            business=self.user.business,
            branch=self.user.branch,
            card=loyalty_card,
            amount=self.points_to_redeem
        )

        print(f"{self.points_to_redeem} points redeemed from card {self.card_number}")