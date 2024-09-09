from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Credit, Subscription, AITool, Log, Team, Transaction
from rest_framework.response import Response
from rest_framework import status
from django.utils.encoding import smart_str, force_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
# from backendapp.email_send import Util
from django.core.mail import EmailMessage
import os
from django.conf import settings

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

class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone_number', 'password', 'password2')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        
        # Check if user with this email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        validated_data['role'] = 'visitor'  # Set default role to 'visitor'
        validated_data['team'] = 'no team'  # Set default team to 'no team'
        user = User.objects.create_user(**validated_data)
        
        # Create a Credit record for the user
        Credit.objects.create(user=user, total_credits=200, used_credits=0, remaining_credits=200)
        
        # Log the user creation action
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
    # print(email)
    if User.objects.filter(email=email).exists():
      user = User.objects.get(email = email)
      if user.is_active:
        uid = urlsafe_base64_encode(force_bytes(user.id))
        print('Encoded UID', uid)
        token = PasswordResetTokenGenerator().make_token(user)
        print('Password Reset Token', token)
        link = 'http://localhost:3000/api/user/reset/'+uid+'/'+token
        print('Password Reset Link', link)
        # Send EMail
        body = 'Click Following Link to Reset Your Password '+link
        print("sending email")
        email_send = EmailMessage(
          subject='Reset Your Password',
          body=body,
          from_email=settings.EMAIL_HOST_USER,
          to=[email]
          )
        email_send.send(fail_silently=False)
        print("send succesfully")

        return attrs
      else:
        raise serializers.ValidationError('Account doesn\'t exist with this email.')
    else:
      raise serializers.ValidationError('You are not a Registered User')


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
      print(uid)
      token = self.context.get('token')
      print(token)
      if password != password2:
        raise serializers.ValidationError("Password and Confirm Password doesn't match")
      id = smart_str(urlsafe_base64_decode(uid))
      user = User.objects.get(id=id)
      if not PasswordResetTokenGenerator().check_token(user, token):
        raise serializers.ValidationError('Token is not Valid or Expired')
      user.set_password(password)
      user.save()
      return attrs
    except DjangoUnicodeDecodeError as identifier:
      PasswordResetTokenGenerator().check_token(user, token)
      raise serializers.ValidationError('Token is not Valid or Expired')

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

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ('plan_name', 'price', 'credit_limit', 'features', 'duration')

class SubscriptionCreateSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = Subscription
        fields = ('plan_name', 'price', 'credit_limit', 'features', 'duration', 'user_email')

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