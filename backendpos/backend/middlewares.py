class BusinessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.business = (
            getattr(request.user, "business", None)
            if getattr(request, "user", None) and request.user.is_authenticated
            else None
        )
        return self.get_response(request)
