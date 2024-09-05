from django.contrib import admin
from .models import User, Team,  Credit, Transaction, Subscription, Log, AITool

# Register your models here.
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

class UserModelAdmin(BaseUserAdmin):
  # The fields to be used in displaying the User model.
  # These override the definitions on the base UserModelAdmin
  # that reference specific fields on auth.User.
  list_display = ('id', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'team', 'is_admin', 'is_active')
  list_filter = ('is_admin','is_active')
  fieldsets = (
      ('User Credentials', {'fields': ('email', 'password')}),
      ('Personal info', {'fields': ('first_name',)}),
      ('Personal info', {'fields': ('last_name',)}),
      ('Personal info', {'fields': ('phone_number',)}),
      ('Personal info', {'fields': ('role',)}),
      ('Permissions', {'fields': ('is_admin',)}),
      ('Permissions', {'fields': ('is_active',)}),
  )
  # add_fieldsets is not a standard ModelAdmin attribute. UserModelAdmin
  # overrides get_fieldsets to use this attribute when creating a user.
  add_fieldsets = (
      (None, {
          'classes': ('wide',),
          'fields': ('email', 'first_name', 'last_name', 'phone_number', 'role', 'password', 'password2', 'team'),
      }),
  )
  search_fields = ('email',)
  ordering = ('id', 'email')
  filter_horizontal = ()

admin.site.register(User, UserModelAdmin)
admin.site.register(Team)
admin.site.register(Credit)
admin.site.register(Transaction)
admin.site.register(Subscription)
admin.site.register(Log)
admin.site.register(AITool)