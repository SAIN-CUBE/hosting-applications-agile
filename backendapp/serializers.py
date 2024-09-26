from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Credit, Subscription, AITool, Log, Team, Transaction, Features, TeamMember
from rest_framework.response import Response
from rest_framework import status
from django.utils.encoding import smart_str, force_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
# from backendapp.email_send import Util
from django.core.mail import EmailMessage
import os
from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import ValidationError

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims here if necessary
        token['email'] = user.email
        return token
        # return Response({'token':token, 'msg':'Login Successful'}, status=status.HTTP_201_CREATED)
        
class UserLoginSerializer(serializers.ModelSerializer):
  email = serializers.EmailField(max_length=255)
  class Meta:
    model = User
    fields = ['email', 'password']

# class UserRegistrationSerializer(serializers.ModelSerializer):
#     password2 = serializers.CharField(write_only=True)

#     class Meta:
#         model = User
#         fields = ('email', 'first_name', 'last_name', 'phone_number', 'password', 'password2')

#     def validate(self, data):
#         if data['password'] != data['password2']:
#             raise serializers.ValidationError("Passwords do not match.")
        
#         # Check if user with this email already exists
#         if User.objects.filter(email=data['email']).exists():
#             raise serializers.ValidationError("A user with this email already exists.")
        
#         return data

#     def create(self, validated_data):
#         validated_data.pop('password2')
#         validated_data['role'] = 'visitor'  # Set default role to 'visitor'
#         validated_data['team'] = 'no team'  # Set default team to 'no team'
#         user = User.objects.create_user(**validated_data)
        
#         # Create a Credit record for the user
#         Credit.objects.create(user=user, total_credits=200, used_credits=0, remaining_credits=200)
        
#         # Log the user creation action
#         request = self.context.get('request')
#         ip_address = request.META.get('REMOTE_ADDR') if request else '0.0.0.0'
#         Log.objects.create(
#             user=user,
#             action='User created',
#             ip_address=ip_address,
#             device_info=request.META.get('HTTP_USER_AGENT', 'Unknown device') if request else 'Unknown device'
#         )
        
#         return user

class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone_number', 'password', 'password2', 'role', 'team')

    def validate(self, data):
        # Check if passwords match
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
          
        # Check if user with this email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("A user with this email already exists.")

        # Handle team logic
        email = data.get('email')

        try:
            team = Team.objects.get(pending_emails__icontains=email)
            # If the team exists, add the user as a 'client'
            data['team'] = team.team_name
            data['role'] = 'client'
        except Team.DoesNotExist:
            # If no team is provided or the team name is 'no team', set default values
            data['team'] = 'no team'
            data['role'] = 'visitor'

        return data

    def create(self, validated_data):
        # Remove the password2 field since it's not needed for user creation
        validated_data.pop('password2')

        # Create the user
        user = User.objects.create_user(**validated_data)

        if validated_data['role'] =="client" and validated_data['team'] != 'no team':
          TeamMember.objects.create(
              user=user,
              team=Team.objects.get(team_name=validated_data['team']),
            )
          print("Team created")
        try:
            # If the user is not an org_admin but part of an existing team, remove their email from pending_emails
            team = Team.objects.get(team_name=validated_data['team'])
            pending_emails = team.pending_emails.split(',')
            pending_emails = [email.strip() for email in pending_emails if email.strip() != user.email]
            team.pending_emails = ','.join(pending_emails)
            team.save()
            print("Team member deleted from pending email")
        except Exception as e :
            print("Exception occuured during registration",e)

        # Create a Credit record for the user
        Credit.objects.create(user=user, total_credits=200, used_credits=0, remaining_credits=200)

        # Log the user creation action (if request context is available)
        request = self.context.get('request')
        ip_address = request.META.get('REMOTE_ADDR') if request else '0.0.0.0'
        Log.objects.create(
            user=user,
            action='User created',
            ip_address=ip_address,
            device_info=request.META.get('HTTP_USER_AGENT', 'Unknown device') if request else 'Unknown device'
        )

        return user
  
    
class SendPasswordResetEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    class Meta:
        fields = ['email']
    def validate(self, attrs):
        email = attrs.get('email')
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            if user.is_active:
                uid = urlsafe_base64_encode(force_bytes(user.id))
                token = PasswordResetTokenGenerator().make_token(user)
                link = f'http://localhost:3000/reset-password/{uid}/{token}'
               
                # Send email using EmailJS
                url = "https://api.emailjs.com/api/v1.0/email/send"
                data = {
                    "user_id": settings.EMAILJS_USER_ID,
                    "service_id": settings.EMAILJS_SERVICE_ID,
                    "template_id": settings.EMAILJS_TEMPLATE_ID_RESET,
                    "template_params": {
                        "to_email": email,
                        "to_name": user.first_name,
                        "reset_link": link,
                    },
                    "accessToken": settings.EMAILJS_API_KEY    
                }
               
                headers = {"Content-Type": "application/json"}
                try:
                    response = requests.post(url, json=data, headers=headers)
                    if response.status_code == 200:
                        return attrs
                    else:
                        raise serializers.ValidationError('Failed to send password reset email')
                except Exception as e:
                    raise serializers.ValidationError(f'Error sending email: {str(e)}')
            else:
                raise serializers.ValidationError('Account is not active.')
        else:
            raise serializers.ValidationError('Email does not exist in our records.')

class UserPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
    password2 = serializers.CharField(max_length=255, style={'input_type':'password'}, write_only=True)
    class Meta:
        fields = ['password', 'password2']
    def validate(self, attrs):
        try:
            password = attrs.get('password')
            password2 = attrs.get('password2')
            uid = self.context.get('id')
            token = self.context.get('token')
            if password != password2:
                raise serializers.ValidationError("Password and Confirm Password don't match")
            id = smart_str(urlsafe_base64_decode(uid))
            user = User.objects.get(id=id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                raise serializers.ValidationError('Token is not Valid or Expired')
            
            # Check if the new password is the same as the old password
            if user.check_password(password):
                raise serializers.ValidationError("New password cannot be the same as the old password")
            
            # Validate password strength
            try:
                validate_password(password, user)
            except DjangoValidationError as e:
                raise serializers.ValidationError(list(e.messages))
            
            user.set_password(password)
            user.save()
            return attrs
        except DjangoUnicodeDecodeError as identifier:
            PasswordResetTokenGenerator().check_token(user, token)
            raise serializers.ValidationError('Token is not Valid or Expired')
        
class TeamCreationSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['team', "team_name"]

    def validate(self, data):
        user = self.instance
        print(user.role)

        # Ensure only visitors or users without a team can create/update a team
        if (user.role in ['client', 'sales_account']) or (user.team in ['', None]):
            raise ValidationError('You are not authorized to create or update a team.')
        return data

    def update(self, instance, validated_data):
        team_name = validated_data.get('team_name')
        user = self.instance
        user_team = user.team  # This is a string field, not a ForeignKey

        if user_team == 'no team':
            with transaction.atomic():
                # Create a new team and make the user the org_admin
                new_team = Team.objects.create(
                    org_admin=user,
                    team_name=team_name
                )

                # Add the user to the new team in the TeamMember model
                TeamMember.objects.create(user=user, team=new_team)

                # Update the user's role and team name
                user.role = 'org_admin'
                user.team = team_name  # Assign the string name of the new team
                user.save()

                return user

        # If the user already belongs to a team, update the team name for all members
        elif user_team and user.role == 'org_admin':  # Ensure only org_admin can update the team
            with transaction.atomic():
                # Update the existing team's name
                team = Team.objects.get(team_name=user_team)
                old_team_name = team.team_name
                team.team_name = team_name
                team.save()
                
                user.team = team_name
                user.save()

                # Update the team name for all users who belong to the current team
                members = User.objects.filter(team=old_team_name)
                for member in members:
                    member.team = team_name  # Update the team name for all members
                    member.save()

                print(f"Team name updated from '{old_team_name}' to '{team_name}' for all members.")
                return user
        else:
            raise ValidationError('You are not authorized to update the team name.')

        return user
 
      
        
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number', 'role', 'team']

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number', 'role', 'team']  

    def validate(self, data):
        user = self.instance
        role = data.get('role', user.role)  # Get the role from the request data or the existing role
        team_name = data.get('team', user.team)  # Get the team from the request data or the existing team
        
        if role == 'client':
          
          if team_name:
              team_exists = Team.objects.filter(team_name=team_name).exists()
              if not team_exists:
                  data['team'] = 'no team'  # Set the team to "no team" if it doesn't exist
              else:
                  data['team'] = team_name
          else:
              data['team'] = 'no team'  # Set to "no team" if no team name was provided

        return data
    

class CreditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credit
        fields = ['total_credits', 'used_credits', 'remaining_credits']

class FeatureSerializer(serializers.ModelSerializer):
  class Meta:
      model = Features
      fields = ['features']

class SubscriptionSerializer(serializers.ModelSerializer):
    # features = FeatureSerializer(many=True, source='subscription_features', required=False)
    features = serializers.SerializerMethodField()
    
    class Meta:
        model = Subscription
        fields = ('plan_name', 'price', 'credit_limit', 'features', 'duration')
        
    def get_features(self, obj):
        # Extract the feature names and return them as a list of strings
        return list(obj.subscription_features.values_list('features', flat=True))


class SubscriptionCreateSerializer(serializers.ModelSerializer):
    features = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = Subscription
        fields = ('plan_name', 'price', 'credit_limit', 'features', 'duration', 'user_email')
        
    def get_features(self, obj):
        # Extract the feature names and return them as a list of strings
        return list(obj.subscription_features.values_list('features', flat=True))

class AIToolSerializer(serializers.ModelSerializer):
    class Meta:
        model = AITool
        fields = ('tool_name', 'credits_required')
        
class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Log
        fields = ['id', 'user', 'action', 'ip_address', 'timestamp', 'device_info']
        
class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['transaction_type', 'amount', 'description', 'credit']