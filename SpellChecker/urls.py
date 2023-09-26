from django.urls import path
from . import views


urlpatterns = [
    path("", views.index, name="index"),
    path('data_processing/', views.data_processing, name='data_processing'),
]