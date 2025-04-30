// app.js
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN environment variable is not set.");
    // Cannot proceed without a token
    // In a real serverless function, throwing might be better
    // For this example, we'll just prevent the bot from starting fully
}

let bot;
if (BOT_TOKEN) {
    bot = new Telegraf(BOT_TOKEN);
}

let successCount = 0;
let failureCount = 0;

const possibleTexts = [
    "Hello from the Vercel bot!",
    "This is a random message.",
    "Hope you have a great day!",
    "Just testing the send functionality.",
    "Boop beep boop.",
    "Randomness is key.",
    "Sending sunshine your way!",
];

function generateRandomChatId() {
    // Generates a large integer, potentially positive or negative
    // Note: Most generated IDs will be invalid. This is highly inefficient.
    const min = -1001999999999; // Approximate lower bound for some channel IDs
    const max = 6999999999; // Approximate upper bound for user IDs
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomText() {
    const index = Math.floor(Math.random() * possibleTexts.length);
    return possibleTexts[index];
}

async function sendRandomMessage() {
    if (!bot) {
        console.log("Bot is not initialized due to missing token.");
        return { success: false, chatId: 'N/A', error: 'Bot not initialized' };
    }
    
    const chatId = generateRandomChatId();
    const text = getRandomText();
    let result = { success: false, chatId: chatId, error: null };
    
    try {
        await bot.telegram.sendMessage(chatId, text);
        successCount++;
        result.success = true;
        console.log(`Successfully sent to ${chatId}`);
    } catch (error) {
        failureCount++;
        result.error = error.message || 'Unknown send error';
        console.error(`Failed to send to ${chatId}: ${result.error}`);
    }
    return result;
}

const htmlFilePath = path.join(__dirname, 'index.html');

module.exports = async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    if (url.pathname === '/') {
        try {
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlContent);
        } catch (error) {
            res.writeHead(500);
            res.end('Error loading HTML file.');
            console.error('Error reading index.html:', error);
        }
    } else if (url.pathname === '/stats' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: successCount, failed: failureCount }));
    } else if (url.pathname === '/send' && req.method === 'POST') {
        if (!BOT_TOKEN) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'failed', reason: 'Bot token not configured on server.' }));
            return;
        }
        const result = await sendRandomMessage();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'attempted', result: result }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
};

// No bot.launch() or webhook setup here as it's handled by Vercel serverless trigger
// The bot instance is only used for sending messages via bot.telegram