from urllib import response
from django.db import transaction
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated



from payments.serializers import MpesaSTKPushSerializer, ConfirmPaymentSerializer
from payments.models import MpesaTransaction
from core.support_functions import cleanup_mpesa_callback, cleanup_phone_number
from payments.mpesa.stk_push import MpesaSTKPush
from orders.models import Order, OrderItem


# Create your views here.
class MpesaSTKPushAPIView(generics.GenericAPIView):
    serializer_class = MpesaSTKPushSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid(raise_exception=True):
            # Process the callback data as needed
            phone_number = serializer.validated_data.get("phone_number")
            amount = serializer.validated_data.get("amount")

            cleaned_phone_number = cleanup_phone_number(phone_number)

            stk_push_instance = MpesaSTKPush(
                phone_number=cleaned_phone_number,
                amount=amount
            )
            data = stk_push_instance.stk_push()
            return Response(data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class ConfirmPaymentAPIView(generics.GenericAPIView):
    serializer_class = ConfirmPaymentSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        print("Request Data:", request.data)

        if serializer.is_valid(raise_exception=True):
            merchant_request_id = serializer.validated_data.get("MerchantRequestID")

            # Here you would typically confirm the payment with Mpesa API
            # For demonstration, we just return a success response
            transaction = MpesaTransaction.objects.filter(merchant_request_id=merchant_request_id, result_code__in=[0, "0"]).first()
            if transaction:
                transaction.status = 'Confirmed'
                transaction.save()
                return Response({"status": "Payment confirmation successful", "merchant_request_id": merchant_request_id}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)