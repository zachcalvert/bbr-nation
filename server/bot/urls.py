from django.urls import path

from . import views

urlpatterns = [
    path('new_message/', views.NewMessageView.as_view(), name='new_message'),
]
