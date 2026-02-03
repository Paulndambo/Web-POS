from typing import Dict, Any

from django.db import transaction
from bnpl.models import BNPLServiceProvider, BNPLPurchase, BNPLInstallment
from orders.models import Order, OrderItem
from payments.models import Payment
from customers.models import LoyaltyCard

from users.models import User

class BNPLPurchaseProcessor:
    def __init__(self, order_data: Dict[str, Any], user: User):
        self.order_data = order_data
        self.user = user


    def run(self):
        self.__process_bnpl_order()

    @transaction.atomic
    def __process_bnpl_order(self):
        provider = BNPLServiceProvider.objects.get(
            id=self.order_data.get("bnplServiceProvider")
        )

        customer = LoyaltyCard.objects.filter(card_number=self.order_data.get("cardNumber")).first()

        if not customer:
            customer = LoyaltyCard.objects.filter(id=self.order_data.get("customerId")).first()
        

        order = Order.objects.create(
            business=self.user.business,
            branch=self.user.branch,
            order_number=self.order_data.get("receiptNo"),
            tax=self.order_data.get("tax"),
            sub_total=self.order_data.get("subtotal"),
            total_amount=self.order_data.get("total"),
            amount_received=self.order_data.get("amountReceived"),
            sold_by=self.user,
            status="Pending",
            amount_paid=self.order_data.get("bnplDownPayment"),
        )
        Payment.objects.create(
            business=order.business,
            branch=order.branch,
            order=order,
            subtotal=self.order_data.get("subtotal"), 
            tax=self.order_data.get("tax"), 
            total=self.order_data.get("total"), 
            payment_method=self.order_data.get("paymentMethod"), 
            amount_received=self.order_data.get("amountReceived"), 
            change=self.order_data.get("change"), 
            mobile_number=self.order_data.get("mobileNumber"), 
            mobile_network=self.order_data.get("mobileNetwork"), 
            split_cash_amount=self.order_data.get("splitCashAmount"), 
            split_mobile_amount=self.order_data.get("splitMobileAmount"), 
            status="Complete", 
            payment_date=self.order_data.get("date"), 
            receipt_number=self.order_data.get("receiptNo")
        )

        for x in self.order_data.get("items"):
            OrderItem.objects.create(
                order=order,
                business=self.user.business,
                branch=self.user.branch,
                inventory_item_id=x["id"],
                quantity=x["quantity"],
                item_total=x["total_price"]
            )

        for item in order.items.all():
            item.inventory_item.quantity -= item.quantity
            item.inventory_item.save()


        purchase = BNPLPurchase.objects.create(
            service_provider=provider,
            business=self.user.business,
            branch=self.user.branch,
            customer=customer,
            service_provider_id=self.order_data.get("bnplServiceProvider"),
            order=order,
            total_amount=self.order_data.get("total"),
            down_payment=self.order_data.get("bnplDownPayment"),
            bnpl_amount=self.order_data.get("bnplRemainingPaymentAmount"),
            amount_paid=self.order_data.get("bnplDownPayment"),
            purchase_date=self.order_data.get("date"),
            number_of_installments=self.order_data.get("bnplInstallments"),
            payment_interval_days=self.order_data.get("bnplInterval"),
            installment_amount=self.order_data.get("bnplPerPaymentAmount")
        )


        objects = [
            BNPLInstallment(business=self.user.business, branch=self.user.branch, purchase=purchase, amount_expected=self.order_data.get("bnplPerPaymentAmount"), due_date=self.order_data.get("date"))
            for _ in range(self.order_data.get("bnplInstallments"))
        ]

        BNPLInstallment.objects.bulk_create(objects)