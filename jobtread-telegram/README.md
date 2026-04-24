# Citystone JobTread Telegram Bot

A Telegram bot that lets you query your JobTread jobs from any Telegram chat.

## Commands

| Command | Description |
|---------|-------------|
| `/jobs` | List recent jobs |
| `/search [term]` | Search jobs by name |
| `/customers` | List all customers |
| `/help` | Show help |

## Setup

### Step 1 — Create your Telegram bot
1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Give it a name: `Citystone Jobs`
4. Give it a username: `CitystoneJobsBot` (must end in "bot")
5. BotFather gives you a **token** — copy it

### Step 2 — Deploy to Railway
1. Push this folder to a GitHub repo
2. In Railway → New Project → GitHub Repository → select the repo
3. Add environment variables:
   - `TELEGRAM_BOT_TOKEN` = your token from BotFather
   - `JOBTREAD_GRANT_KEY` = your JobTread grant key
4. Deploy

### Step 3 — Use it
- Open Telegram, find your bot by username
- Send `/start` to begin
- Share the bot with your crew so they can use it too!

## Notes
- The bot works in private chats AND group chats
- Multiple crew members can use it at the same time
- No login required — anyone with the bot link can use it
