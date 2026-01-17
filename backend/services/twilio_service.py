import os
from twilio.rest import Client
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class TwilioService:
    """Service for sending SMS notifications via Twilio"""
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.admin_number = os.getenv("ADMIN_PHONE_NUMBER")
        
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
            self.enabled = True
        else:
            logger.warning("Twilio credentials not configured. SMS alerts disabled.")
            self.enabled = False
    
    async def send_offline_alert(self, post_id: int, location: str) -> Optional[str]:
        """
        Send SMS alert when network failure detected during post upload
        
        Args:
            post_id: ID of the pending post
            location: Location of the hazard report
            
        Returns:
            Message SID if successful, None otherwise
        """
        if not self.enabled:
            logger.warning("Twilio not enabled. Skipping SMS alert.")
            return None
        
        try:
            message_body = (
                f"🌊 Ocean Hazard Alert\n\n"
                f"Network issue detected.\n"
                f"New hazard post #{post_id} pending sync.\n"
                f"Location: {location}\n\n"
                f"Post will auto-sync when network is restored."
            )
            
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=self.admin_number
            )
            
            logger.info(f"SMS alert sent successfully. SID: {message.sid}")
            return message.sid
            
        except Exception as e:
            logger.error(f"Failed to send SMS alert: {str(e)}")
            return None
    
    async def send_validation_alert(self, post_id: int, status: str, reason: str = None) -> Optional[str]:
        """
        Send SMS alert about validation status
        
        Args:
            post_id: ID of the post
            status: Validation status (verified, rejected)
            reason: Reason for rejection (if applicable)
            
        Returns:
            Message SID if successful, None otherwise
        """
        if not self.enabled:
            return None
        
        try:
            if status == "verified":
                message_body = (
                    f"✅ Post #{post_id} verified\n"
                    f"AI and INCOIS validation successful.\n"
                    f"Now visible on public dashboard."
                )
            else:
                message_body = (
                    f"❌ Post #{post_id} rejected\n"
                    f"Reason: {reason or 'Not ocean hazard related'}"
                )
            
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=self.admin_number
            )
            
            logger.info(f"Validation alert sent. SID: {message.sid}")
            return message.sid
            
        except Exception as e:
            logger.error(f"Failed to send validation alert: {str(e)}")
            return None
    
    async def send_custom_alert(self, message_body: str, to_number: str = None) -> Optional[str]:
        """
        Send custom SMS alert
        
        Args:
            message_body: Message content
            to_number: Recipient number (defaults to admin)
            
        Returns:
            Message SID if successful, None otherwise
        """
        if not self.enabled:
            return None
        
        try:
            recipient = to_number or self.admin_number
            
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=recipient
            )
            
            logger.info(f"Custom alert sent to {recipient}. SID: {message.sid}")
            return message.sid
            
        except Exception as e:
            logger.error(f"Failed to send custom alert: {str(e)}")
            return None


# Singleton instance
twilio_service = TwilioService()
