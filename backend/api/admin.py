from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Organization, DataSource, UploadBatch, RawRecord, EmissionRecord, ReviewAction, AuditLog

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'organization')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('role', 'organization')}),
    )
    list_display = ('username', 'email', 'role', 'organization', 'is_staff')
    list_filter = ('role', 'organization', 'is_staff', 'is_superuser')

admin.site.register(User, CustomUserAdmin)
admin.site.register(Organization)
admin.site.register(DataSource)
admin.site.register(UploadBatch)
admin.site.register(RawRecord)
admin.site.register(EmissionRecord)
admin.site.register(ReviewAction)
admin.site.register(AuditLog)
