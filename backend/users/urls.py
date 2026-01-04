from django.urls import path

from .views import UsersListAPIView, UserDetailAPIView, UserLoginAPIView, RegisterUserAPIView

urlpatterns = [
    path("", UsersListAPIView.as_view(), name="users"),
    path("<int:pk>/details/", UserDetailAPIView.as_view(), name="user-details"),
    path('login/', UserLoginAPIView.as_view(), name='login'),
    path('register/', RegisterUserAPIView.as_view(), name='register'),
]