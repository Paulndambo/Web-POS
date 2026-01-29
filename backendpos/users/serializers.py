from users.models import User
from rest_framework import serializers



from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.template import Context
from rest_framework.exceptions import ValidationError

from django.core.exceptions import ObjectDoesNotExist

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = "__all__"


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["user"] = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone_number": user.phone_number,
            "role": user.role,
            "business_id": user.business.id if user.business else None,
            "branch_id": user.branch.id if hasattr(user, 'branch') else None,
            "business_name": user.business.name if user.business else None,
            "branch_name": user.branch.name if hasattr(user, 'branch') else None,
            "gender": user.gender
        }

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user_data = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "phone_number": self.user.phone_number,
            "role": self.user.role,
            "business_id": self.user.business.id if self.user.business else None,
            "branch_id": self.user.branch.id if hasattr(self.user, 'branch') else None,
            "branch_name": self.user.branch.name if hasattr(self.user, 'branch') else None,
            "business_name": self.user.business.name if self.user.business else None,
            "gender": self.user.gender
        }
        data["user"] = user_data

        return data



class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField()

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise ValidationError("Current password is incorrect")
        return value

    def validate_new_password(self, value):
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user
