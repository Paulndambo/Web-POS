import requests

BACKEND_URL = "https://7d04-105-163-2-112.ngrok-free.app"
MPESA_BASE_URL = "https://sandbox.safaricom.co.ke"
MPESA_SANDBOX_URL = f"{MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest"
MPESA_AUTH_URL = f"{MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials"

CONSUMER_KEY = "XvtPN184rgabldJKME5UCgSKmU4qncwtkSS8Z75X1LnxAXU0"
CONSUMER_SECRET = "q9cHHWM10p3SLcI4iNL6dnlyvxfGZlkJsJkyo3Q6NCA2Gr9Ef1RPhD9LZGrq2xRi"

from payments.models import MpesaTransaction


class MpesaSTKPush:
    def __init__(self, phone_number: str, amount: float):
        self.phone_number = phone_number
        self.amount = amount
        #self.access_token = self.authenticate()
        

    def authenticate(self):
        # This method would contain logic to authenticate and retrieve an access token

        payload = {
            "username": CONSUMER_KEY,
            "password": CONSUMER_SECRET
        }
        files={}
        headers = {
            'Authorization': 'Basic WHZ0UE4xODRyZ2FibGRKS01FNVVDZ1NLbVU0cW5jd3RrU1M4Wjc1WDFMbnhBWFUwOnE5Y0hIV00xMHAzU0xjSTRpTkw2ZG5seXZ4ZkdabGtKc0preW8zUTZOQ0EyR3I5RWYxUlBoRDlMWkdycTJ4Umk=',
            'Content-Type': 'application/json'
        }

        response = requests.request("GET", MPESA_AUTH_URL, headers=headers, data=payload, files=files)

        if response.status_code == 200:
            access_token = response.json().get("access_token")
            return access_token

        else:
            raise Exception("Failed to authenticate with Mpesa API")
    
    def get_password(self):
        import base64
        from datetime import datetime

        business_short_code = "174379"
        lipa_time = datetime.now().strftime('%Y%m%d%H%M%S')
        passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
        data_to_encode = business_short_code + passkey + lipa_time
        encoded_string = base64.b64encode(data_to_encode.encode())
        decoded_password = encoded_string.decode('utf-8')
        return decoded_password, lipa_time
    
    
    def stk_push(self):
        access_token = self.authenticate()
        password, lipa_time = self.get_password()
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        payload = {
            "BusinessShortCode": "174379",
            "Password": f"{password}",
            "Timestamp": f"{lipa_time}",
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(self.amount),
            "PartyA": self.phone_number,
            "PartyB": "174379",
            "PhoneNumber": self.phone_number,
            "CallBackURL": f"{BACKEND_URL}/apis/stk-push-callback/",
            "AccountReference": "CompanyXLTD",
            "TransactionDesc": "Payment of X"
        }

        response = requests.request("POST", MPESA_SANDBOX_URL, headers=headers, json=payload)

        if response.status_code == 200:
            print("STK Push initiated successfully")
            print(response.json())
            MpesaTransaction.objects.create(
                merchant_request_id=response.json().get("MerchantRequestID"),
                checkout_request_id=response.json().get("CheckoutRequestID"),
                response_desc=response.json().get("ResponseDescription"),
                customer_message=response.json().get("CustomerMessage"),
                status='Pending'
            )
            return response.json()
        else:
            print(response.text)
            raise Exception("Failed to initiate STK Push request")



#mpesa = MpesaSTKPush(phone_number="254745491093", amount=1)
#mpesa.stk_push()