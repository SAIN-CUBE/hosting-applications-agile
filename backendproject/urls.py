from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.views import LogoutView
from backendapp import views

urlpatterns = [
path('admin/', admin.site.urls),
path('social-auth/', include('social_django.urls', namespace='social')),
path("api/", include("backendapp.urls")),
]