from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, RegisterView, LogoutView, ResendOTPView, VerifyOTPView, VisitorOverviewView,
    UserDashboardView, UserDetailsView, UserUpdateView, TeamListView, AddTeamMemberView,
    UpdateTeamMemberView, DeleteTeamMemberView, CreditListView, AssignCreditsView, TransactionHistoryView,
    SubscriptionListView, CreateSubscriptionView, AIToolListView, UseAIToolView, AdminDashboardView, AdminUserListView,
    DelegateAdminPrivilegesView, UserActivityLogView, GenerateReportView, SendPasswordResetEmailView, UserPasswordResetView
    )
from .cnic_data_extraction_view import ExtractCNICView, ExtractEncodedCNICView
from .emirates_data_view import EmiratesDataView, EmiratesEncodedImageView
from .RAG_VIEW import RAGUploadView, RAGGETView, RAGDELETEView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('auth/resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/password-reset/', SendPasswordResetEmailView.as_view(), name='send-reset-password-email'),
    path('auth/password-reset/<uid>/<token>/', UserPasswordResetView.as_view(), name='reset-password'),
    path('visitor/overview/', VisitorOverviewView.as_view(), name='visitor_overview'),
    path('user/dashboard/', UserDashboardView.as_view(), name='user_dashboard'),
    path('user/details/', UserDetailsView.as_view(), name='user_details'),
    path('user/update/', UserUpdateView.as_view(), name='user_update'),
    path('team/', TeamListView.as_view(), name='team'),
    path('team/add/', AddTeamMemberView.as_view(), name='add member'),
    path('team/update/<int:id>/', UpdateTeamMemberView.as_view(), name='team_update'),
    path('team/delete/<int:id>/', DeleteTeamMemberView.as_view(), name='team_delete'),
    path('credits/', CreditListView.as_view(), name='credit_balance'),
    path('credits/assign/', AssignCreditsView.as_view(), name='credit_assign'),
    path('transactions/', TransactionHistoryView.as_view(), name='transaction_history'),
    path('subscriptions/', SubscriptionListView.as_view(), name='subscription_list'),
    path('subscriptions/create/', CreateSubscriptionView.as_view(), name='subscription_create'),
    path('tools/', AIToolListView.as_view(), name='tool_list'),
    path('tools/use/', UseAIToolView.as_view(), name='tool_list'),
    path('tools/use/cnic-data-extraction/', ExtractCNICView.as_view(), name='cnic-data-extraction'),
    path('tools/use/cnic-encoded-data-extraction/', ExtractEncodedCNICView.as_view(), name='cnic-data-extraction'),
    path('tools/use/emirates-id-processing/', EmiratesDataView.as_view(), name='emirates-id-processing'),
    path('tools/use/emirates-encoded-image-processing/', EmiratesEncodedImageView.as_view(), name='emirates-encoded-image-processing'),
    path('tools/use/chat-with-pdf/upload/', RAGUploadView.as_view(), name='chat-with-pdf'),
    path('tools/use/chat-with-pdf/chat/', RAGGETView.as_view(), name='chat-with-pdf'),
    path('tools/use/chat-with-pdf/delete/', RAGDELETEView.as_view(), name='chat-with-pdf'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/privileges/', DelegateAdminPrivilegesView.as_view(), name='delegate_privileges'),
    path('logs/', UserActivityLogView.as_view(), name='user_logs'),
    path('reports/', GenerateReportView.as_view(), name='generate_report'),
]