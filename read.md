# Telegram Photo Bot

This project consists of a simple web page that attempts to access the user's camera and send a captured photo to a specified Telegram chat via a bot.

## Features

- Web page captures photo from user's camera.
- Sends photo as a Base64 encoded JPEG to the backend.
- Backend (Node.js/Express) receives the photo.
- Backend sends the photo to a configured Telegram chat ID using `node-telegram-bot-api`.
- Includes a basic Telegram webhook endpoint to help users find their chat ID.

## Setup

1.  **Get a Telegram Bot Token:** Talk to the `@BotFather` on Telegram and create a new bot. You will receive an API token.
2.  **Get your Telegram Chat ID:** Start a conversation with your new bot. You can find your chat ID by sending a message to the bot and checking the logs when running locally, or by setting up the webhook and sending a message (the bot is configured to reply with the chat ID if you message it).
3.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd telegram-photo-bot
    ```
4.  **Install dependencies:**
    ```bash
    npm install
    ```

## Environment Variables

This project requires the following environment variables:

-   `BOT_TOKEN`: Your Telegram bot's API token.
-   `YOUR_CHAT_ID`: The Telegram chat ID where you want to receive the photos.

Set these variables in your environment or in a `.env` file (if using a library like `dotenv`, though not included by default).

## Running Locally

1.  Set the environment variables (`BOT_TOKEN`, `YOUR_CHAT_ID`).
2.  Start the server:
    ```bash
    npm start
    ```
3.  Open your web browser and go to `http://localhost:3000` (or the port your app runs on).

## Deployment (Vercel)

This project includes a `vercel.json` file for easy deployment to Vercel.

1.  Link your project to Vercel.
2.  Add the `BOT_TOKEN` and `YOUR_CHAT_ID` environment variables in your Vercel project settings.
3.  Deploy the project.
4.  (Optional but Recommended) Set up a webhook for your Telegram bot to receive messages. The webhook URL would be `YOUR_VERCEL_APP_URL/api/webhook`. You can use the BotFather command `/setwebhook`.

## Notes

-   The `index.html` file requests camera access from the user's browser.
-   The photo capture interval in `index.html` is set to 1 second (`setInterval(captureAndSend, 1000)`). This is very frequent and might be annoying or resource-intensive. Consider increasing this value (e.g., to 10000 for 10 seconds) or changing the trigger mechanism.
-   Camera access requires HTTPS in most modern browsers for production environments.
