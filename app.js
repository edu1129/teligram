const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

app.post('/message', (req, res) => {
    console.log('Request Body:', req.body);

    // Extract data from the request body
    const { app, sender, message, group_name, phone } = req.body;

    // Determine the reply based on the message
    let replyMessage;
    if (message && message.toLowerCase() === 'hello') {
        replyMessage = "Hello, how can I help you?";
    } else {
        replyMessage = "I don't understand.";
    }

    // Send the reply back as JSON
    res.json({ reply: replyMessage });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
