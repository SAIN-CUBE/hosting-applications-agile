from .models import Credit, Log
from django.conf import settings
import logging

# Function to assign role and credits to a new user during Google signup
def assign_role_and_credits(backend, user, *args, **kwargs):
    # Only apply if this is a new user created by Google sign-up
    if user and kwargs.get('is_new'):
        # Assign default role and team if not already set
        if not user.role:
            user.role = 'visitor'
        if not user.team:
            user.team = 'no team'
        
        # Set loginWithGoogle to True
        user.loginWithGoogle = True
        
        user.save()

        # Create initial credits for the user
        try:
            Credit.objects.create(
                user=user,
                total_credits=200,
                used_credits=0,
                remaining_credits=200
            )
        except Exception as e:
            logging.error(f"Error creating credits for user {user.email}: {str(e)}")

# Function to log user creation
def log_user_creation(backend, user, *args, **kwargs):
    # Only log for new users
    if user and kwargs.get('is_new'):
        request = backend.strategy.request
        ip_address = request.META.get('REMOTE_ADDR') if request else '0.0.0.0'
        device_info = request.META.get('HTTP_USER_AGENT', 'Unknown device') if request else 'Unknown device'

        # Create log entry for user creation
        try:
            Log.objects.create(
                user=user,
                action='Google user created',
                ip_address=ip_address,
                device_info=device_info
            )
        except Exception as e:
            logging.error(f"Error logging user creation for {user.email}: {str(e)}")