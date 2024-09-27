from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User

class SIDAuthentication(BaseAuthentication):
    """
    Custom authentication class to authenticate requests based on the SID (API key).
    """
    
    def authenticate(self, request):
        # Get the SID from the 'Authorization' header
        auth_header = request.headers.get('AuthSID')
        
        if not auth_header or not auth_header.startswith('SID '):
            return None  # No SID, so no authentication
        
        # Extract the SID from the header
        sid = auth_header.split(' ')[1]
        
        # Try to find a user with this SID
        try:
            user = User.objects.get(sid=sid)
        except User.DoesNotExist:
            raise AuthenticationFailed('Invalid SID. No user found.')

        return (user, None)
