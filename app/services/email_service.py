import smtplib
from email.message import EmailMessage

from app.core.config import settings


class EmailService:
    def send_email(self, to_email: str, subject: str, body: str) -> None:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        msg.set_content(body)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_STARTTLS:
                server.starttls()

            server.login(
                settings.SMTP_USERNAME,
                settings.SMTP_PASSWORD,
            )

            server.send_message(msg)

    def send_verification_email(self, to_email: str, token: str) -> None:
        verification_link = f"{settings.APP_PUBLIC_URL}/verify-email?token={token}"

        subject = "Verify your email"

        body = f"""
Welcome!

Please verify your email by clicking the link below:

{verification_link}

This link will expire in {settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS} hour(s).
"""

        self.send_email(to_email, subject, body)