var Slack = require('slack-client');
var tutor = require('tutor');
var $ = require('jquery');

var config = require('./config.json');

var token = config.token;

var slack = new Slack(token, true, true);

var last_card = "";

var getCard = function(text) {
  if (text == undefined || text == null) {
    return null;
  }
  var message = text;

  var original_string_pos = message.indexOf("{{");
  if (original_string_pos != -1) {
    var start_pos = message.indexOf("{{") + 2;
    var end_pos = message.indexOf("}}", start_pos);
    var text_to_get = message.substring(start_pos, end_pos);

    if (text_to_get) {
      return text_to_get;
    } else {
      return null;
    }
  }
}

slack.on('open', function() {
  var channels = Object.keys(slack.channels).map(function(k) {
    return slack.channels[k];
  }).filter(function(c) {
    return c.is_member;
  }).map(function(c) {
    return c.name;
  });

  var groups = Object.keys(slack.groups).map(function(k) {
    return slack.groups[k];
  }).filter(function(g) {
    return g.is_open && !g.is_archived;
  }).map(function(g) {
    return g.name
  });

  console.log("Welcome to Slack.");

  if (channels.length > 0) {
    console.log("You are in: " + channels.join(", "));
  } else {
    console.log("You are not in any channels");
  }

  if (groups.length > 0) {
    console.log("As well as: " + groups.join(", "));
  }
});

slack.on("message", function(message) {
  var channel = slack.getChannelGroupOrDMByID(message.channel);

  console.log(channel);

  if (message.type === 'message' && message.text != undefined && message.text != null && channel.name != "general") {
    var cardText = getCard(message.text);
    //console.log(cardText);
    if (cardText != "" && cardText != undefined) {
      try {
        tutor.card({ name: cardText}, function(err, card) {
          if (err) {
            console.error(err);
            return null;
          }
          console.log(last_card);
          last_card = card;
          channel.send(card.image_url);
        });
      } catch (e) {
        console.log("Couldn't find " + cardText);
      }
    } else {
      if (message.text.toLowerCase().indexOf("mtgfetchbot") > -1) {

        if (message.text.toLowerCase().indexOf("help") > -1) {
          channel.send("I currently support the commands for the last card fetched: cmc, converted mana cost, ruling, rulings, legal, and legality");
        }

        if (last_card != null && last_card != undefined && last_card != "") {

          // Converted Mana Cost
          if (message.text.toLowerCase().indexOf("cmc") > -1 || message.text.toLowerCase().indexOf("converted cana cost") > -1) {
            channel.send("CMC of " + last_card.name + " is " + last_card.converted_mana_cost);
          }

          // Rulings
          if (message.text.toLowerCase().indexOf("ruling") > -1 || message.text.toLowerCase().indexOf("rulings") > -1) {
            if (last_card.rulings.length > 0) {
              channel.send("Rulings for " + last_card.name + " are...");
              var tempString = "";
              for (var i = 0; i < last_card.rulings.length; i++) {
                if (tempString == "") {
                  tempString = i + ". " + last_card.rulings[i];
                } else {
                  tempString = tempString + "\n" + i + ". " + last_card.rulings[i];
                }

              }
              channel.send(tempString);
            } else {
              channel.send("No rulings for " + last_card.name);
            }
          }

          // legality
          if (message.text.toLowerCase().indexOf("legal") > -1 || message.text.toLowerCase().indexOf("legality") > -1) {
            var formats = [];
            var legality = [];

            for (var key in last_card.legality) {
              formats.push(key);
              legality.push(last_card.legality[key]);
            }
            console.log(formats);
            console.log(legality);

            if (formats.length > 0) {
              channel.send("The card " + last_card.name + " is legal in the following formats: ");
              var tempString = "";
              for (var i = 0; i < formats.length; i++) {
                if (legality[i] == "Legal") {
                  if (tempString == "") {
                    tempString = formats[i];
                  } else {
                    tempString = tempString + ", " + formats[i];
                  }
                }
              }
              channel.send(tempString);
            }
          }
        }
      }
    }
  }
});

slack.login();
