from django.db import models
import re, uuid
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from .logger.logger import logging
# from social_core.pipeline.partial import partial


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, password2=None, **extra_fields):
        if not email:
            raise ValueError('User must have an email address')

        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        user = self.create_user(email, password, role="", **extra_fields)
        user.is_admin = True
        user.is_superuser = True
        # user.is_staff = True
        user.save(using=self._db)
        return user

class User(AbstractBaseUser):
    ROLE_CHOICES = [
        ('visitor', 'Visitor'),
        ('client', 'Client'),
        ('org_admin', 'Org_Admin'),
        ('sales_account', 'Sales_Account'),
    ]
    
    email = models.EmailField(verbose_name='Email', max_length=255, unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    # team = models.ForeignKey("backendapp.Team", on_delete=models.SET_NULL, null=True, blank=True, related_name='members')  # Add team field
    team = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sid = models.CharField(max_length=34, unique=True, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES , default='vistor')
    loginWithGoogle = models.BooleanField(default=False)  # This line is added
    otp = models.CharField(max_length=6, blank=True, null=True)  # New OTP field

    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.email

    def is_admin_user(self):
        return self.is_admin or self.is_superuser
    
    def has_perm(self, perm, obj=None):
        return self.is_admin

    def has_module_perms(self, app_label):
        return True

    @property
    def is_staff(self):
        return self.is_admin
    
    def save(self, *args, **kwargs):
        if not self.sid:  # If the user doesn't have an SID, generate one
            try:
                self.sid = self.generate_sid()
            except Exception as e:
                logging.error(f"Error generating SID for user {self.email}: {e}")
                raise e
        super(User, self).save(*args, **kwargs)

    @staticmethod
    def generate_sid():
        """
        Generates a unique SID with the format: 'US' + UUID without hyphens.
        """
        try:
            return f"US{uuid.uuid4().hex}"
        except Exception as e:
            logging.error(f"Failed to generate SID: {e}")
            raise e

    @staticmethod
    def validate_sid(sid):
        """
        Validates if the SID follows the format: 'US' followed by 32 hexadecimal characters.
        """
        pattern = r'^US[a-f0-9]{32}$'
        return bool(re.match(pattern, sid))


class Team(models.Model):
    # org_admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admins_team")
    org_admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admins_team")
    team_name = models.CharField(max_length=100, unique=True)
    pending_emails = models.CharField(max_length=500, blank=True, help_text="Comma-separated emails")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
            # Ensure that pending_emails contains valid emails
            if self.pending_emails:
                emails = self.pending_emails.split(',')
                for email in emails:
                    email = email.strip()
                    try:
                        validate_email(email)
                    except ValidationError:
                        raise ValidationError(f"{email} is not a valid email address.")
        
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.team_name

class Credit(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='credits', null=True, blank=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team_credits', null=True, blank=True)
    total_credits = models.IntegerField(default=200)
    used_credits = models.IntegerField(default=0)
    remaining_credits = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.remaining_credits = self.total_credits - self.used_credits
        super().save(*args, **kwargs)

    def __str__(self):
        if self.user:
            return f"Credits for {self.user.email}"
        elif self.team:
            return f"Credits for {self.team.team_name}"
        else:
            return "Unassigned Credits"

class Transaction(models.Model):
    class TransactionType(models.TextChoices):
        ADDITION = 'ADDITION', 'Addition'
        DEDUCTION = 'DEDUCTION', 'Deduction'

    credit = models.ForeignKey(Credit, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} of {self.amount} credits"

class Subscription(models.Model):
    class Duration(models.TextChoices):
        MONTHLY = 'MONTHLY', 'Monthly'
        YEARLY = 'YEARLY', 'Yearly'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions', null=True, blank=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='subscriptions', null=True, blank=True)
    plan_name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    credit_limit = models.IntegerField()
    # features = models.TextField()
    duration = models.CharField(max_length=20, choices=Duration.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.user:
            return f"Subscription for {self.user.email}"
        elif self.team:
            return f"Subscription for {self.team.team_name}"
        else:
            return "Unassigned Subscription"

class Log(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='logs')
    action = models.TextField()
    ip_address = models.GenericIPAddressField()
    timestamp = models.DateTimeField(auto_now_add=True)
    device_info = models.TextField()

    def __str__(self):
        return f"Log for {self.user.email} at {self.timestamp}"

class AITool(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='AItools', null=True, blank=True)
    tool_name = models.CharField(max_length=100)
    api_endpoint = models.URLField()
    credits_required = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    transactions = models.ManyToManyField(Transaction, related_name='ai_tools')

    def __str__(self):
        return self.tool_name

class TeamMember(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} in {self.team.team_name}"
    
class PDFDocument(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pdf_documents')
    file_path = models.CharField(max_length=500, unique=True)
    vector_store_path = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_path



class ToolUsage(models.Model):
    used_at = models.DateField()
    used_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tool_usage')
    tool_name = models.CharField(max_length=500)
    credits_used = models.IntegerField(default=0)
    remaining_credits = models.IntegerField(default=0)
    confidence_score = models.FloatField(blank=True, null=True)  # Storing confidence score as float

    def __str__(self):
        return f"{self.used_by} used {self.credits_used} credits for {self.tool_name} on {self.used_at}"

    class Meta:
        indexes = [
            models.Index(fields=['used_at']),
            models.Index(fields=['used_by']),
        ]
        
class Features(models.Model):
    subscription_name = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name="subscription_features")
    features = models.CharField(max_length=1000, blank=True)
    
    def __str__(self):
        return f"{self.subscription_name.plan_name} - {self.features}"

class ApiCallLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_calls')
    # api_name = models.CharField(max_length=255)
    tool_name = models.CharField(max_length=255, blank=True, null=True)
    credits_used = models.IntegerField(default=0)  # Credits used in the API call
    source = models.CharField(max_length=10)
    timestamp = models.DateTimeField(auto_now_add=True)  # When the API was called

    def __str__(self):
        return f"API call: {self.tool_name} by {self.user.email} via {self.source} on {self.timestamp}"
    
class DocumentProcessing(models.Model):
    tool_name = models.CharField(max_length=255, blank=True, null=True)
    document_type = models.CharField(max_length=255)
    document_side = models.CharField(max_length=10)  # 'front' or 'back'
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2)  # e.g., 95.32 for 95.32%
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Document type detected: {self.document_type} with confidence score: {self.confidence_score}"