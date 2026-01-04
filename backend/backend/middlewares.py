class BusinessMiddleware:
    """
    Attaches the Business associated with the authenticated user
    to request.business
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.business = None

        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            # Avoid AttributeError if user has no business
            request.business = getattr(user, "business", None)

        return self.get_response(request)
