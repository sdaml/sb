/*
 * Load Dependencies
 */

// Load botkit library
const Botkit = require('botkit');
const emojiFromWord = require('emoji-from-word');

// Load the .env file
const dotenv = require('dotenv');
dotenv.load();

// Ensure we have a Slack api token
if (!process.env.SLACK_API_TOKEN) {
    throw new Error('SLACK_API_TOKEN environment variable is reqiured.');
}


Array.prototype.random_choice = function() {
    return this[Math.floor(Math.random() * this.length)];
};

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

// Listen to the word 'hello' from any channel we are in
controller.hears('hello', ['ambient'], (bot, message) => {
    bot.api.reactions.add(createReaction(message, 'wave'));
});

// Listen to the word 'hello' from a direct message
controller.hears('hello', ['direct_message'], (bot, message) => {
    bot.reply(message, 'Hey there!');
});

controller.hears('vote!', ['ambient'], (bot, message) => {
    bot.api.reactions.add(createReaction(message, 'thumbsup'));
    bot.api.reactions.add(createReaction(message, 'thumbsdown'));
});

controller.hears('(flip a coin|coin flip)', ['ambient'], (bot, message) => {
    const heads_options = [
        'dragon_face',
        'horse',
        'monkey_face',
        'bust_in_silhouette'
    ];

    const tails_options = [
        'snake',
        'flipper',
        'dragon',
        'racehorse',
        'cat2'
    ];

    const emoji = [heads_options.random_choice(), tails_options.random_choice()].random_choice();

    bot.api.reactions.add(createReaction(message, emoji));
});

controller.hears('(flip a coin|coin flip)', ['direct_mention', 'direct_message'], (bot, message) => {

    if ( Math.random() > 0.65 ) {
        // More often than not, just spit out a random value
        bot.replyAndUpdate(message, [
            'Ok!',
            'Flipping..',
            'Hold on..',
            'Sure!'
        ].random_choice(),
            (err, src, updateResponse) => {
                if (err) console.log(err);
                bot.startTyping(message);
                setTimeout(() => {
                    updateResponse(`It's ${ Math.random() >= 0.5 ? 'heads' : 'tails'}!`, (err) => {
                        console.log(err);
                    });
                }, Math.random() * 2000 + 1000);
            }
        );

    } else {
        // Alternatively allow the coin flip to be called before it's revealed
        bot.createConversation(message, (err, convo) => {

            const result = Math.random() >= 0.5 ? 'heads' : 'tails';

            convo.addMessage({
                text: result == 'heads' ? 'It was heads! Nice!' : 'Nope, it was tails.'
            }, 'heads_thread');

            convo.addMessage({
                text: result == 'tails' ? 'Tails it was!' : 'Wrong, it was heads.'
            }, 'tails_thread');

            convo.addMessage({
                text: `Too slow, it was ${result}.`
            }, 'bad_response');

            convo.ask([
                'Call it!',
                'Call it in the air!',
                'What do you think it\'ll be?',
                'What\'s your prediction?'
            ].random_choice(),
                [{
                    pattern: 'heads',
                    callback: function(reply, convo) {
                        convo.gotoThread('heads_thread');
                    }
                },
                {
                    pattern: 'tails',
                    callback: function(reply, convo) {
                        convo.gotoThread('tails_thread');
                    }
                },
                {
                    default: true,
                    callback: function() {
                        // do nothing
                    }
                }
                ]);

            convo.activate();

            // Timeout between 5 and 10 seconds
            setTimeout(() => {
                convo.gotoThread('bad_response');
            }, Math.random() * 5000 + 5000);
        });
    }
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
