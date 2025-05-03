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

    // Process the message and create a reply
    let replyMessage = `Received message from ${sender} on ${app}: ${message}`;
    if (group_name) {
        replyMessage += ` in group ${group_name}`;
    }

    // Send the reply back as JSON
    res.json({ reply: replyMessage });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
