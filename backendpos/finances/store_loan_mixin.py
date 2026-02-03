from decimal import Decimal
from django.db import transaction

from users.models import User
from finances.models import StoreLoan, StoreLoanLog
from customers.models import LoyaltyCard


class ProcessStoreLoanMixin:
    def __init__(self, card_number: str, amount: Decimal, user: User):
        self.card_number = card_number
        self.amount = amount
        self.user = user


    def run(self):
        self.__process_store_loan()

    @transaction.atomic
    def __process_store_loan(self):
        loyalty_card = LoyaltyCard.objects.get(card_number=self.card_number)
        store_loan = StoreLoan.objects.filter(customer=loyalty_card).first()

        if not store_loan:
            store_loan = StoreLoan.objects.create(
                business=self.user.business,
                branch=self.user.branch,
                customer=loyalty_card,
                total_amount=self.amount,
                amount_paid=self.amount,
                issued_by=self.user,
            )

        else:
            store_loan.total_amount += self.amount
            store_loan.save()

        store_loan.customer.available_credit -= self.amount
        store_loan.customer.credit_issued += self.amount
        store_loan.customer.save()

        StoreLoanLog.objects.create(

            loan=store_loan,
            action="New loan issued",
            amount=self.amount,
            performed_by=self.user,
        )

        print(f"Store loan of {self.amount} processed for card {self.card_number}")