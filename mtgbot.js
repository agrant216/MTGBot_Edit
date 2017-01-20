var tutor = require('tutor');
var $ = require('jquery');
var Botkit = require('botkit');

var controller = Botkit.slackbot({debug: true});

var bot = controller
    .spawn({token: process.env.token})
    .startRTM();

var last_card = '';

controller.hears(['{{(.*)}}'], 'direnct_mention,mention,ambient', function (bot, message) {
    var cardText = message.match1[1];
    bot
        .api
        .reactions
        .add({timestamp: message.ts, channel: message.channel});

    if (cardText != "" && cardText != undefined) {
        console.log(cardText);
        try {
            tutor
                .card({
                    name: cardText
                }, function (err, card) {
                    if (err) {
                        console.error(err);
                        return null;
                    }
                    console.log(last_card);
                    last_card = card;
                    bot.replay(message, card.image_url);
                });
        } catch (e) {
            console.log("Couldn't find " + cardText);
        }
    }

});