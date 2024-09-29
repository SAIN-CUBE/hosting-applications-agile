from django.contrib import admin
from .models import User, Team,  Credit, Transaction, Subscription, Log, AITool, TeamMember, ToolUsage, ApiCallLog, Features, DocumentProcessing

# Register your models here.
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

class UserModelAdmin(BaseUserAdmin):
  # The fields to be used in displaying the User model.
  # These override the definitions on the base UserModelAdmin
  # that reference specific fields on auth.User.
  list_display = ('id','sid', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'team', 'is_admin')
  list_filter = ('is_admin',)
  fieldsets = (
      ('Personal info', {'fields': ('sid',)}),
      ('User Credentials', {'fields': ('email', 'password')}),
      ('Personal info', {'fields': ('first_name',)}),
      ('Personal info', {'fields': ('last_name',)}),
      ('Personal info', {'fields': ('phone_number',)}),
      ('Personal info', {'fields': ('role',)}),
      ('Personal info', {'fields': ('team',)}),
      ('Permissions', {'fields': ('is_admin',)}),
      ('Permissions', {'fields': ('is_active',)}),
  )
  # add_fieldsets is not a standard ModelAdmin attribute. UserModelAdmin
  # overrides get_fieldsets to use this attribute when creating a user.
  add_fieldsets = (
      (None, {
          'classes': ('wide',),
          'fields': ('email', 'first_name', 'last_name', 'phone_number', 'role', 'team', 'password', 'password2'),
      }),
  )
  search_fields = ('email',)
  ordering = ('email', 'id')
  filter_horizontal = ()

admin.site.register(User, UserModelAdmin)
admin.site.register(Team)
admin.site.register(TeamMember)
admin.site.register(Credit)
admin.site.register(Transaction)
admin.site.register(Subscription)
admin.site.register(Log)
admin.site.register(AITool)
admin.site.register(ToolUsage)
admin.site.register(ApiCallLog)
admin.site.register(Features)
admin.site.register(DocumentProcessing)