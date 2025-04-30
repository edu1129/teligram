// app.js
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const VERCEL_URL = process.env.VERCEL_URL;

if (!BOT_TOKEN) {
  console.error("FATAL ERROR: BOT_TOKEN environment variable is not set.");
  process.exit(1); // Exit if the token is missing
}

const bot = new Telegraf(BOT_TOKEN);

// Middleware for logging
bot.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log('Update Type: %s | Response time: %sms', ctx.updateType, ms);
  if (ctx.from) {
    console.log(`From: ${ctx.from.id} (${ctx.from.username || 'no_username'})`);
  }
  if (ctx.message && ctx.message.text) {
      console.log(`Message Text: "${ctx.message.text}"`)
  } else if (ctx.callbackQuery && ctx.callbackQuery.data) {
      console.log(`Callback Query Data: "${ctx.callbackQuery.data}"`)
  } else if (ctx.inlineQuery && ctx.inlineQuery.query !== undefined) {
       console.log(`Inline Query: "${ctx.inlineQuery.query}"`)
  }
});

// /start command
bot.start((ctx) => {
  const welcomeMessage = `Hello ${ctx.from.first_name}! 👋\nI am your advanced Telegram bot running on Vercel.\nUse /help to see what I can do.`;
  ctx.reply(welcomeMessage);
});

// /help command
bot.help((ctx) => {
  const helpMessage = `Here's a list of commands and features:
/start - Start interacting with the bot
/help - Show this help message
/features - Explore interactive features
/echo <your text> - I'll repeat your text
/about - Information about me
Inline Mode: Type @${ctx.botInfo.username} <query> in any chat.`;
  ctx.reply(helpMessage);
});

// /echo command
bot.command('echo', (ctx) => {
  const textToEcho = ctx.message.text.slice('/echo'.length).trim();
  if (textToEcho) {
    ctx.reply(`Echoing back: ${textToEcho}`);
  } else {
    ctx.reply('Please provide some text after /echo, like `/echo Hello World!`');
  }
});

// /about command
bot.command('about', (ctx) => {
    const aboutMessage = `🤖 Bot Info:\nUsername: @${ctx.botInfo.username}\nID: ${ctx.botInfo.id}\n\nPowered by Telegraf and running seamlessly on Vercel!`;
    ctx.reply(aboutMessage);
});


// /features command with inline keyboard
bot.command('features', (ctx) => {
  ctx.reply('Explore these features:', Markup.inlineKeyboard([
    [Markup.button.callback('🚀 Show Help Again', 'show_help_feature')],
    [Markup.button.callback('💡 Inline Mode Tips', 'inline_mode_info')],
    [Markup.button.url('🌐 Visit Vercel', 'https://vercel.com')]
  ]));
});

// Handling callback query for 'show_help_feature' button
bot.action('show_help_feature', async (ctx) => {
  await ctx.answerCbQuery('Fetching help...'); // Show loading feedback
  const helpMessage = `Here's a list of commands and features:
/start - Start interacting with the bot
/help - Show this help message
/features - Explore interactive features
/echo <your text> - I'll repeat your text
/about - Information about me
Inline Mode: Type @${ctx.botInfo.username} <query> in any chat.`;
  // Edit the original message or send a new one
  try {
      await ctx.editMessageText(helpMessage, Markup.inlineKeyboard([])); // Edit and remove keyboard
  } catch (e) {
      console.warn("Couldn't edit message, maybe it's too old. Sending new one.", e.message);
      await ctx.reply(helpMessage); // Fallback to sending a new message
  }
});

// Handling callback query for 'inline_mode_info' button
bot.action('inline_mode_info', async (ctx) => {
  await ctx.answerCbQuery('Explaining inline mode...');
  const inlineInfo = `To use inline mode:\n1. Go to any chat (even with yourself).\n2. Type '@${ctx.botInfo.username}' followed by a space and your text (e.g., '@${ctx.botInfo.username} hello there').\n3. Wait for the results panel to appear.\n4. Tap a result to send it.`;
  try {
    await ctx.editMessageText(inlineInfo, Markup.inlineKeyboard([]));
  } catch (e) {
      console.warn("Couldn't edit message. Sending new one.", e.message);
      await ctx.reply(inlineInfo);
  }
});

// Handling simple text messages (that are not commands)
bot.on('text', (ctx) => {
    // Avoid processing if it looks like a command that wasn't handled
    if (ctx.message.text.startsWith('/')) {
        ctx.reply("Sorry, I don't recognize that command. Try /help.");
        return;
    }
    // Respond to general text
    ctx.reply(`Got your message: "${ctx.message.text}". Use /help to see commands.`);
});


// Handling inline queries
bot.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query || '';
  console.log(`Processing inline query: "${query}"`);
  let results = [];

  if (query.length > 0) {
    // Example 1: Echo the query
    results.push({
      type: 'article',
      id: 'echo-' + Date.now(),
      title: `Echo: ${query}`,
      input_message_content: {
        message_text: `*Inline Echo:*\n${query}`,
        parse_mode: 'Markdown'
      },
      description: 'Sends the text you typed back.',
      thumb_url: 'https://cdn-icons-png.flaticon.com/128/138/138993.png' // Example icon
    });

    // Example 2: Bold the query
    results.push({
        type: 'article',
        id: 'bold-' + Date.now(),
        title: `Bold: ${query}`,
        input_message_content: {
            message_text: `*${query}*`,
            parse_mode: 'Markdown'
        },
        description: 'Sends the text in bold.',
        thumb_url: 'https://cdn-icons-png.flaticon.com/128/59/59708.png' // Example icon
    });

  } else {
     // Suggest something if query is empty
     results.push({
       type: 'article',
       id: 'help-tip',
       title: 'Type something to get results',
       input_message_content: {
         message_text: `Use inline mode by typing @${ctx.botInfo.username} <your text>`
       },
       description: 'Example: echo, bold text...'
     });
  }

  try {
    // Cache results for a short time (e.g., 10 seconds)
    await ctx.answerInlineQuery(results, { cache_time: 10 });
  } catch (error) {
    console.error('Failed to answer inline query:', error);
  }
});

// Generic Error Handling
bot.catch((err, ctx) => {
  console.error(`Error encountered for update ${ctx.updateType}:`, err);
  // Attempt to inform the user about the error, but catch potential failures
  ctx.reply('Oops! Something went wrong. Please try again later.').catch(e => {
      console.error("Failed to send error message to user:", e);
  });
});


// --- Vercel Webhook Setup ---

const setupWebhook = async () => {
    if (!VERCEL_URL) {
        console.warn("VERCEL_URL is not set. Skipping webhook setup. Bot will not work on Vercel without it.");
        return false;
    }
    // Adjust '/api/bot' if your file path is different within the /api directory
    const webhookUrl = `https://${VERCEL_URL}/api/bot`;
    try {
        const currentWebhook = await bot.telegram.getWebhookInfo();
        if (currentWebhook.url !== webhookUrl) {
            await bot.telegram.deleteWebhook({ drop_pending_updates: true }); // Clear old webhook first
            await bot.telegram.setWebhook(webhookUrl, {
               allowed_updates: ["message", "inline_query", "callback_query"] // Specify needed updates
            });
            console.log(`Webhook successfully set to ${webhookUrl}`);
        } else {
            console.log(`Webhook already configured at ${webhookUrl}.`);
        }
        return true;
    } catch (error) {
        console.error('Error setting up webhook:', error.message);
        return false;
    }
};

// Flag to ensure webhook setup runs only once per instance lifecycle
let webhookSetupComplete = false;

const handler = async (req, res) => {
    if (!webhookSetupComplete) {
        // Attempt webhook setup on the first request this instance handles
        const success = await setupWebhook();
        webhookSetupComplete = true; // Mark as attempted even if failed, to avoid retrying every request
        if (!success && !process.env.NODE_ENV !== 'production') { // Only critical if VERCEL_URL was expected
             console.error("Webhook setup failed. Bot may not function correctly on Vercel.");
             // Optionally, return an error immediately if webhook is essential
             // res.status(500).send("Webhook setup failed."); return;
        }
    }

    try {
        if (req.method === 'POST') {
            // Telegraf handles the response automatically when processing the update
            await bot.handleUpdate(req.body, res);
        } else {
            // Handle GET requests (e.g., for health checks or simple confirmation)
            res.setHeader('Content-Type', 'application/json');
            const healthStatus = {
                 status: "UP",
                 message: "Bot is running.",
                 webhook_setup_attempted: webhookSetupComplete,
                 timestamp: new Date().toISOString()
            };
             try {
                 const webhookInfo = await bot.telegram.getWebhookInfo();
                 healthStatus.webhook_info = webhookInfo;
             } catch (e) {
                 healthStatus.webhook_info = "Error fetching webhook info: " + e.message;
             }
            res.status(200).json(healthStatus);
        }
    } catch (error) {
        console.error('Error in Vercel handler:', error);
        // Ensure a response is sent even if errors occur late
        if (!res.headersSent) {
           res.status(500).send('Internal Server Error processing request.');
        }
    }
};

module.exports = handler;

// Optional: Local development setup (uncomment ONLY for local testing, not for Vercel)
/*
if (process.env.NODE_ENV !== 'production') {
    console.log("Starting bot locally using polling...");
    // Use deleteWebhook() during development to avoid conflicts with Vercel webhook
    bot.telegram.deleteWebhook({ drop_pending_updates: true }).then(() => {
        console.log("Webhook deleted for local polling.");
        bot.launch()
            .then(() => console.log('Bot started locally via polling'))
            .catch((err) => console.error('Error starting bot locally:', err));
    }).catch(err => console.error("Error deleting webhook for local dev:", err));

    // Graceful shutdown
    process.once('SIGINT', () => { console.log("SIGINT received, stopping bot..."); bot.stop('SIGINT')});
    process.once('SIGTERM', () => { console.log("SIGTERM received, stopping bot..."); bot.stop('SIGTERM')});
}
*/
