from rest_framework import generics, status
from django.db.models import Sum
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
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
    permission_classes = [AllowAny]
    def post(self, request, format=None):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.data.get('email')
        password = serializer.data.get('password')
        user = authenticate(email=email, password=password)
        print(user)
        if user is not None and user.is_active==True:
            token = get_tokens_for_user(user)
            return Response({'token':token, 'msg':'Login Success'}, status=status.HTTP_200_OK)
        else:
            return Response({'errors':{'non_field_errors':['Email or Password is not Valid']}}, status=status.HTTP_404_NOT_FOUND)

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

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
        serializer = SendPasswordResetEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'msg':'Password Reset link send. Please check your Email'}, status=status.HTTP_200_OK)
        

class UserPasswordResetView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, uid, token, format=None):
        serializer = UserPasswordResetSerializer(data=request.data, context={'id':uid, 'token':token})
        serializer.is_valid(raise_exception=True)
        return Response({'msg':'Password Reset Successfully'}, status=status.HTTP_200_OK)
    
class VisitorOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_role_choices = User.ROLE_CHOICES[0][0].lower()
        # print(user_role_choices)
        # print("user:",user)
        # print('role:', user.role)
        if user.role != user_role_choices:
            return Response({'error': 'You do not have permission to access this resource.'}, status=status.HTTP_403_FORBIDDEN)
        
        credits = Credit.objects.filter(user=request.user).first()
        tools = AITool.objects.all()

        return Response({
            'credits': {
                'total': credits.total_credits if credits else 0,
                'used': credits.used_credits if credits else 0,
                'remaining': credits.remaining_credits if credits else 0,
            },
            'available_tools': [tool.tool_name for tool in tools],
        })

class UserDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        credit = Credit.objects.filter(user=user).first()
        credit_data = CreditSerializer(credit).data if credit else None  # Serialize the Credit object

        dashboard_data = {
            'name': user.first_name  + ' ' + user.last_name,
            'role': user.role,
            'email': user.email,
            'credits': credit_data 
        }
        return Response(dashboard_data)
    
class UserDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    
class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    print(permission_classes)

    def put(self, request):
        user = request.user
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
             # Log the updation action
            ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
            device_info = request.META.get('HTTP_USER_AGENT', 'Unknown device')
            Log.objects.create(
                user=request.user,
                action=f"Updated user {request.user.email}",
                ip_address=ip_address,
                device_info=device_info
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TeamListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'org_admin':
            return Response({"detail": "Not authorized to view this resource."}, status=status.HTTP_403_FORBIDDEN)
        
        teams = Team.objects.filter(org_admin=request.user)
        if not teams.exists():
            return Response({"detail": "No teams found for this user."}, status=status.HTTP_404_NOT_FOUND)
        
        team_members = User.objects.filter(team=teams.first().team_name, role=User.ROLE_CHOICES[1][0].lower(), is_active=True)
        
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(team_members, request)
        if page is not None:
            serializer = UserSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = UserSerializer(team_members, many=True)
        return Response(serializer.data)

class AddTeamMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Ensure the requesting user is an Org Admin
        if request.user.role != 'org_admin':
            return Response({"detail": "You do not have permission to add members to a team."}, status=status.HTTP_403_FORBIDDEN)

        # Get the team associated with the Org Admin
        try:
            team = Team.objects.get(org_admin=request.user)
        except Team.DoesNotExist:
            return Response({"detail": "Your team does not exist or you are not authorized."}, status=status.HTTP_403_FORBIDDEN)

        # Get the email from the request data
        email = request.data.get('email')
        print(email)
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_email(email)
        except ValidationError:
            return Response({"detail": "Invalid email address."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the email is already a pending member
        pending_emails = team.pending_emails.split(',') if team.pending_emails else []
        if email in [e.strip() for e in pending_emails]:
            return Response({"detail": "This email is already pending for your team."}, status=status.HTTP_400_BAD_REQUEST)

        # Add the email to the team's pending_emails
        pending_emails.append(email)
        team.pending_emails = ','.join(pending_emails)
        team.save()

        # Send an invitation email to the new member
        subject = "Invitation to join the team"
        message = f"You have been invited to join the team {team.team_name}. Please register using the following link: /register"
        send_email = EmailMessage(subject=subject, body=message, from_email=settings.EMAIL_HOST_USER, to=[email])
        send_email.send(fail_silently=False)

        # Log the addition action
        ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
        device_info = request.META.get('HTTP_USER_AGENT', 'Unknown device')
        Log.objects.create(
            user=request.user,
            action=f"Added team member {email} to team {team.team_name}",
            ip_address=ip_address,
            device_info=device_info
        )

        return Response({"msg": "Invitation sent successfully."}, status=status.HTTP_201_CREATED)

class UpdateTeamMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, id):
        # Ensure the requesting user is an Org Admin
        if request.user.role != 'org_admin':
            return Response({"detail": "You do not have permission to update team members."}, status=status.HTTP_403_FORBIDDEN)
        
        # Retrieve the team managed by the Org Admin
        try:
            team = Team.objects.get(org_admin=request.user)
            team_member = User.objects.get(id=id, team=team, is_active=True)
        except Team.DoesNotExist:
            return Response({"detail": "Your team does not exist or you are not authorized."}, status=status.HTTP_403_FORBIDDEN)
        except User.DoesNotExist:
            return Response({"detail": "Team member not found."}, status=status.HTTP_404_NOT_FOUND)

        # Proceed to update the team member's details
        serializer = UserSerializer(team_member, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Log the updation action
            ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
            device_info = request.META.get('HTTP_USER_AGENT', 'Unknown device')
            Log.objects.create(
                user=request.user,
                action=f"Updated team member {team_member.email} by {request.user.email}",
                ip_address=ip_address,
                device_info=device_info
            )
            
            return Response({"msg":"User updated successfully", "data":serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteTeamMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, id):
        # Ensure the requesting user is an Org Admin
        if request.user.role != 'org_admin':
            return Response({"detail": "You do not have permission to delete team members."}, status=status.HTTP_403_FORBIDDEN)
        
        # Retrieve the team managed by the Org Admin
        try:
            team = Team.objects.get(org_admin=request.user)
            team_member = User.objects.get(id=id, team=team, is_active=True)
        except Team.DoesNotExist:
            return Response({"detail": "Your team does not exist or you are not authorized."}, status=status.HTTP_403_FORBIDDEN)
        except User.DoesNotExist:
            return Response({"detail": "Team member not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Proceed to delete the team member
        # team_member.delete()
        team_member.is_active = False
        if team_member.email in team.pending_emails:
            team.pending_emails.remove(team_member.email)
            print("Team member deleted")
        team_member.save()
        
         # Log the deletion action before deleting the team member
        ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
        device_info = request.META.get('HTTP_USER_AGENT', 'Unknown device')
        Log.objects.create(
            user=request.user,
            action=f"Deleted team member {team_member.email} by {request.user.email}",
            ip_address=ip_address,
            device_info=device_info
        )
        return Response({'msg':f"{team_member} deleted successfully"},status=status.HTTP_204_NO_CONTENT)


class CreditListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch the user's credits
        credits = Credit.objects.filter(user=request.user).first()
        transactions = Transaction.objects.filter(credit=credits)

        # Response with credit details and transaction history
        return Response({
            'credits': {
                'total': credits.total_credits,
                'used': credits.used_credits,
                'remaining': credits.remaining_credits,
            },
            'transactions': [transaction.description for transaction in transactions],
        })

class AssignCreditsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Check if the user is an Org Admin or an Admin
        if request.user.role == 'org_admin' or request.user.is_admin:
            user_id = request.data.get('user_id')
            credits_to_add = int(request.data.get('credits', 0))

            try:
                user = User.objects.get(id=user_id)

                # If the user is an Org Admin, ensure they have a team and the user is in the same team
                if request.user.role == 'org_admin':
                    if not request.user.team or request.user.team == 'no team':
                        return Response({'error': 'You do not have a team to manage credits.'}, status=status.HTTP_403_FORBIDDEN)
                    if user.team != request.user.team:
                        return Response({'error': 'User is not a member of your team.'}, status=status.HTTP_403_FORBIDDEN)

                    # Get the credit record of the Org Admin
                    org_admin_credits = Credit.objects.get(user=request.user)

                    # Check if the Org Admin has enough credits to assign
                    if org_admin_credits.remaining_credits < credits_to_add:
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

                return Response({'message': f'Credits assigned successfully to {user.email}'})
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            except Credit.DoesNotExist:
                return Response({'error': 'Org Admin does not have a credit account.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'You do not have permission to access this resource.'}, status=status.HTTP_403_FORBIDDEN)


class TransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        paginator = StandardResultsSetPagination()

        if request.user.role == 'org_admin' and (request.user.team and request.user.team != 'no team') or request.user.is_admin:
            user_ids = request.data.get('user_id')  # Get list of user IDs
            users = User.objects.filter(team=request.user.team, id=user_ids)
            
            if not users.exists():
                return Response({'error': 'No users found or users are not in your team'}, status=status.HTTP_404_NOT_FOUND)
            
            transactions = Transaction.objects.filter(credit__user__in=users)
        else:
            transactions = Transaction.objects.filter(credit__user=request.user)

        page = paginator.paginate_queryset(transactions, request)
        if page is not None:
            serializer = TransactionSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        return Response({'transactions': []})

class SubscriptionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        subscriptions = Subscription.objects.all()
        serializer = SubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)

class CreateSubscriptionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        if not request.user.is_admin:
            return Response({'error': 'You do not have permission to access this resource.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = SubscriptionCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AIToolListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tools = AITool.objects.all()
        serializer = AIToolSerializer(tools, many=True)
        return Response(serializer.data)

class UseAIToolView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tool_name = request.data.get('tool_name')
        print(request.data)
        try:
            tool = AITool.objects.get(tool_name=tool_name)

            credits = Credit.objects.get(user=request.user)

            # Check if there are enough credits
            if credits.remaining_credits >= tool.credits_required:
                credits.remaining_credits -= tool.credits_required
                credits.used_credits = tool.credits_required
                credits.save()
                
                # Log the transaction
                Transaction.objects.create(
                    credit=credits,
                    transaction_type=Transaction.TransactionType.DEDUCTION,
                    amount=tool.credits_required,
                    description=f"Used {tool.tool_name} tool"
                )
                
                return Response({'message': 'Tool used successfully'})
            else:
                return Response({'error': 'Insufficient credits'}, status=status.HTTP_400_BAD_REQUEST)
        except AITool.DoesNotExist:
            return Response({'error': 'Tool not found'}, status=status.HTTP_404_NOT_FOUND)
        except Credit.DoesNotExist:
            return Response({'error': 'Credit record not found'}, status=status.HTTP_404_NOT_FOUND)

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
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        users = User.objects.all()
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(users, request)
        if page is not None:
            serializer = UserSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class DelegateAdminPrivilegesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
            
            # Grant admin privileges
            user.is_admin = True
            user.is_superuser = True  
            user.save()

            return Response({'message': 'Admin privileges granted'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class UserActivityLogView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        logs = Log.objects.all()
        paginator = StandardResultsSetPagination()
        
        page = paginator.paginate_queryset(logs, request)
        if page is not None:
            serializer = LogSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = LogSerializer(logs, many=True)
        return Response(serializer.data)
    
    
class GenerateReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        user_id = request.query_params.get('user_id')

        logs = Log.objects.all()

        if start_date and end_date:
            logs = logs.filter(timestamp__range=[start_date, end_date])
        if user_id:
            logs = logs.filter(user_id=user_id)

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(logs, request)
        if page is not None:
            serializer = LogSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = LogSerializer(logs, many=True)
        return Response(serializer.data)