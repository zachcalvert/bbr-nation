from django.urls import path

from . import views

urlpatterns = [
    path('new_message/', views.new_message, name='new_message'),
    path('crib_message/', views.crib_message, name='crib_message'),
]
