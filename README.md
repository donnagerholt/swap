# The Swap Club — Website

A Flask site for The Swap Club.

## Running locally

```bash
pip install -r requirements.txt
cp .env.example .env      # then fill in real values
export $(cat .env | xargs) # or use python-dotenv / your platform's env-var settings
python app.py
```

Visit http://127.0.0.1:5000

## Contact form & newsletter — what you need to configure

The contact form (`/business` page) and the footer newsletter signup both
POST to routes in `app.py`, which validate the input and send an email via
SMTP using Python's built-in `smtplib` (no extra email package required).

You must set these environment variables on your server (see
`.env.example`):

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Signs the session cookie so success/error messages work. Set a long random string. |
| `SMTP_HOST` / `SMTP_PORT` | Your outgoing mail server, e.g. `smtp.gmail.com` / `587`. |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | The mailbox that sends the emails. For Gmail, use an **App Password**, not your normal password. |
| `CONTACT_TO_EMAIL` | The Swap Club inbox that should receive submissions (defaults to `info@theswapclub.nl`). |

If `SMTP_USERNAME`/`SMTP_PASSWORD` aren't set, the app won't crash — it
just logs the message to the console instead of emailing it, so you can
develop locally without real credentials.

## Luma page

"Ticket" and "Membership" buttons across the site link to
`https://luma.com/theswapclub` (this URL was already present and used
consistently in the original code, so it was kept as-is rather than
replaced with a placeholder). If that isn't the club's real Luma URL,
search-and-replace `https://luma.com/theswapclub` across the `templates/`
folder.

## Project structure

```
app.py                  Flask routes + contact/newsletter backend
templates/
  base.html              Shared layout: nav, footer, flash messages
  home.html, how.html, membership.html, business.html,
  community.html, events.html, about.html, privacy.html, terms.html
static/
  css/base.css            Shared tokens (plum & matcha palette), resets,
                           nav/footer/buttons, and components used on 2+ pages
  css/<page>.css          Page-specific styles only
  js/base.js
  images/
```



echo "# swapclub" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/donnagerholt/swapclub.git
git push -u origin main
