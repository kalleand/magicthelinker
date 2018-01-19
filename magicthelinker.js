'use strict';

const Botkit = require('botkit');
const request = require('request-promise-native');

exports.fn = {
    /**
     * Starts Slack-Bot
     *
     * @returns {*}
     */
    slackBot() {
        // initialisation
        const controller = Botkit.slackbot({
            stats_optout: true,
            require_delivery: true
        });

        controller.configureSlackApp({
            clientId: process.env.clientId,
            clientSecret: process.env.clientSecret,
            redirectUri: 'ec2-18-218-105-208.us-east-2.compute.amazonaws.com',
            scopes: ['incoming-webhook','team:read','users:read','channels:read','im:read','im:write','groups:read','emoji:read','chat:write:bot']
        });

        controller.setupWebserver(process.env.port,function(err,webserver) {

            // set up web endpoints for oauth, receiving webhooks, etc.
            controller
                .createHomepageEndpoint(controller.webserver)
                .createOauthEndpoints(controller.webserver,function(err,req,res) {
                    if (err) {
                        res.status(500).send('ERROR: ' + err);
                    } else {
                        res.send('Success!');
                    }
                })
                .createWebhookEndpoints(controller.webserver);

        });

        var _bots = {};
        function trackBot(bot) {
            _bots[bot.config.token] = bot;
        }

        controller.startTicking();

        controller.on('create_bot',function(bot,config) {

            if (_bots[bot.config.token]) {
                // already online! do nothing.
            } else {
                bot.startRTM(function(err) {
                    if (!err) {
                        trackBot(bot);
                    }
                });
            }

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
                            var response = {
                                "fallback": body.name,
                                "color": "#acacac",
                                "title": body.name,
                                "image_url": body.image_uris.normal
                            }
                            return response;
                        }
                    }).catch(function(err) {
                        return undefined;
                    }));
                }
            } while (match);

            Promise.all(promises).then(function(values) {
                values = values.filter(function(n){ return n != undefined });
                bot.reply(message, {
                    attachments: values
                });
            });
        });
    }
};
