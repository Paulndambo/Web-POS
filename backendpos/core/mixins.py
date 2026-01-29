class BusinessScopedQuerysetMixin:
    business_field = "business"

    def get_business(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return None
        return getattr(user, "business", None)

    def get_queryset(self):
        qs = super().get_queryset()
        business = self.get_business()

        if business is None:
            return qs.none()

        return qs.filter(**{self.business_field: business})
