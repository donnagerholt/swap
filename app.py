"""
The Swap Club — Flask app.

Routes for every page, plus backend logic for the contact form
(/contact) and the footer newsletter signup (/newsletter).

Email is sent with Python's built-in smtplib, so no extra package is
required beyond Flask itself. All SMTP credentials and the destination
address are read from environment variables — see .env.example for the
full list and README.md for setup instructions.
"""

import os
import re
import smtplib
from email.mime.text import MIMEText
from typing import Optional

from flask import Flask, flash, redirect, render_template, request, url_for

app = Flask(__name__)

# SECRET_KEY is required for flash() messages to work (they're stored in a
# signed session cookie). Set a real, random value via the SECRET_KEY
# environment variable in production — this fallback is for local dev only.
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-secret-change-me")

# ── Email configuration (all read from environment variables) ──
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
# Where contact-form submissions and newsletter signups are delivered.
CONTACT_TO_EMAIL = os.environ.get("CONTACT_TO_EMAIL", "info@theswapclub.nl")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def send_email(subject: str, body: str, reply_to: Optional[str] = None) -> bool:
    """Send a plain-text email via SMTP. Returns True on success.

    If SMTP_USERNAME / SMTP_PASSWORD aren't configured, this logs to the
    console instead of failing outright, so the site still runs locally
    without mail credentials.
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        app.logger.warning(
            "SMTP not configured (SMTP_USERNAME/SMTP_PASSWORD missing) — "
            "email NOT sent. Would have sent:\nSubject: %s\n%s",
            subject, body,
        )
        return False

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = SMTP_USERNAME
    msg["To"] = CONTACT_TO_EMAIL
    if reply_to:
        msg["Reply-To"] = reply_to

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, [CONTACT_TO_EMAIL], msg.as_string())
        return True
    except smtplib.SMTPException:
        app.logger.exception("Failed to send email")
        return False


# ───────────────────────── Page routes ─────────────────────────

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/events")
def events():
    return render_template("events.html")


@app.route("/how")
def how():
    return render_template("how.html")


@app.route("/membership")
def membership():
    return render_template("membership.html")


@app.route("/business")
def business():
    return render_template("business.html")


@app.route("/business-no-form")
def business_no_form():
    """Alternative version of the business page: shows the contact
    email/socials instead of the submission form."""
    return render_template("business_no_form.html")


@app.route("/contact", methods=["GET", "POST"])
def contact():
    form_data = {
        "name": "",
        "email": "",
        "topic": "general",
        "message": "",
    }

    if request.method == "POST":
        form_data = {
            "name": request.form.get("name", "").strip(),
            "email": request.form.get("email", "").strip(),
            "topic": request.form.get("topic", "general").strip(),
            "message": request.form.get("message", "").strip(),
        }

        topic_labels = {
            "general": "General question",
            "collaboration": "Collaboration idea",
            "feedback": "Site feedback",
            "business": "Business inquiry",
        }

        errors = []
        if not form_data["name"]:
            errors.append("Please enter your name.")
        if not EMAIL_RE.match(form_data["email"]):
            errors.append("Please enter a valid email address.")
        if form_data["topic"] not in topic_labels:
            errors.append("Please choose a valid topic.")
        if not form_data["message"]:
            errors.append("Please write a message.")

        if errors:
            for error in errors:
                flash(error, "error")
            return render_template("contact.html", form_data=form_data)

        subject = f"Website contact: {topic_labels[form_data['topic']]}"
        body = (
            f"Name: {form_data['name']}\n"
            f"Email: {form_data['email']}\n"
            f"Topic: {topic_labels[form_data['topic']]}\n\n"
            f"Message:\n{form_data['message']}"
        )

        if send_email(subject, body, reply_to=form_data["email"]):
            flash("Thanks, your message has been sent. We'll get back to you soon.", "success")
            return redirect(url_for("contact"))

        flash(
            "We couldn't send your message right now. Please email info@theswapclub.nl directly.",
            "error",
        )

    return render_template("contact.html", form_data=form_data)


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/community")
def community():
    return render_template("community.html")


@app.route("/privacy")
def privacy():
    return render_template("privacy.html")


@app.route("/terms")
def terms():
    return render_template("terms.html")


if __name__ == "__main__":
    # Allow the port to be configured via the PORT environment variable
    # (useful when port 5000 is reserved by macOS services). Default to 5001
    # for local development to avoid conflicts.
    port = int(os.environ.get("PORT", "5001"))
    app.run(debug=True, port=port)
