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
let globalSuccessCount = 0;
let globalFailureCount = 0;

const gandhijiInfo = `Mahatma Gandhi, born Mohandas Karamchand Gandhi, was a leader of India's independence movement against British rule. He employed nonviolent civil disobedience and inspired movements for civil rights and freedom across the world.`;

function generateRandomChatId() {
    const min = -1001999999999; // Approx lower bound for channel IDs
    const max = 6999999999; // Approx upper bound for user IDs
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function attemptSingleSend() {
    if (!bot) {
        console.log("Bot not initialized.");
        globalFailureCount++; // Count as failure if bot cannot operate
        return { success: false, chatId: 'N/A', error: 'Bot not initialized (Missing Token)' };
    }
    
    const chatId = generateRandomChatId();
    const text = gandhijiInfo;
    let result = { success: false, chatId: chatId, error: null };
    
    try {
        await bot.telegram.sendMessage(chatId, text);
        result.success = true;
        globalSuccessCount++; // Increment global counter on success
        console.log(`Success: Sent to ${chatId}`);
    } catch (error) {
        result.error = error.description || error.message || 'Unknown send error';
        globalFailureCount++; // Increment global counter on failure
        console.error(`Failed: Send to ${chatId} (${result.error})`);
    }
    return result; // Return result of this specific attempt
}

const htmlFilePath = path.join(__dirname, 'index.html');

module.exports = async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Route to serve the HTML page
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
    // Route to provide current stats data
    else if (url.pathname === '/stats' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: globalSuccessCount, failed: globalFailureCount }));
    }
    // Route called by frontend to trigger ONE send attempt
    else if (url.pathname === '/send' && req.method === 'POST') { // Use POST for action
        const result = await attemptSingleSend(); // Attempt one send and update global counts
        res.writeHead(200, { 'Content-Type': 'application/json' });
        // Send back the result of *this* specific attempt
        res.end(JSON.stringify({ status: 'attempted', result: result }));
    }
    // Catch-all for other paths
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
};