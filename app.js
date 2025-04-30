// app.js
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("FATAL ERROR: BOT_TOKEN environment variable is not set.");
}

let bot;
if (BOT_TOKEN) {
    bot = new Telegraf(BOT_TOKEN);
}

// In-memory counters (will reset on cold starts)
let successCount = 0;
let failureCount = 0;

const gandhijiInfo = `Mohandas Karamchand Gandhi, commonly known as Mahatma Gandhi, was an Indian lawyer, anti-colonial nationalist, and political ethicist, who employed nonviolent resistance to lead the successful campaign for India's independence from British rule, and in turn, inspired movements for civil rights and freedom across the world.`;

function generateRandomChatId() {
    const min = -1001999999999;
    const max = 6999999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function attemptGandhijiMessageSend() {
    if (!bot) {
        console.log("Bot is not initialized due to missing token.");
        failureCount++; // Count as failure if bot cannot operate
        return { success: false, chatId: 'N/A', error: 'Bot not initialized (Missing Token)' };
    }
    
    const chatId = generateRandomChatId();
    const text = gandhijiInfo;
    let result = { success: false, chatId: chatId, error: null };
    
    try {
        // Attempt to send the message
        await bot.telegram.sendMessage(chatId, text);
        successCount++;
        result.success = true;
        console.log(`Successfully sent Gandhiji info to ${chatId}`);
    } catch (error) {
        failureCount++;
        // Simplify error logging for potentially very common errors
        if (error.response && error.response.error_code === 400 && error.response.description.includes('chat not found')) {
            result.error = 'Chat not found';
            console.error(`Failed to send to ${chatId}: Chat not found`);
        } else if (error.response && error.response.error_code === 403 && error.response.description.includes('bot was blocked by the user')) {
            result.error = 'Bot blocked by user';
            console.error(`Failed to send to ${chatId}: Bot blocked`);
        }
        else {
            result.error = error.message || 'Unknown send error';
            console.error(`Failed to send to ${chatId}: ${result.error}`);
        }
    }
    return result;
}

const htmlFilePath = path.join(__dirname, 'index.html');

module.exports = async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Route to serve the HTML stats page
    if (url.pathname === '/' && req.method === 'GET') {
        try {
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlContent);
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error loading HTML file.');
            console.error('Error reading index.html:', error);
        }
    }
    // Route to provide stats data
    else if (url.pathname === '/stats' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: successCount, failed: failureCount }));
    }
    // Route to trigger a send attempt (could be called by a cron job)
    else if (url.pathname === '/send' && req.method === 'GET') { // Changed to GET for easier browser testing/cron
        const result = await attemptGandhijiMessageSend();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Send Attempted', result: result }));
    }
    // Catch-all for other paths
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
};