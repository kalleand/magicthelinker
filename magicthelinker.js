'use strict';

const Botkit = require('botkit');
const request = require('request-promise-native');

const slack_token = TOKEN
exports.fn = {
    /**
     * Starts Slack-Bot
     *
     * @returns {*}
     */
    slackBot() {
        // initialisation
        const controller = Botkit.slackbot({
            require_delivery: true
        });
        const slackBot = controller.spawn({
            token: slack_token
        });
        // create rtm connection
        slackBot.startRTM((err, bot, payload) => {
            if (err) {
                throw new Error('Could not connect to Slack');
            }
            controller.log('Slack connection established.');
        });
        var re = /\[\[([^\]]+)\]\]/g;

        controller.hears(['.*\\[\\[[^\\]]+\\]\\].*'],['direct_message','direct_mention','ambient'], function(bot, message) {
            var promises = [];
            var match;
            do {
                match = re.exec(message.text);
                if (match) {
                    promises.push(request('https://api.scryfall.com/cards/named?fuzzy=' + encodeURIComponent(match[1]), { json: true }).then(function(body) {
                        if (body.object && body.object === 'card') {
                            return body.image_uris.normal;
                        }
                    }).catch(function(err) {
                        console.log(err);
                        return "";
                    }));
                }
            } while (match);

            Promise.all(promises).then(function(values) {
                bot.reply(message,values.join(' '));
            });
        });
    }
};
