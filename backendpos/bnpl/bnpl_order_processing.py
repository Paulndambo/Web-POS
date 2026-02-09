from typing import Dict, Any, Iterable

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta, datetime

from bnpl.models import (
    BNPLServiceProvider,
    BNPLPurchase,
    BNPLInstallment,
)
from orders.models import Order, OrderItem
from payments.models import Payment
from customers.models import LoyaltyCard
from users.models import User


class BNPLPurchaseProcessor:
    """
    Handles BNPL order processing in a single atomic transaction.
    """

    def __init__(self, order_data: Dict[str, Any], user: User):
        self.order_data = order_data
        self.user = user

    def run(self) -> BNPLPurchase:
        return self._process_bnpl_order()

    # ------------------------
    # Core Transaction
    # ------------------------
    @transaction.atomic
    def _process_bnpl_order(self) -> BNPLPurchase:
        provider = self._get_provider()
        customer = self._get_customer()

        order = self._create_order()
        self._create_payment(order)
        self._create_order_items(order)
        self._update_inventory(order)

        purchase = self._create_bnpl_purchase(order, provider, customer)
        self._create_installments(purchase)

        return purchase

    # ------------------------
    # Helpers
    # ------------------------
    def _get_provider(self) -> BNPLServiceProvider:
        return get_object_or_404(
            BNPLServiceProvider,
            id=self.order_data["bnplServiceProvider"],
        )

    def _get_customer(self) -> LoyaltyCard | None:
        card_number = self.order_data.get("cardNumber")
        customer_id = self.order_data.get("customerId")

        return (
            LoyaltyCard.objects.filter(card_number=card_number).first()
            or LoyaltyCard.objects.filter(id=customer_id).first()
        )

    def _create_order(self) -> Order:
        return Order.objects.create(
            business=self.user.business,
            branch=self.user.branch,
            order_number=self.order_data["receiptNo"],
            tax=self.order_data["tax"],
            sub_total=self.order_data["subtotal"],
            total_amount=self.order_data["total"],
            amount_received=self.order_data["bnplDownPayment"],
            amount_paid=self.order_data["bnplDownPayment"],
            sold_by=self.user,
            status="Partially Paid",
            order_type=Order.Type.BNPL if hasattr(Order, "Type") else "BNPL",
        )

    def _create_payment(self, order: Order) -> None:
        Payment.objects.create(
            business=order.business,
            branch=order.branch,
            order=order,
            subtotal=self.order_data["subtotal"],
            tax=self.order_data["tax"],
            total=self.order_data["total"],
            payment_method=self.order_data["paymentMethod"],
            amount_received=self.order_data["bnplDownPayment"],
            change=self.order_data.get("change", 0),
            mobile_number=self.order_data.get("mobileNumber"),
            mobile_network=self.order_data.get("mobileNetwork"),
            split_cash_amount=self.order_data.get("splitCashAmount", 0),
            split_mobile_amount=self.order_data.get("splitMobileAmount", 0),
            status=Payment.Status.COMPLETE if hasattr(Payment, "Status") else "Complete",
            payment_date=self.order_data.get("date", timezone.now()),
            receipt_number=self.order_data["receiptNo"],
        )

    def _create_order_items(self, order: Order) -> None:
        items: Iterable[OrderItem] = (
            OrderItem(
                order=order,
                business=self.user.business,
                branch=self.user.branch,
                inventory_item_id=item["id"],
                quantity=item["quantity"],
                item_total=item["total_price"],
            )
            for item in self.order_data["items"]
        )

        OrderItem.objects.bulk_create(items)

    def _update_inventory(self, order: Order) -> None:
        for item in order.items.select_related("inventory_item"):
            inventory = item.inventory_item
            inventory.quantity -= item.quantity
            inventory.save(update_fields=["quantity"])

    def _create_bnpl_purchase(
        self,
        order: Order,
        provider: BNPLServiceProvider,
        customer: LoyaltyCard | None,
    ) -> BNPLPurchase:
        return BNPLPurchase.objects.create(
            service_provider=provider,
            business=self.user.business,
            branch=self.user.branch,
            customer=customer,
            order=order,
            total_amount=self.order_data["total"],
            down_payment=self.order_data["bnplDownPayment"],
            bnpl_amount=self.order_data["bnplRemainingPaymentAmount"],
            amount_paid=self.order_data["bnplDownPayment"],
            purchase_date=self.order_data.get("date", timezone.now()),
            number_of_installments=self.order_data["bnplInstallments"],
            payment_interval_days=self.order_data["bnplInterval"],
            installment_amount=self.order_data["bnplPerPaymentAmount"],
        )

    def _create_installments(self, purchase: BNPLPurchase) -> None:
        start_date = timezone.now() + timedelta(days=7)
        interval_days = int(self.order_data["bnplInterval"])
        installments_count = int(self.order_data["bnplInstallments"])
        installment_amount = self.order_data["bnplPerPaymentAmount"]

        installments = []

        for i in range(1, installments_count + 1):
            due_date = start_date + timedelta(days=interval_days * i)

            installments.append(
                BNPLInstallment(
                    business=self.user.business,
                    branch=self.user.branch,
                    purchase=purchase,
                    amount_expected=installment_amount,
                    due_date=due_date,
                )
            )

        BNPLInstallment.objects.bulk_create(installments)

