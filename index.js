/*
 * Load Dependencies
 */

// Load botkit library
const Botkit = require('botkit');
const emojiFromWord = require('emoji-from-word');

// Load the .env file
const dotenv = require('dotenv');
dotenv.load();

/*
 * Configuring Bot
 */

// Create a Botkit controller to communicate with Slack
const controller = Botkit.slackbot({
    debug: false // unclutter the console!
});

// Setup the webserver on specific port
const port = process.env.PORT || 3000;
controller.setupWebserver(port, (err) => {
    if (err) console.log(err);
    console.log(`Magic happens on port ${port}`);
});

// Start Botkit and connect to Slack
controller.spawn({
    // The token we saved to our .env file
    token: process.env.SLACK_API_TOKEN
}).startRTM();

/*
 * Make the bot do stuff
 */

// Returns an object with the data that Slack wants
// for reacting to a message
const createReaction = (message, emoji) => ({
    timestamp: message.ts,
    channel: message.channel,
    name: emoji
});

// Listen to the word "hello" from any channel we are in
controller.hears('hello', ['ambient'], (bot, message) => {
    bot.api.reactions.add(createReaction(message, 'wave'));
});

// Listen to the word "hello" from a direct message
controller.hears('hello', ['direct_message'], (bot, message) => {
    bot.reply(message, 'Hey there!');
});

controller.hears('vote!', ['ambient'], (bot, message) => {
    bot.api.reactions.add(createReaction(message, 'thumbsup'));
    bot.api.reactions.add(createReaction(message, 'thumbsdown'));
});

controller.hears('.+', ['mention', 'direct_mention', 'direct_message'], (bot, message) =>  {
    // Get text from message
    const text = message.text.toLowerCase().trim();

    // split message on [space] character
    const words = text.split(' ');

    // Loop through all the words
    words.forEach((word) => {
        word = word.trim();

        // Try and match the word to an emoji
        const emoji = emojiFromWord(word);

        // If an emoji was found with confidence > 93%
        //  add the emoji as a reaction
        if (emoji.emoji_name && emoji.score > 0.93) {
            bot.api.reactions.add(createReaction(message, emoji.emoji_name));
        }
    });
});
