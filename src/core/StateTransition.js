/*global
 Phaser: true
 window: true
 */

(function() {
    "use strict";

    var DefaultTransition = require('../transition/DefaultTransition');

    /**
     * Phaser State Plugin Class
     * @constructor
     * @version 0.1.0
     * @author Cristian Bote <me@cristianbote.ro>
     * @param {object} game Phaser.Game instance
     * @param {object} parent Parent element
     * @extend {Phaser.Plugin}
     * @example: <caption>Usage</caption>
     * var plugin = this.game.plugins.add(Phaser.Pluging.StateTransition);
     */
    function StateTransition(game, parent) {
        Phaser.Plugin.call(this, game, parent);
    }

    StateTransition.prototype = Object.create(Phaser.Plugin.prototype);
    StateTransition.constructor = StateTransition;

    /**
     * Create custom transition
     * @param {object} options Transition object
     * @param {boolean} [options.intro] Is this a introduction transition
     * @param {object|function} options.props Properties to transition to
     */
    StateTransition.createTransition = function(options) {
        return DefaultTransition(options);
    };

    /**
     * Intro transition list
     * @type {object}
     */
    StateTransition.In = {

        SlideLeft: DefaultTransition({
            intro: true,
            props: {
                x: function(game) {
                    return game.width
                }
            }
        }),

        SlideRight: DefaultTransition({
            intro: true,
            props: {
                x: function(game) {
                    return -game.width
                }
            }
        }),

        SlideTop: DefaultTransition({
            intro: true,
            props: {
                y: function(game) {
                    return game.height
                }
            }
        }),

        SlideBottom: DefaultTransition({
            intro: true,
            props: {
                y: function(game) {
                    return -game.height
                }
            }
        }),

        ScaleUp: DefaultTransition({
            intro: true,
            props: {
                alpha: 0.4,
                scale: new Phaser.Point({
                    x: 2
                })
            }
        })
    };

    /**
     * Exit transition list
     * @type {object}
     */
    StateTransition.Out = {

        SlideLeft: DefaultTransition({
            props: {
                x: function(game) {
                    return -game.width
                }
            }
        }),

        SlideRight: DefaultTransition({
            props: {
                x: function(game) {
                    return game.width
                }
            }
        }),

        SlideTop: DefaultTransition({
            props: {
                y: function(game) {
                    return -game.height
                }
            }
        }),

        SlideBottom: DefaultTransition({
            props: function(game) {
                return {
                    y: game.height
                }
            }
        }),

        ScaleUp: DefaultTransition({
            props: {
                x: function(game) {
                    return game.width / 2
                },
                scale: {
                    x: 0
                }
            }
        })
    };

    module.exports = StateTransition;
}());
