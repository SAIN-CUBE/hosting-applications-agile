import random
import requests
from rest_framework import generics, status
from django.contrib.auth import get_user_model
from django.db.models import Sum
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import User, Credit, AITool, Team, Transaction, Subscription, Log
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from .serializers import (
    CustomTokenObtainPairSerializer, UserRegistrationSerializer, SendPasswordResetEmailSerializer
    , UserSerializer  , UserPasswordResetSerializer,
    SubscriptionSerializer, SubscriptionCreateSerializer , AIToolSerializer, LogSerializer, UserLoginSerializer
    ,CreditSerializer, UserUpdateSerializer, TransactionSerializer
)
from django.contrib.auth import authenticate
from rest_framework.pagination import PageNumberPagination
from django.core.mail import EmailMessage
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from .logger.logger import logging

# logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# Generate Token Manually
def get_tokens_for_user(user):
  refresh = RefreshToken.for_user(user)
  return {
      'refresh': str(refresh),
      'access': str(refresh.access_token),
  }

class LoginView(TokenObtainPairView):
    # serializer_class = CustomTokenObtainPairSerializer
    logging.info(f"Login user...")
    permission_classes = [AllowAny]
    def post(self, request, format=None):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.data.get('email')
        password = serializer.data.get('password')
        user = authenticate(email=email, password=password)
        logging.info(user)
        if user is not None and user.is_active==True:
            token = get_tokens_for_user(user)
            logging.info("Login complete ")
            return Response({'token':token, 'msg':'Login Success'}, status=status.HTTP_200_OK)
        else:
            logging.error("Login failed")
            return Response({'errors':{'non_field_errors':['Email or Password is not Valid']}}, status=status.HTTP_404_NOT_FOUND)

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                # Create user account immediately, but set is_active to False
                user = serializer.save(is_active=False)
                otp = self.generate_otp()
                user.otp = otp
                user.save()

                if self.send_otp_email(user.email, user.first_name, otp):
                    logging.info("sending otp")
                    return Response(
                        {"message": "User registered. Please check your email for OTP to activate your account.", "user_id": user.id},
                        status=status.HTTP_200_OK
                    )
                else:
                    logging.info("failed to send an otp ")
                    raise ValidationError("Failed to send OTP email.")
            except Exception as e:
                logging.error(f"Error in user registration: {str(e)}")
                return Response(
                    {"error": "An error occurred during registration. Please try again."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def generate_otp(self):
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])

    def send_otp_email(self, email, first_name, otp):
        url = "https://api.emailjs.com/api/v1.0/email/send"
        data = {
            "user_id": settings.EMAILJS_USER_ID,
            "service_id": settings.EMAILJS_SERVICE_ID,
            "template_id": settings.EMAILJS_TEMPLATE_ID,
            "template_params": {
                "to_email": email,
                "to_name": first_name,
                "otp": otp,
            },
            "accessToken": settings.EMAILJS_API_KEY    
        }
        
        headers = {"Content-Type": "application/json"}
        try:
            response = requests.post(url, json=data, headers=headers)
            if response.status_code == 200:
                logging.info(f"OTP email sent successfully to {email}")
                return True
            else:
                logging.error(f"Error sending email to {email}: {response.text}")
                return False
        except Exception as e:
            logging.error(f"Error sending email to {email}: {str(e)}")
            return False

class VerifyOTPView(generics.CreateAPIView):
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        entered_otp = request.data.get('otp')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.otp == entered_otp:
            user.is_active = True
            user.otp = None
            user.save()
            return Response({"message": "Account verified and activated successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(generics.CreateAPIView):
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        new_otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        user.otp = new_otp
        user.save()

        if self.send_otp_email(user.email, user.first_name, new_otp):
            logging.info("New OTP send sucessfully...")
            return Response({"message": "New OTP sent successfully"}, status=status.HTTP_200_OK)
        else:
            logging.error("Failed to send an OTP")
            return Response({"error": "Failed to send OTP"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def send_otp_email(self, email, first_name, otp):
        # Use the same email sending logic as in RegisterView
        url = "https://api.emailjs.com/api/v1.0/email/send"
        data = {
            "user_id": settings.EMAILJS_USER_ID,
            "service_id": settings.EMAILJS_SERVICE_ID,
            "template_id": settings.EMAILJS_TEMPLATE_ID,
            "template_params": {
                "to_email": email,
                "to_name": first_name,
                "otp": otp,
            },
            "accessToken": settings.EMAILJS_API_KEY    
        }
        
        headers = {"Content-Type": "application/json"}
        try:
            response = requests.post(url, json=data, headers=headers)
            return response.status_code == 200
        except Exception as e:
            logging.error(f"Error sending email to {email}: {str(e)}")
            return False
        

class LogoutView(generics.GenericAPIView):
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class SendPasswordResetEmailView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, format=None):
        try:
            serializer = SendPasswordResetEmailSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            logging.info("Password reset email sent successfully for email: %s", request.data.get('email'))
            return Response({'msg': 'Password Reset link sent. Please check your email.'}, status=status.HTTP_200_OK)
        
        except ValidationError as e:
            logging.error(f"error in password reset email: {serializer.errors}")
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logging.error("An unexpected error occurred while sending password reset email")
            return Response({'error': 'An error occurred. Please try again later.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserPasswordResetView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, uid, token, format=None):
        try:
            serializer = UserPasswordResetSerializer(data=request.data, context={'id': uid, 'token': token})
            serializer.is_valid(raise_exception=True)
            logging.info("Password reset successful for user with UID: %s", uid)
            return Response({'msg': 'Password Reset Successfully'}, status=status.HTTP_200_OK)

        except ValidationError as e:
            logging.error("Validation error for UID: %s, errors: %s", uid, serializer.errors)
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logging.exception("An unexpected error occurred during password reset for UID: %s", uid)
            return Response({'error': 'An error occurred. Please try again later.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class VisitorOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            user_role_choices = User.ROLE_CHOICES[0][0].lower()

            logging.info("Visitor overview requested by user: %s, role: %s", user.username, user.role)

            if user.role != user_role_choices:
                logging.warning("Unauthorized access attempt by user: %s with role: %s", user.username, user.role)
                return Response({'error': 'You do not have permission to access this resource.'}, status=status.HTTP_403_FORBIDDEN)

            credits = Credit.objects.filter(user=request.user).first()
            tools = AITool.objects.all()

            logging.info("Credits and tools successfully retrieved for user: %s", user.username)

            return Response({
                'credits': {
                    'total': credits.total_credits if credits else 0,
                    'used': credits.used_credits if credits else 0,
                    'remaining': credits.remaining_credits if credits else 0,
                },
                'available_tools': [tool.tool_name for tool in tools],
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logging.exception("An unexpected error occurred while processing visitor overview for user: %s", request.user.username)
            return Response({'error': 'An error occurred. Please try again later.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            logging.info("Dashboard data requested by user: %s", user.username)

            credit = Credit.objects.filter(user=user).first()
            credit_data = CreditSerializer(credit).data if credit else None

            dashboard_data = {
                'name': f"{user.first_name} {user.last_name}",
                'role': user.role,
                'email': user.email,
                'credits': credit_data
            }

            logging.info("Dashboard data successfully retrieved for user: %s", user.username)
            return Response(dashboard_data, status=status.HTTP_200_OK)

        except Exception as e:
            logging.exception("An error occurred while fetching dashboard data for user: %s", request.user.username)
            return Response({'error': 'An error occurred. Please try again later.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class UserDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            serializer = UserSerializer(user)
            logging.info("User details requested for user: %s", user.email)
            return Response(serializer.data)
        except:
            logging.exception("An error occurred while fetching user details for user: %s", user.email)
    
    
class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    # print(permission_classes)

    def put(self, request):
        try:
            user = request.user
            logging.info("User update request initiated for user: %s", user.email)
            
            serializer = UserUpdateSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                logging.info(f"Details updated for user {user.email}")
                ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
                device_info = request.META.get('HTTP_USER_AGENT', 'Unknown device')

                # Log the update action
                Log.objects.create(
                    user=user,
                    action=f"Updated user {user.email}",
                    ip_address=ip_address,
                    device_info=device_info
                )
                
                logging.info("User %s updated successfully from IP: %s, Device: %s", user.email, ip_address, device_info)
                return Response(serializer.data, status=status.HTTP_200_OK)

            logging.warning("Invalid data submitted for user: %s, errors: %s", user.email, serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logging.exception("An error occurred while updating user: %s", request.user.email)
            return Response({'error': 'An error occurred. Please try again later.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TeamListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Check if the user has the appropriate role
            if request.user.role.lower() != 'org_admin':
                logging.warning("Unauthorized access attempt by user: %s", request.user.email)
                return Response({"detail": "Not authorized to view this resource."}, status=status.HTTP_403_FORBIDDEN)

            # Fetch teams associated with the organization admin
            teams = Team.objects.filter(org_admin=request.user)
            if not teams.exists():
                logging.info("No teams found for org_admin: %s", request.user.email)
                return Response({"detail": "No teams found for this user."}, status=status.HTTP_404_NOT_FOUND)

            # Fetch team members
            team = teams.first()
            logging.info("Fetching team members for team: %s by org_admin: %s", team.team_name, request.user.email)
            team_members = User.objects.filter(team=team.team_name, role=User.ROLE_CHOICES[1][0].lower(), is_active=True)

            # Pagination logic
            paginator = StandardResultsSetPagination()
            page = paginator.paginate_queryset(team_members, request)
            if page is not None:
                serializer = UserSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)

            # Return team members without pagination if pagination is not applicable
            serializer = UserSerializer(team_members, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception.ObjectDoesNotExist as e:
            logging.error("Object does not exist: %s", str(e))
            return Response({"detail": "Requested resource not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logging.exception("An unexpected error occurred: %s", str(e))
            return Response({"error": "An error occurred. Please try again later.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AddTeamMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Ensure the requesting user is an Org Admin
            if request.user.role.lower() != 'org_admin':
                logging.warning("Unauthorized attempt by user: %s to add a team member.", request.user.email)
                return Response({"detail": "You do not have permission to add members to a team."}, status=status.HTTP_403_FORBIDDEN)

            # Get the team associated with the Org Admin
            try:
                team = Team.objects.get(org_admin=request.user)
            except Team.DoesNotExist:
                logging.warning("Team does not exist or user is unauthorized: %s", request.user.email)
                return Response({"detail": "Your team does not exist or you are not authorized."}, status=status.HTTP_403_FORBIDDEN)

            # Get the email from the request data
            email = request.data.get('email')
            if not email:
                return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                validate_email(email)
            except ValidationError:
                logging.warning("Invalid email address submitted: %s by user: %s", email, request.user.email)
                return Response({"detail": "Invalid email address."}, status=status.HTTP_400_BAD_REQUEST)

            # Check if the email is already a pending member
            pending_emails = team.pending_emails.split(',') if team.pending_emails else []
            if email in [e.strip() for e in pending_emails]:
                logging.info("Email %s is already pending for team: %s", email, team.team_name)
                return Response({"detail": "This email is already pending for your team."}, status=status.HTTP_400_BAD_REQUEST)

            # Add the email to the team's pending_emails
            pending_emails.append(email)
            team.pending_emails = ','.join(pending_emails)
            team.save()

            # Send an invitation email to the new member
            subject = "Invitation to join the team"
            message = f"You have been invited to join the team {team.team_name}. Please register using the following link: /register"
            try:
                send_email = EmailMessage(subject=subject, body=message, from_email=settings.EMAIL_HOST_USER, to=[email])
                send_email.send(fail_silently=False)
                logging.info("Invitation email sent to %s for team %s", email, team.team_name)
            except Exception as e:
                logging.error("Failed to send email to %s: %s", email, str(e))
                return Response({"detail": "Failed to send invitation email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Log the addition action
            ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
            device_info = request.META.get('HTTP_USER_AGENT', 'Unknown device')
            Log.objects.create(
                user=request.user,
                action=f"Added team member {email} to team {team.team_name}",
                ip_address=ip_address,
                device_info=device_info
            )

            logging.info("User %s successfully added member %s to team %s", request.user.email, email, team.team_name)
            return Response({"msg": "Invitation sent successfully."}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logging.exception("An unexpected error occurred while adding team member for user: %s", request.user.email)
            return Response({"error": "An unexpected error occurred. Please try again later.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateTeamMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, id):
        try:
            # Ensure the requesting user is an Org Admin
            if request.user.role.lower() != 'org_admin':
                logging.warning("Unauthorized attempt to update team member by user: %s", request.user.email)
                return Response({"detail": "You do not have permission to update team members."}, status=status.HTTP_403_FORBIDDEN)

            # Retrieve the team managed by the Org Admin
            try:
                team = Team.objects.get(org_admin=request.user)
                team_member = User.objects.get(id=id, team=team, is_active=True)
            except Team.DoesNotExist:
                logging.warning("Team does not exist or user is unauthorized: %s", request.user.email)
                return Response({"detail": "Your team does not exist or you are not authorized."}, status=status.HTTP_403_FORBIDDEN)
            except User.DoesNotExist:
                logging.warning("Team member with ID %s not found for team %s", id, team.team_name)
                return Response({"detail": "Team member not found."}, status=status.HTTP_404_NOT_FOUND)

            # Proceed to update the team member's details
            serializer = UserSerializer(team_member, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()

                # Log the update action
                ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
                device_info = request.META.get('HTTP_USER_AGENT', 'Unknown device')
                Log.objects.create(
                    user=request.user,
                    action=f"Updated team member {team_member.email} by {request.user.email}",
                    ip_address=ip_address,
                    device_info=device_info
                )
                logging.info("Team member %s updated successfully by %s", team_member.email, request.user.email)

                return Response({"msg": "User updated successfully", "data": serializer.data}, status=status.HTTP_200_OK)

            logging.warning("Invalid data submitted for team member %s by user %s", team_member.email, request.user.email)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logging.exception("An unexpected error occurred while updating team member by user: %s", request.user.email)
            return Response({"error": "An unexpected error occurred. Please try again later.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DeleteTeamMemberView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, id):
        try:
            # Ensure the requesting user is an Org Admin
            if request.user.role.lower() != 'org_admin':
                logging.warning("Unauthorized deletion attempt by user: %s", request.user.email)
                return Response({"detail": "You do not have permission to delete team members."}, status=status.HTTP_403_FORBIDDEN)
            
            # Retrieve the team managed by the Org Admin
            try:
                team = Team.objects.get(org_admin=request.user)
                team_member = User.objects.get(id=id, team=team, is_active=True)
            except Team.DoesNotExist:
                logging.warning("Team does not exist or user is unauthorized: %s", request.user.email)
                return Response({"detail": "Your team does not exist or you are not authorized."}, status=status.HTTP_403_FORBIDDEN)
            except User.DoesNotExist:
                logging.warning("Team member with ID %s not found for team %s", id, team.team_name)
                return Response({"detail": "Team member not found."}, status=status.HTTP_404_NOT_FOUND)

            # Proceed to deactivate the team member
            team_member.is_active = False
            team_member.save()

            # Check if the email is in the pending emails list and remove it if so
            pending_emails = team.pending_emails.split(',') if team.pending_emails else []
            if team_member.email in pending_emails:
                pending_emails.remove(team_member.email)
                team.pending_emails = ','.join(pending_emails)
                team.save()
                logging.info("Pending email %s removed from team %s", team_member.email, team.team_name)

            # Log the deletion action
            ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
            device_info = request.META.get('HTTP_USER_AGENT', 'Unknown device')
            Log.objects.create(
                user=request.user,
                action=f"Deleted team member {team_member.email} by {request.user.email}",
                ip_address=ip_address,
                device_info=device_info
            )

            logging.info("Team member %s deleted successfully by %s", team_member.email, request.user.email)
            return Response({'msg': f"{team_member.email} deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            logging.exception("An unexpected error occurred while deleting team member by user: %s", request.user.email)
            return Response({"error": "An unexpected error occurred. Please try again later.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class CreditListView(APIView):
    permission_classes = [IsAuthenticated]
        
    def get(self, request):
        try:
            # Fetch the user's credits
            credits = Credit.objects.filter(user=request.user).first()
            
            if not credits:
                logging.info("No credits found for user: %s", request.user.email)
                return Response({"detail": "No credits found for this user."}, status=status.HTTP_404_NOT_FOUND)

            # Fetch related transactions
            transactions = Transaction.objects.filter(credit=credits)

            # Response with credit details and transaction history
            response_data = {
                'credits': {
                    'total': credits.total_credits,
                    'used': credits.used_credits,
                    'remaining': credits.remaining_credits,
                },
                'transactions': [
                    {
                        'description': transaction.description,
                        'amount': transaction.amount,
                        'date': transaction.date
                    }
                    for transaction in transactions
                ],
            }
            logging.info("Credit and transaction data retrieved successfully for user: %s", request.user.email)

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logging.exception("An unexpected error occurred while fetching credit data for user: %s", request.user.email)
            return Response({"error": "An error occurred. Please try again later.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AssignCreditsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # # Check if the user is an Org Admin or an Admin
        if request.user.role.lower() != 'org_admin' and not request.user.is_admin:
            logging.warning("Unauthorized attempt to assign credits by user: %s", request.user.email)
            return Response({'error': 'You do not have permission to access this resource.'}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        credits_to_add = request.data.get('credits')

        if not user_id or not credits_to_add:
            logging.warning("Missing required fields in credit assignment request by user: %s", request.user.email)
            return Response({'error': 'user_id and credits are required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            credits_to_add = int(credits_to_add)
        except ValueError:
            logging.warning("Invalid credits amount provided by user: %s", request.user.email)
            return Response({'error': 'Credits value must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)


        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logging.error("User with id %s not found, requested by %s", user_id, request.user.email)
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            # If the user is an Org Admin, ensure they have a team and the user is in the same team
            if request.user.role == 'org_admin':
                if not request.user.team or request.user.team == 'no team':
                    logging.warning("Org Admin %s does not have a valid team.", request.user.email)
                    return Response({'error': 'You do not have a team to manage credits.'}, status=status.HTTP_403_FORBIDDEN)
                if user.team != request.user.team:
                    logging.warning("Org Admin %s tried to assign credits to user %s not in their team.", request.user.email, user.email)
                    return Response({'error': 'User is not a member of your team.'}, status=status.HTTP_403_FORBIDDEN)

                # Get the credit record of the Org Admin
                org_admin_credits = Credit.objects.get(user=request.user)

                # Check if the Org Admin has enough credits to assign
                if org_admin_credits.remaining_credits < credits_to_add:
                    logging.warning("Org Admin %s tried to assign more credits than they have.", request.user.email)
                    return Response({'error': 'You do not have enough credits to assign.'}, status=status.HTTP_400_BAD_REQUEST)

                # Deduct the assigned credits from the Org Admin's credits
                org_admin_credits.total_credits -= credits_to_add
                org_admin_credits.remaining_credits -= credits_to_add
                org_admin_credits.save()

                # Create a transaction record for the Org Admin's deduction
                Transaction.objects.create(
                    credit=org_admin_credits,
                    transaction_type=Transaction.TransactionType.DEDUCTION,
                    amount=credits_to_add,
                    description=f'Credits deducted for assigning to {user.email}'
                )
                
                # Log the credit deduction action
                ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
                device_info = request.META.get('HTTP_USER_AGENT', 'Unknown device')
                Log.objects.create(
                    user=request.user,
                    action=f'Deducted {credits_to_add} credits from own account',
                    ip_address=ip_address,
                    device_info=device_info
                )

            # Assign credits to the user (for both Org Admin and Admin)
            credits, created = Credit.objects.get_or_create(user=user)
            credits.total_credits += credits_to_add
            credits.remaining_credits += credits_to_add
            credits.save()

            # Create a transaction record for the credit assignment
            Transaction.objects.create(
                credit=credits,
                transaction_type=Transaction.TransactionType.ADDITION,
                amount=credits_to_add,
                description=f'Credits assigned by {request.user.email}'
            )
            
            # Log the credit assignment action
            ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
            device_info = request.META.get('HTTP_USER_AGENT', 'Unknown device')
            Log.objects.create(
                user=request.user,
                action=f'Assigned {credits_to_add} credits to {user.email}',
                ip_address=ip_address,
                device_info=device_info
            )
            
            logging.info("Credits successfully assigned by %s to user %s", request.user.email, user.email)
            return Response({'message': f'Credits assigned successfully to {user.email}'})
        except Credit.DoesNotExist:
                logging.exception("Org Admin does not have a credit account.")
                return Response({'error': 'Org Admin does not have a credit account.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logging.exception("An error occurred while assigning credits.")
            return Response({'error': 'An error occurred while assigning credits. Please try again later.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        paginator = StandardResultsSetPagination()

        try:
            if request.user.role == 'org_admin' and (request.user.team and request.user.team != 'no team') or request.user.is_admin:
                user_ids = request.data.get('user_id')  # Get list of user IDs from query params
                if not user_ids:
                    logging.warning("Org Admin %s did not provide user ID.", request.user.email)
                    return Response({'error': 'User ID is required for org_admin.'}, status=status.HTTP_400_BAD_REQUEST)

                users = User.objects.filter(team=request.user.team, id__in=user_ids)
                if not users.exists():
                    logging.warning("No users found in team for Org Admin %s.", request.user.email)
                    return Response({'error': 'No users found or users are not in your team.'}, status=status.HTTP_404_NOT_FOUND)

                transactions = Transaction.objects.filter(credit__user__in=users)
            else:
                transactions = Transaction.objects.filter(credit__user=request.user)

            page = paginator.paginate_queryset(transactions, request)
            if page is not None:
                serializer = TransactionSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)

            return Response({'transactions': []}, status=status.HTTP_200_OK)

        except Exception as e:
            logging.exception("An error occurred while fetching transaction history for user: %s", request.user.email)
            return Response({'error': 'An error occurred while retrieving transaction history.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubscriptionListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            subscriptions = Subscription.objects.all()
            if not subscriptions.exists():
                return Response({'message': 'No subscriptions available at the moment.'}, status=status.HTTP_404_NOT_FOUND)

            serializer = SubscriptionSerializer(subscriptions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logging.exception("An error occurred while fetching subscriptions.")
            return Response({'error': 'An error occurred while retrieving subscriptions.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateSubscriptionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        try:
            # Check if the user has admin privileges
            if not request.user.is_admin:
                logging.warning("Unauthorized subscription creation attempt by user: %s", request.user.email)
                return Response({'error': 'You do not have permission to access this resource.'}, status=status.HTTP_403_FORBIDDEN)
            
            # Deserialize and validate the subscription data
            serializer = SubscriptionCreateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()

                # Log the successful subscription creation
                logging.info("Subscription created successfully by admin user: %s", request.user.email)

                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            # Handle invalid serializer data
            logging.warning("Invalid subscription data provided by user: %s", request.user.email)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logging.exception("An error occurred while creating the subscription for user: %s", request.user.email)
            return Response({'error': 'An error occurred while creating the subscription.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIToolListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            tools = AITool.objects.all()
            serializer = AIToolSerializer(tools, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logging.exception("Error occurred while fetching AI tools list.")
            return Response({'error': 'An error occurred while retrieving the AI tools.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UseAIToolView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tool_name = request.data.get('tool_name')
        if not tool_name:
            return Response({'error': 'tool_name is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tool = AITool.objects.get(tool_name=tool_name)
            credits = Credit.objects.get(user=request.user)

            # Check if there are enough credits
            if credits.remaining_credits >= tool.credits_required:
                credits.remaining_credits -= tool.credits_required
                credits.used_credits += tool.credits_required  # Increment used credits
                credits.save()

                # Log the transaction
                Transaction.objects.create(
                    credit=credits,
                    transaction_type=Transaction.TransactionType.DEDUCTION,
                    amount=tool.credits_required,
                    description=f"Used {tool.tool_name} tool"
                )

                logging.info("User %s successfully used tool: %s", request.user.email, tool_name)
                return Response({'message': 'Tool used successfully'}, status=status.HTTP_200_OK)
            else:
                logging.warning("User %s attempted to use tool %s with insufficient credits", request.user.email, tool_name)
                return Response({'error': 'Insufficient credits'}, status=status.HTTP_400_BAD_REQUEST)
                
        except AITool.DoesNotExist:
            logging.error("Tool %s not found for user %s", tool_name, request.user.email)
            return Response({'error': 'Tool not found'}, status=status.HTTP_404_NOT_FOUND)
        except Credit.DoesNotExist:
            logging.error("Credit record not found for user %s", request.user.email)
            return Response({'error': 'Credit record not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logging.exception("An error occurred while processing the tool use for user: %s", request.user.email)
            return Response({'error': 'An unexpected error occurred.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Fetch data needed for admin dashboard
        credits = Credit.objects.filter(user=request.user).first()
        data = {
            'total_users': User.objects.count(),
            'total_credits_used_by_users': Credit.objects.aggregate(total_credits=Sum('total_credits'))['total_credits']
        }
        return Response(data)

class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        try:
            users = User.objects.all()
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(users, request)
            if page is not None:
                serializer = UserSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)
            
            serializer = UserSerializer(users, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logging.exception("An error occurred while fetching the admin user list.")
            return Response({'error': 'An error occurred while retrieving the user list.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DelegateAdminPrivilegesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)

            # Grant admin privileges
            user.is_admin = True
            user.is_superuser = True  
            user.save()

            logging.info("Admin privileges granted to user %s by %s", user.email, request.user.email)
            return Response({'message': 'Admin privileges granted'}, status=status.HTTP_200_OK)
        
        except User.DoesNotExist:
            logging.error("User with ID %s not found", user_id)
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            logging.exception("Error occurred while granting admin privileges.")
            return Response({'error': 'An error occurred while granting admin privileges.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserActivityLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            logs = Log.objects.all()
            paginator = StandardResultsSetPagination()
            page = paginator.paginate_queryset(logs, request)
            if page is not None:
                serializer = LogSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)
            
            serializer = LogSerializer(logs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logging.exception("Error occurred while retrieving activity logs.")
            return Response({'error': 'An error occurred while retrieving logs.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
class GenerateReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            user_id = request.query_params.get('user_id')

            logs = Log.objects.all()

            # Filter logs by date range
            if start_date and end_date:
                logs = logs.filter(timestamp__range=[start_date, end_date])

            # Filter logs by user_id
            if user_id:
                logs = logs.filter(user_id=user_id)

            paginator = StandardResultsSetPagination()
            page = paginator.paginate_queryset(logs, request)
            if page is not None:
                serializer = LogSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)
            
            serializer = LogSerializer(logs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logging.exception("Error occurred while generating the report.")
            return Response({'error': 'An error occurred while generating the report.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)