def cleanup_mpesa_callback(callback_data: dict) -> dict:
    """
    Cleans and flattens M-Pesa STK Push callback data
    into a predictable dictionary structure.
    """

    stk = (
        callback_data
        .get("Body", {})
        .get("stkCallback", {})
    )

    # Base fields
    cleaned = {
        "merchant_request_id": stk.get("MerchantRequestID"),
        "checkout_request_id": stk.get("CheckoutRequestID"),
        "result_code": stk.get("ResultCode"),
        "result_desc": stk.get("ResultDesc"),
        "amount": None,
        "mpesa_receipt_number": None,
        "balance": None,
        "transaction_date": None,
        "phone_number": None,
    }

    # Extract metadata items (if present)
    items = (
        stk
        .get("CallbackMetadata", {})
        .get("Item", [])
    )

    for item in items:
        name = item.get("Name")
        value = item.get("Value")

        if name == "Amount":
            cleaned["amount"] = value
        elif name == "MpesaReceiptNumber":
            cleaned["mpesa_receipt_number"] = value
        elif name == "Balance":
            cleaned["balance"] = value
        elif name == "TransactionDate":
            cleaned["transaction_date"] = value
        elif name == "PhoneNumber":
            cleaned["phone_number"] = value

    return cleaned


def cleanup_phone_number(phone_number: str) -> str:
    """
    Cleans up a phone number to ensure it is in the format
    required by the M-Pesa API (e.g., 2547XXXXXXXX).
    """
    # Remove any leading '+' or '0'
    if phone_number.startswith('+'):
        phone_number = phone_number[1:]
    elif phone_number.startswith('0'):
        phone_number = '254' + phone_number[1:]

    return phone_number