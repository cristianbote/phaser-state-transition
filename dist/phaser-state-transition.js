(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
    "use strict";

    var PHASER_LEGACY = '2.4.8';

    /**
     * Content Snapshot Class
     * @constructor
     * @name ContentSnapshot
     * @param {object} game Game object instance
     * @param {number} x Offset of x
     * @param {number} y Offset of y
     * @extend Phaser.Image
     */
    function ContentSnapshot(game, x, y) {
        // Create the game background fill
        this._graphicFill = new Phaser.Graphics(game, 0, 0);
        this._graphicFill.beginFill(game.stage.backgroundColor);
        this._graphicFill.drawRect(0, 0, game.width, game.height);
        this._graphicFill.endFill();

        // Add the graphicFill object temporary to the stage at the base
        game.stage.addChildAt(this._graphicFill, 0);

        // Create the game texture
        this._texture = new Phaser.RenderTexture(game, game.width, game.height);
        this._texture.renderXY(this._graphicFill, 0, 0);

        // After this is rendered to the texture, remove it
        game.stage.removeChild(this._graphicFill);

        // After 2.4.8 (0,0) it's basically middle
        if (Phaser.VERSION > PHASER_LEGACY) {
            this._texture.renderXY(game.world, game.camera.position.x * -1, game.camera.position.y * -1);
        } else {
            this._texture.renderXY(game.world, game.width / 2 - game.camera.position.x, game.height / 2 - game.camera.position.y);
        }

        // Get the image
        Phaser.Image.call(this, game, x || 0, y || 0, this._texture);

        // Capture all input events
        this.inputEnabled = true;
    }

    ContentSnapshot.prototype = Object.create(Phaser.Image.prototype);
    ContentSnapshot.constructor = ContentSnapshot;

    module.exports = ContentSnapshot;
}());

},{}],2:[function(require,module,exports){
(function() {
    "use strict";

    var Transition = require('../transition/Transition'),
        ContentSnapshot = require('./ContentSnapshot');

    /**
     * Slide Class
     * @constructor
     * @name Slide
     * @version 0.1.0
     * @author Cristian Bote <me@cristianbote.ro>
     * @param {object} game Phaser.Game instance
     */
    function Slide(game) {
        this.game = game;
        this._contentSnapshot = new ContentSnapshot(game, 0, 0);
        this._transition = new Transition(game);
    }

    /**
     * Start sliding
     * @method
     * @name go
     * @version 0.1.0
     * @author Cristian Bote <me@cristianbote.ro>
     * @param {object} options Transition options
     */
    Slide.prototype.go = function(options) {
        this.game.stage.addChildAt(this._contentSnapshot, this.game.stage.children.length);
        this._transition.start(this._contentSnapshot, options);
    };

    module.exports = Slide;
}());

},{"../transition/Transition":7,"./ContentSnapshot":1}],3:[function(require,module,exports){
/*global
    Phaser: true
    window: true
*/

(function() {
    "use strict";

    var StateManagerCachedStart = Phaser.StateManager.prototype.start,
        Slide = require('./Slide'),
        ContentSnapshot = require('./ContentSnapshot');

    function cleanup(children) {
        var i = 0,
            l = children.length;

        for(; i < l; i += 1) {
            if (children[i] && (children[i] instanceof ContentSnapshot)) {
                children[i].destroy();
            }
        }
    }

    function StateManagerStart(stateId, slideOutOptions, slideInOptions) {
        var _slide,
            _introSlide,
            _stateManager = this,
            _state = _stateManager.states[stateId],
            _args = [].slice.call(arguments),
            _cachedStateCreate = _state.create;

        _stateManager.game.stage && cleanup(_stateManager.game.stage.children);

        if (_stateManager.game.isBooted && slideOutOptions) {
            _slide = new Slide(this.game);

            (function (_state, slideOutOptions, slideInOptions) {
                _state.create = function () {
                    _cachedStateCreate.call(this);

                    // Slide in intro
                    if (slideInOptions) {
                        _introSlide = new Slide(_stateManager.game);
                        _stateManager._created = false;
                        _introSlide.go(slideInOptions);

                        _introSlide._transition.onComplete = function () {
                            _stateManager._created = true;
                            cleanup(_stateManager.game.stage.children);
                        };
                    }

                    _slide.go(slideOutOptions);

                    // Put the original create back
                    _state.create = _cachedStateCreate;
                };
            }(_state, slideOutOptions, slideInOptions));
        }

        // Start the cached state with the params for it
        StateManagerCachedStart.apply(this, [stateId].concat(_args.slice(3)));
    }

    module.exports = StateManagerStart;
}());

},{"./ContentSnapshot":1,"./Slide":2}],4:[function(require,module,exports){
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

},{"../transition/DefaultTransition":6}],5:[function(require,module,exports){
(function() {
	"use strict";

	var Slide = require('./core/Slide'),
		StateManagerStart = require('./core/StateManagerStart'),
		DefaultTransition = require('./transition/DefaultTransition');


    // Define the Plugin Class
	Phaser.Plugin.StateTransition = require('./core/StateTransition');

	// Override the default state.start
	Phaser.StateManager.prototype.start = StateManagerStart;

	module.exports = Phaser.Plugin.StateTransition;
}());

},{"./core/Slide":2,"./core/StateManagerStart":3,"./core/StateTransition":4,"./transition/DefaultTransition":6}],6:[function(require,module,exports){
(function(){
    "use strict";

    module.exports = function(options) {
        return {
            ease: options.ease || Phaser.Easing.Exponential.InOut,
            duration: options.duration || 500,
            intro: options.intro || false,
            props: options.props || {}
        }
    };
}());

},{}],7:[function(require,module,exports){
(function(){
    "use strict";

    var raf = window.requestAnimationFrame;

    /**
     * Transition Class
     * @constructor
     * @name Transition
     * @param {object} game Game instance
     */
    function Transition(game) {
        this.game = game;
        this.onComplete = null;
        this._tweens = [];
    }

    /**
     * Start the transition with a given target and options
     * @name start
     * @param target
     * @param options
     */
    Transition.prototype.start = function(target, options) {
        var prop,
            _props = options.props,
            _isIntro = !!options.intro,
            _tweenTarget,
            _tweenInstance,
            _queue = {
                '_': {}
            };

        // Store the currentTarget
        this.currentTarget = target;

        // If we need to compile the output
        if (typeof _props === 'function') {
            _props = _props(this.game);
        }

        // Make sure the proper values for props are there
        _isIntro && this._prepareTargetForTweening(_props);

        // Parse the options.props and generate the tweens options
        for (prop in _props) {
            if (_props.hasOwnProperty(prop)) {
                // If we need to compile the output
                if (typeof _props[prop] === 'function') {
                    _props[prop] = _props[prop](this.game);
                }

                // If the original value is an object
                // we need a separate tween
                if (typeof target[prop] === 'object') {
                    _queue[prop] = _props[prop];
                } else {
                    _queue['_'][prop] = _props[prop];
                }
            }
        }

        for (prop in _queue) {
            if (_queue.hasOwnProperty(prop)) {
                _tweenTarget = prop === '_' ? target : target[prop];

                this._tweens.push(
                    this.game.add.tween(_tweenTarget)
                        [_isIntro ? 'from' : 'to'](
                            _queue[prop],
                            options.duration,
                            options.ease,
                            true,
                            options.delay
                        )
                );

                _tweenInstance = this._tweens[this._tweens.length - 1];
                _tweenInstance.onComplete.addOnce(this._checkForComplete, this);
            }
        }
    };

    /**
     * Verify complete state for transition
     * @param target
     * @param tween
     * @private
     */
    Transition.prototype._checkForComplete = function(target, tween) {
        var i = 0,
            l = this._tweens.length,
            _currentTween,
            completed = 0;

        for(; i < l; i++) {
            _currentTween = this._tweens[i];
            if (_currentTween.isRunning === false) {
                completed++;
                this.game.tweens.remove(tween);
            }
        }

        if (completed === l) {
            this.onComplete && this.onComplete();
            this.currentTarget.destroy();
        }
    };

    /**
     * Makes sure, before the transition starts, that we're doing fine
     * property wise.
     * @param props
     * @private
     */
    Transition.prototype._prepareTargetForTweening = function(props) {
        if (props.hasOwnProperty('alpha')) {
            this.currentTarget.alpha = 0;
        }
    };

    /**
     * Destroy handler
     * @param target
     */
    Transition.prototype.destroy = function(target) {
        target.destroy();
    };

    /**
     * Stop handler
     */
    Transition.prototype.stop = function() {
        this._active = false;
        this.update();
    };

    /**
     * Returns a unique identifier based in Date.now() stamp.
     * Not that reliable.
     * @returns {string}
     * @private
     */
    function _getIdentifier() {
        return Date.now().toString(22).substr(-4, 4);
    }

    module.exports = Transition;
}());

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29yZS9Db250ZW50U25hcHNob3QuanMiLCJzcmMvY29yZS9TbGlkZS5qcyIsInNyYy9jb3JlL1N0YXRlTWFuYWdlclN0YXJ0LmpzIiwic3JjL2NvcmUvU3RhdGVUcmFuc2l0aW9uLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL3RyYW5zaXRpb24vRGVmYXVsdFRyYW5zaXRpb24uanMiLCJzcmMvdHJhbnNpdGlvbi9UcmFuc2l0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24oKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgUEhBU0VSX0xFR0FDWSA9ICcyLjQuOCc7XG5cbiAgICAvKipcbiAgICAgKiBDb250ZW50IFNuYXBzaG90IENsYXNzXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQG5hbWUgQ29udGVudFNuYXBzaG90XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGdhbWUgR2FtZSBvYmplY3QgaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geCBPZmZzZXQgb2YgeFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IE9mZnNldCBvZiB5XG4gICAgICogQGV4dGVuZCBQaGFzZXIuSW1hZ2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBDb250ZW50U25hcHNob3QoZ2FtZSwgeCwgeSkge1xuICAgICAgICAvLyBDcmVhdGUgdGhlIGdhbWUgYmFja2dyb3VuZCBmaWxsXG4gICAgICAgIHRoaXMuX2dyYXBoaWNGaWxsID0gbmV3IFBoYXNlci5HcmFwaGljcyhnYW1lLCAwLCAwKTtcbiAgICAgICAgdGhpcy5fZ3JhcGhpY0ZpbGwuYmVnaW5GaWxsKGdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yKTtcbiAgICAgICAgdGhpcy5fZ3JhcGhpY0ZpbGwuZHJhd1JlY3QoMCwgMCwgZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQpO1xuICAgICAgICB0aGlzLl9ncmFwaGljRmlsbC5lbmRGaWxsKCk7XG5cbiAgICAgICAgLy8gQWRkIHRoZSBncmFwaGljRmlsbCBvYmplY3QgdGVtcG9yYXJ5IHRvIHRoZSBzdGFnZSBhdCB0aGUgYmFzZVxuICAgICAgICBnYW1lLnN0YWdlLmFkZENoaWxkQXQodGhpcy5fZ3JhcGhpY0ZpbGwsIDApO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgZ2FtZSB0ZXh0dXJlXG4gICAgICAgIHRoaXMuX3RleHR1cmUgPSBuZXcgUGhhc2VyLlJlbmRlclRleHR1cmUoZ2FtZSwgZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQpO1xuICAgICAgICB0aGlzLl90ZXh0dXJlLnJlbmRlclhZKHRoaXMuX2dyYXBoaWNGaWxsLCAwLCAwKTtcblxuICAgICAgICAvLyBBZnRlciB0aGlzIGlzIHJlbmRlcmVkIHRvIHRoZSB0ZXh0dXJlLCByZW1vdmUgaXRcbiAgICAgICAgZ2FtZS5zdGFnZS5yZW1vdmVDaGlsZCh0aGlzLl9ncmFwaGljRmlsbCk7XG5cbiAgICAgICAgLy8gQWZ0ZXIgMi40LjggKDAsMCkgaXQncyBiYXNpY2FsbHkgbWlkZGxlXG4gICAgICAgIGlmIChQaGFzZXIuVkVSU0lPTiA+IFBIQVNFUl9MRUdBQ1kpIHtcbiAgICAgICAgICAgIHRoaXMuX3RleHR1cmUucmVuZGVyWFkoZ2FtZS53b3JsZCwgZ2FtZS5jYW1lcmEucG9zaXRpb24ueCAqIC0xLCBnYW1lLmNhbWVyYS5wb3NpdGlvbi55ICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fdGV4dHVyZS5yZW5kZXJYWShnYW1lLndvcmxkLCBnYW1lLndpZHRoIC8gMiAtIGdhbWUuY2FtZXJhLnBvc2l0aW9uLngsIGdhbWUuaGVpZ2h0IC8gMiAtIGdhbWUuY2FtZXJhLnBvc2l0aW9uLnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IHRoZSBpbWFnZVxuICAgICAgICBQaGFzZXIuSW1hZ2UuY2FsbCh0aGlzLCBnYW1lLCB4IHx8IDAsIHkgfHwgMCwgdGhpcy5fdGV4dHVyZSk7XG5cbiAgICAgICAgLy8gQ2FwdHVyZSBhbGwgaW5wdXQgZXZlbnRzXG4gICAgICAgIHRoaXMuaW5wdXRFbmFibGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBDb250ZW50U25hcHNob3QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuSW1hZ2UucHJvdG90eXBlKTtcbiAgICBDb250ZW50U25hcHNob3QuY29uc3RydWN0b3IgPSBDb250ZW50U25hcHNob3Q7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IENvbnRlbnRTbmFwc2hvdDtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgVHJhbnNpdGlvbiA9IHJlcXVpcmUoJy4uL3RyYW5zaXRpb24vVHJhbnNpdGlvbicpLFxuICAgICAgICBDb250ZW50U25hcHNob3QgPSByZXF1aXJlKCcuL0NvbnRlbnRTbmFwc2hvdCcpO1xuXG4gICAgLyoqXG4gICAgICogU2xpZGUgQ2xhc3NcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKiBAbmFtZSBTbGlkZVxuICAgICAqIEB2ZXJzaW9uIDAuMS4wXG4gICAgICogQGF1dGhvciBDcmlzdGlhbiBCb3RlIDxtZUBjcmlzdGlhbmJvdGUucm8+XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGdhbWUgUGhhc2VyLkdhbWUgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBTbGlkZShnYW1lKSB7XG4gICAgICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gICAgICAgIHRoaXMuX2NvbnRlbnRTbmFwc2hvdCA9IG5ldyBDb250ZW50U25hcHNob3QoZ2FtZSwgMCwgMCk7XG4gICAgICAgIHRoaXMuX3RyYW5zaXRpb24gPSBuZXcgVHJhbnNpdGlvbihnYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBzbGlkaW5nXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBuYW1lIGdvXG4gICAgICogQHZlcnNpb24gMC4xLjBcbiAgICAgKiBAYXV0aG9yIENyaXN0aWFuIEJvdGUgPG1lQGNyaXN0aWFuYm90ZS5ybz5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUcmFuc2l0aW9uIG9wdGlvbnNcbiAgICAgKi9cbiAgICBTbGlkZS5wcm90b3R5cGUuZ28gPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuZ2FtZS5zdGFnZS5hZGRDaGlsZEF0KHRoaXMuX2NvbnRlbnRTbmFwc2hvdCwgdGhpcy5nYW1lLnN0YWdlLmNoaWxkcmVuLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuX3RyYW5zaXRpb24uc3RhcnQodGhpcy5fY29udGVudFNuYXBzaG90LCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBTbGlkZTtcbn0oKSk7XG4iLCIvKmdsb2JhbFxuICAgIFBoYXNlcjogdHJ1ZVxuICAgIHdpbmRvdzogdHJ1ZVxuKi9cblxuKGZ1bmN0aW9uKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIFN0YXRlTWFuYWdlckNhY2hlZFN0YXJ0ID0gUGhhc2VyLlN0YXRlTWFuYWdlci5wcm90b3R5cGUuc3RhcnQsXG4gICAgICAgIFNsaWRlID0gcmVxdWlyZSgnLi9TbGlkZScpLFxuICAgICAgICBDb250ZW50U25hcHNob3QgPSByZXF1aXJlKCcuL0NvbnRlbnRTbmFwc2hvdCcpO1xuXG4gICAgZnVuY3Rpb24gY2xlYW51cChjaGlsZHJlbikge1xuICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICBsID0gY2hpbGRyZW4ubGVuZ3RoO1xuXG4gICAgICAgIGZvcig7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZHJlbltpXSAmJiAoY2hpbGRyZW5baV0gaW5zdGFuY2VvZiBDb250ZW50U25hcHNob3QpKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW5baV0uZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gU3RhdGVNYW5hZ2VyU3RhcnQoc3RhdGVJZCwgc2xpZGVPdXRPcHRpb25zLCBzbGlkZUluT3B0aW9ucykge1xuICAgICAgICB2YXIgX3NsaWRlLFxuICAgICAgICAgICAgX2ludHJvU2xpZGUsXG4gICAgICAgICAgICBfc3RhdGVNYW5hZ2VyID0gdGhpcyxcbiAgICAgICAgICAgIF9zdGF0ZSA9IF9zdGF0ZU1hbmFnZXIuc3RhdGVzW3N0YXRlSWRdLFxuICAgICAgICAgICAgX2FyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICBfY2FjaGVkU3RhdGVDcmVhdGUgPSBfc3RhdGUuY3JlYXRlO1xuXG4gICAgICAgIF9zdGF0ZU1hbmFnZXIuZ2FtZS5zdGFnZSAmJiBjbGVhbnVwKF9zdGF0ZU1hbmFnZXIuZ2FtZS5zdGFnZS5jaGlsZHJlbik7XG5cbiAgICAgICAgaWYgKF9zdGF0ZU1hbmFnZXIuZ2FtZS5pc0Jvb3RlZCAmJiBzbGlkZU91dE9wdGlvbnMpIHtcbiAgICAgICAgICAgIF9zbGlkZSA9IG5ldyBTbGlkZSh0aGlzLmdhbWUpO1xuXG4gICAgICAgICAgICAoZnVuY3Rpb24gKF9zdGF0ZSwgc2xpZGVPdXRPcHRpb25zLCBzbGlkZUluT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIF9zdGF0ZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF9jYWNoZWRTdGF0ZUNyZWF0ZS5jYWxsKHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFNsaWRlIGluIGludHJvXG4gICAgICAgICAgICAgICAgICAgIGlmIChzbGlkZUluT3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2ludHJvU2xpZGUgPSBuZXcgU2xpZGUoX3N0YXRlTWFuYWdlci5nYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zdGF0ZU1hbmFnZXIuX2NyZWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9pbnRyb1NsaWRlLmdvKHNsaWRlSW5PcHRpb25zKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgX2ludHJvU2xpZGUuX3RyYW5zaXRpb24ub25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfc3RhdGVNYW5hZ2VyLl9jcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKF9zdGF0ZU1hbmFnZXIuZ2FtZS5zdGFnZS5jaGlsZHJlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgX3NsaWRlLmdvKHNsaWRlT3V0T3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUHV0IHRoZSBvcmlnaW5hbCBjcmVhdGUgYmFja1xuICAgICAgICAgICAgICAgICAgICBfc3RhdGUuY3JlYXRlID0gX2NhY2hlZFN0YXRlQ3JlYXRlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KF9zdGF0ZSwgc2xpZGVPdXRPcHRpb25zLCBzbGlkZUluT3B0aW9ucykpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RhcnQgdGhlIGNhY2hlZCBzdGF0ZSB3aXRoIHRoZSBwYXJhbXMgZm9yIGl0XG4gICAgICAgIFN0YXRlTWFuYWdlckNhY2hlZFN0YXJ0LmFwcGx5KHRoaXMsIFtzdGF0ZUlkXS5jb25jYXQoX2FyZ3Muc2xpY2UoMykpKTtcbiAgICB9XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFN0YXRlTWFuYWdlclN0YXJ0O1xufSgpKTtcbiIsIi8qZ2xvYmFsXG4gUGhhc2VyOiB0cnVlXG4gd2luZG93OiB0cnVlXG4gKi9cblxuKGZ1bmN0aW9uKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIERlZmF1bHRUcmFuc2l0aW9uID0gcmVxdWlyZSgnLi4vdHJhbnNpdGlvbi9EZWZhdWx0VHJhbnNpdGlvbicpO1xuXG4gICAgLyoqXG4gICAgICogUGhhc2VyIFN0YXRlIFBsdWdpbiBDbGFzc1xuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqIEB2ZXJzaW9uIDAuMS4wXG4gICAgICogQGF1dGhvciBDcmlzdGlhbiBCb3RlIDxtZUBjcmlzdGlhbmJvdGUucm8+XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGdhbWUgUGhhc2VyLkdhbWUgaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyZW50IFBhcmVudCBlbGVtZW50XG4gICAgICogQGV4dGVuZCB7UGhhc2VyLlBsdWdpbn1cbiAgICAgKiBAZXhhbXBsZTogPGNhcHRpb24+VXNhZ2U8L2NhcHRpb24+XG4gICAgICogdmFyIHBsdWdpbiA9IHRoaXMuZ2FtZS5wbHVnaW5zLmFkZChQaGFzZXIuUGx1Z2luZy5TdGF0ZVRyYW5zaXRpb24pO1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIFN0YXRlVHJhbnNpdGlvbihnYW1lLCBwYXJlbnQpIHtcbiAgICAgICAgUGhhc2VyLlBsdWdpbi5jYWxsKHRoaXMsIGdhbWUsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgU3RhdGVUcmFuc2l0aW9uLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlBsdWdpbi5wcm90b3R5cGUpO1xuICAgIFN0YXRlVHJhbnNpdGlvbi5jb25zdHJ1Y3RvciA9IFN0YXRlVHJhbnNpdGlvbjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBjdXN0b20gdHJhbnNpdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRyYW5zaXRpb24gb2JqZWN0XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5pbnRyb10gSXMgdGhpcyBhIGludHJvZHVjdGlvbiB0cmFuc2l0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R8ZnVuY3Rpb259IG9wdGlvbnMucHJvcHMgUHJvcGVydGllcyB0byB0cmFuc2l0aW9uIHRvXG4gICAgICovXG4gICAgU3RhdGVUcmFuc2l0aW9uLmNyZWF0ZVRyYW5zaXRpb24gPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBEZWZhdWx0VHJhbnNpdGlvbihvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSW50cm8gdHJhbnNpdGlvbiBsaXN0XG4gICAgICogQHR5cGUge29iamVjdH1cbiAgICAgKi9cbiAgICBTdGF0ZVRyYW5zaXRpb24uSW4gPSB7XG5cbiAgICAgICAgU2xpZGVMZWZ0OiBEZWZhdWx0VHJhbnNpdGlvbih7XG4gICAgICAgICAgICBpbnRybzogdHJ1ZSxcbiAgICAgICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZ2FtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2FtZS53aWR0aFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG5cbiAgICAgICAgU2xpZGVSaWdodDogRGVmYXVsdFRyYW5zaXRpb24oe1xuICAgICAgICAgICAgaW50cm86IHRydWUsXG4gICAgICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGdhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC1nYW1lLndpZHRoXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSxcblxuICAgICAgICBTbGlkZVRvcDogRGVmYXVsdFRyYW5zaXRpb24oe1xuICAgICAgICAgICAgaW50cm86IHRydWUsXG4gICAgICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGdhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdhbWUuaGVpZ2h0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSxcblxuICAgICAgICBTbGlkZUJvdHRvbTogRGVmYXVsdFRyYW5zaXRpb24oe1xuICAgICAgICAgICAgaW50cm86IHRydWUsXG4gICAgICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGdhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC1nYW1lLmhlaWdodFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG5cbiAgICAgICAgU2NhbGVVcDogRGVmYXVsdFRyYW5zaXRpb24oe1xuICAgICAgICAgICAgaW50cm86IHRydWUsXG4gICAgICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgICAgIGFscGhhOiAwLjQsXG4gICAgICAgICAgICAgICAgc2NhbGU6IG5ldyBQaGFzZXIuUG9pbnQoe1xuICAgICAgICAgICAgICAgICAgICB4OiAyXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRXhpdCB0cmFuc2l0aW9uIGxpc3RcbiAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAqL1xuICAgIFN0YXRlVHJhbnNpdGlvbi5PdXQgPSB7XG5cbiAgICAgICAgU2xpZGVMZWZ0OiBEZWZhdWx0VHJhbnNpdGlvbih7XG4gICAgICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGdhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC1nYW1lLndpZHRoXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSxcblxuICAgICAgICBTbGlkZVJpZ2h0OiBEZWZhdWx0VHJhbnNpdGlvbih7XG4gICAgICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGdhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdhbWUud2lkdGhcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLFxuXG4gICAgICAgIFNsaWRlVG9wOiBEZWZhdWx0VHJhbnNpdGlvbih7XG4gICAgICAgICAgICBwcm9wczoge1xuICAgICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGdhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC1nYW1lLmhlaWdodFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG5cbiAgICAgICAgU2xpZGVCb3R0b206IERlZmF1bHRUcmFuc2l0aW9uKHtcbiAgICAgICAgICAgIHByb3BzOiBmdW5jdGlvbihnYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgeTogZ2FtZS5oZWlnaHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLFxuXG4gICAgICAgIFNjYWxlVXA6IERlZmF1bHRUcmFuc2l0aW9uKHtcbiAgICAgICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZ2FtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2FtZS53aWR0aCAvIDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNjYWxlOiB7XG4gICAgICAgICAgICAgICAgICAgIHg6IDBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gU3RhdGVUcmFuc2l0aW9uO1xufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIFNsaWRlID0gcmVxdWlyZSgnLi9jb3JlL1NsaWRlJyksXG5cdFx0U3RhdGVNYW5hZ2VyU3RhcnQgPSByZXF1aXJlKCcuL2NvcmUvU3RhdGVNYW5hZ2VyU3RhcnQnKSxcblx0XHREZWZhdWx0VHJhbnNpdGlvbiA9IHJlcXVpcmUoJy4vdHJhbnNpdGlvbi9EZWZhdWx0VHJhbnNpdGlvbicpO1xuXG5cbiAgICAvLyBEZWZpbmUgdGhlIFBsdWdpbiBDbGFzc1xuXHRQaGFzZXIuUGx1Z2luLlN0YXRlVHJhbnNpdGlvbiA9IHJlcXVpcmUoJy4vY29yZS9TdGF0ZVRyYW5zaXRpb24nKTtcblxuXHQvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBzdGF0ZS5zdGFydFxuXHRQaGFzZXIuU3RhdGVNYW5hZ2VyLnByb3RvdHlwZS5zdGFydCA9IFN0YXRlTWFuYWdlclN0YXJ0O1xuXG5cdG1vZHVsZS5leHBvcnRzID0gUGhhc2VyLlBsdWdpbi5TdGF0ZVRyYW5zaXRpb247XG59KCkpO1xuIiwiKGZ1bmN0aW9uKCl7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVhc2U6IG9wdGlvbnMuZWFzZSB8fCBQaGFzZXIuRWFzaW5nLkV4cG9uZW50aWFsLkluT3V0LFxuICAgICAgICAgICAgZHVyYXRpb246IG9wdGlvbnMuZHVyYXRpb24gfHwgNTAwLFxuICAgICAgICAgICAgaW50cm86IG9wdGlvbnMuaW50cm8gfHwgZmFsc2UsXG4gICAgICAgICAgICBwcm9wczogb3B0aW9ucy5wcm9wcyB8fCB7fVxuICAgICAgICB9XG4gICAgfTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKXtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciByYWYgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuXG4gICAgLyoqXG4gICAgICogVHJhbnNpdGlvbiBDbGFzc1xuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqIEBuYW1lIFRyYW5zaXRpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZ2FtZSBHYW1lIGluc3RhbmNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gVHJhbnNpdGlvbihnYW1lKSB7XG4gICAgICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gICAgICAgIHRoaXMub25Db21wbGV0ZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3R3ZWVucyA9IFtdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IHRoZSB0cmFuc2l0aW9uIHdpdGggYSBnaXZlbiB0YXJnZXQgYW5kIG9wdGlvbnNcbiAgICAgKiBAbmFtZSBzdGFydFxuICAgICAqIEBwYXJhbSB0YXJnZXRcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqL1xuICAgIFRyYW5zaXRpb24ucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24odGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBwcm9wLFxuICAgICAgICAgICAgX3Byb3BzID0gb3B0aW9ucy5wcm9wcyxcbiAgICAgICAgICAgIF9pc0ludHJvID0gISFvcHRpb25zLmludHJvLFxuICAgICAgICAgICAgX3R3ZWVuVGFyZ2V0LFxuICAgICAgICAgICAgX3R3ZWVuSW5zdGFuY2UsXG4gICAgICAgICAgICBfcXVldWUgPSB7XG4gICAgICAgICAgICAgICAgJ18nOiB7fVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAvLyBTdG9yZSB0aGUgY3VycmVudFRhcmdldFxuICAgICAgICB0aGlzLmN1cnJlbnRUYXJnZXQgPSB0YXJnZXQ7XG5cbiAgICAgICAgLy8gSWYgd2UgbmVlZCB0byBjb21waWxlIHRoZSBvdXRwdXRcbiAgICAgICAgaWYgKHR5cGVvZiBfcHJvcHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIF9wcm9wcyA9IF9wcm9wcyh0aGlzLmdhbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBwcm9wZXIgdmFsdWVzIGZvciBwcm9wcyBhcmUgdGhlcmVcbiAgICAgICAgX2lzSW50cm8gJiYgdGhpcy5fcHJlcGFyZVRhcmdldEZvclR3ZWVuaW5nKF9wcm9wcyk7XG5cbiAgICAgICAgLy8gUGFyc2UgdGhlIG9wdGlvbnMucHJvcHMgYW5kIGdlbmVyYXRlIHRoZSB0d2VlbnMgb3B0aW9uc1xuICAgICAgICBmb3IgKHByb3AgaW4gX3Byb3BzKSB7XG4gICAgICAgICAgICBpZiAoX3Byb3BzLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgbmVlZCB0byBjb21waWxlIHRoZSBvdXRwdXRcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIF9wcm9wc1twcm9wXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBfcHJvcHNbcHJvcF0gPSBfcHJvcHNbcHJvcF0odGhpcy5nYW1lKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgb3JpZ2luYWwgdmFsdWUgaXMgYW4gb2JqZWN0XG4gICAgICAgICAgICAgICAgLy8gd2UgbmVlZCBhIHNlcGFyYXRlIHR3ZWVuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXRbcHJvcF0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIF9xdWV1ZVtwcm9wXSA9IF9wcm9wc1twcm9wXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfcXVldWVbJ18nXVtwcm9wXSA9IF9wcm9wc1twcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHByb3AgaW4gX3F1ZXVlKSB7XG4gICAgICAgICAgICBpZiAoX3F1ZXVlLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgICAgX3R3ZWVuVGFyZ2V0ID0gcHJvcCA9PT0gJ18nID8gdGFyZ2V0IDogdGFyZ2V0W3Byb3BdO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fdHdlZW5zLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4oX3R3ZWVuVGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgW19pc0ludHJvID8gJ2Zyb20nIDogJ3RvJ10oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3F1ZXVlW3Byb3BdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lYXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5kZWxheVxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBfdHdlZW5JbnN0YW5jZSA9IHRoaXMuX3R3ZWVuc1t0aGlzLl90d2VlbnMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgX3R3ZWVuSW5zdGFuY2Uub25Db21wbGV0ZS5hZGRPbmNlKHRoaXMuX2NoZWNrRm9yQ29tcGxldGUsIHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFZlcmlmeSBjb21wbGV0ZSBzdGF0ZSBmb3IgdHJhbnNpdGlvblxuICAgICAqIEBwYXJhbSB0YXJnZXRcbiAgICAgKiBAcGFyYW0gdHdlZW5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIFRyYW5zaXRpb24ucHJvdG90eXBlLl9jaGVja0ZvckNvbXBsZXRlID0gZnVuY3Rpb24odGFyZ2V0LCB0d2Vlbikge1xuICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICBsID0gdGhpcy5fdHdlZW5zLmxlbmd0aCxcbiAgICAgICAgICAgIF9jdXJyZW50VHdlZW4sXG4gICAgICAgICAgICBjb21wbGV0ZWQgPSAwO1xuXG4gICAgICAgIGZvcig7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIF9jdXJyZW50VHdlZW4gPSB0aGlzLl90d2VlbnNbaV07XG4gICAgICAgICAgICBpZiAoX2N1cnJlbnRUd2Vlbi5pc1J1bm5pbmcgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgY29tcGxldGVkKys7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lLnR3ZWVucy5yZW1vdmUodHdlZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBsZXRlZCA9PT0gbCkge1xuICAgICAgICAgICAgdGhpcy5vbkNvbXBsZXRlICYmIHRoaXMub25Db21wbGV0ZSgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFyZ2V0LmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBzdXJlLCBiZWZvcmUgdGhlIHRyYW5zaXRpb24gc3RhcnRzLCB0aGF0IHdlJ3JlIGRvaW5nIGZpbmVcbiAgICAgKiBwcm9wZXJ0eSB3aXNlLlxuICAgICAqIEBwYXJhbSBwcm9wc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgVHJhbnNpdGlvbi5wcm90b3R5cGUuX3ByZXBhcmVUYXJnZXRGb3JUd2VlbmluZyA9IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eSgnYWxwaGEnKSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VGFyZ2V0LmFscGhhID0gMDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXN0cm95IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0gdGFyZ2V0XG4gICAgICovXG4gICAgVHJhbnNpdGlvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICB0YXJnZXQuZGVzdHJveSgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTdG9wIGhhbmRsZXJcbiAgICAgKi9cbiAgICBUcmFuc2l0aW9uLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdW5pcXVlIGlkZW50aWZpZXIgYmFzZWQgaW4gRGF0ZS5ub3coKSBzdGFtcC5cbiAgICAgKiBOb3QgdGhhdCByZWxpYWJsZS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2dldElkZW50aWZpZXIoKSB7XG4gICAgICAgIHJldHVybiBEYXRlLm5vdygpLnRvU3RyaW5nKDIyKS5zdWJzdHIoLTQsIDQpO1xuICAgIH1cblxuICAgIG1vZHVsZS5leHBvcnRzID0gVHJhbnNpdGlvbjtcbn0oKSk7XG4iXX0=
