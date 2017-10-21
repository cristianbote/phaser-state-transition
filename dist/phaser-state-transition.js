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
     * @param {boolean} noStage Flag do skip rendering the stage for slider
     * @extend Phaser.Image
     */
    function ContentSnapshot(game, x, y, noStage) {

        // Create the game texture
        this._texture = new Phaser.RenderTexture(game, game.width, game.height);

        if (!noStage) {
            // Create the game background fill
            this._graphicFill = new Phaser.Graphics(game, 0, 0);
            this._graphicFill.beginFill(game.stage.backgroundColor);
            this._graphicFill.drawRect(0, 0, game.width, game.height);
            this._graphicFill.endFill();

            // Add the graphicFill object temporary to the stage at the base
            game.stage.addChildAt(this._graphicFill, 0);
            this._texture.renderXY(this._graphicFill, 0, 0);
            // After this is rendered to the texture, remove it
            game.stage.removeChild(this._graphicFill);
        }

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
     * @param {boolean} noStage No stage flag
     */
    function Slide(game, noStage) {
        this.game = game;
        this._contentSnapshot = new ContentSnapshot(game, 0, 0, noStage);
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
            _slide = new Slide(this.game, slideOutOptions.noStage);

            (function (_state, slideOutOptions, slideInOptions) {
                _state.create = function () {
                    _cachedStateCreate.call(this);

                    // Slide in intro
                    if (slideInOptions) {
                        _introSlide = new Slide(_stateManager.game, slideInOptions.noStage);
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
        }),

        fade: DefaultTransition({
            intro: true,
            props: {
                alpha: 1
            },
			duration: 1500
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
        }),

        fade: DefaultTransition({
            props: {
                alpha: 0
            },
			duration: 1500
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

	module.exports = window.StateTransition = Phaser.Plugin.StateTransition;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29yZS9Db250ZW50U25hcHNob3QuanMiLCJzcmMvY29yZS9TbGlkZS5qcyIsInNyYy9jb3JlL1N0YXRlTWFuYWdlclN0YXJ0LmpzIiwic3JjL2NvcmUvU3RhdGVUcmFuc2l0aW9uLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL3RyYW5zaXRpb24vRGVmYXVsdFRyYW5zaXRpb24uanMiLCJzcmMvdHJhbnNpdGlvbi9UcmFuc2l0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbigpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIHZhciBQSEFTRVJfTEVHQUNZID0gJzIuNC44JztcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnRlbnQgU25hcHNob3QgQ2xhc3NcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICogQG5hbWUgQ29udGVudFNuYXBzaG90XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZ2FtZSBHYW1lIG9iamVjdCBpbnN0YW5jZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHggT2Zmc2V0IG9mIHhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IE9mZnNldCBvZiB5XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG5vU3RhZ2UgRmxhZyBkbyBza2lwIHJlbmRlcmluZyB0aGUgc3RhZ2UgZm9yIHNsaWRlclxyXG4gICAgICogQGV4dGVuZCBQaGFzZXIuSW1hZ2VcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gQ29udGVudFNuYXBzaG90KGdhbWUsIHgsIHksIG5vU3RhZ2UpIHtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBnYW1lIHRleHR1cmVcclxuICAgICAgICB0aGlzLl90ZXh0dXJlID0gbmV3IFBoYXNlci5SZW5kZXJUZXh0dXJlKGdhbWUsIGdhbWUud2lkdGgsIGdhbWUuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgaWYgKCFub1N0YWdlKSB7XHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgZ2FtZSBiYWNrZ3JvdW5kIGZpbGxcclxuICAgICAgICAgICAgdGhpcy5fZ3JhcGhpY0ZpbGwgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKGdhbWUsIDAsIDApO1xyXG4gICAgICAgICAgICB0aGlzLl9ncmFwaGljRmlsbC5iZWdpbkZpbGwoZ2FtZS5zdGFnZS5iYWNrZ3JvdW5kQ29sb3IpO1xyXG4gICAgICAgICAgICB0aGlzLl9ncmFwaGljRmlsbC5kcmF3UmVjdCgwLCAwLCBnYW1lLndpZHRoLCBnYW1lLmhlaWdodCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2dyYXBoaWNGaWxsLmVuZEZpbGwoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgZ3JhcGhpY0ZpbGwgb2JqZWN0IHRlbXBvcmFyeSB0byB0aGUgc3RhZ2UgYXQgdGhlIGJhc2VcclxuICAgICAgICAgICAgZ2FtZS5zdGFnZS5hZGRDaGlsZEF0KHRoaXMuX2dyYXBoaWNGaWxsLCAwKTtcclxuICAgICAgICAgICAgdGhpcy5fdGV4dHVyZS5yZW5kZXJYWSh0aGlzLl9ncmFwaGljRmlsbCwgMCwgMCk7XHJcbiAgICAgICAgICAgIC8vIEFmdGVyIHRoaXMgaXMgcmVuZGVyZWQgdG8gdGhlIHRleHR1cmUsIHJlbW92ZSBpdFxyXG4gICAgICAgICAgICBnYW1lLnN0YWdlLnJlbW92ZUNoaWxkKHRoaXMuX2dyYXBoaWNGaWxsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFmdGVyIDIuNC44ICgwLDApIGl0J3MgYmFzaWNhbGx5IG1pZGRsZVxyXG4gICAgICAgIGlmIChQaGFzZXIuVkVSU0lPTiA+IFBIQVNFUl9MRUdBQ1kpIHtcclxuICAgICAgICAgICAgdGhpcy5fdGV4dHVyZS5yZW5kZXJYWShnYW1lLndvcmxkLCBnYW1lLmNhbWVyYS5wb3NpdGlvbi54ICogLTEsIGdhbWUuY2FtZXJhLnBvc2l0aW9uLnkgKiAtMSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fdGV4dHVyZS5yZW5kZXJYWShnYW1lLndvcmxkLCBnYW1lLndpZHRoIC8gMiAtIGdhbWUuY2FtZXJhLnBvc2l0aW9uLngsIGdhbWUuaGVpZ2h0IC8gMiAtIGdhbWUuY2FtZXJhLnBvc2l0aW9uLnkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2V0IHRoZSBpbWFnZVxyXG4gICAgICAgIFBoYXNlci5JbWFnZS5jYWxsKHRoaXMsIGdhbWUsIHggfHwgMCwgeSB8fCAwLCB0aGlzLl90ZXh0dXJlKTtcclxuXHJcbiAgICAgICAgLy8gQ2FwdHVyZSBhbGwgaW5wdXQgZXZlbnRzXHJcbiAgICAgICAgdGhpcy5pbnB1dEVuYWJsZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIENvbnRlbnRTbmFwc2hvdC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5JbWFnZS5wcm90b3R5cGUpO1xyXG4gICAgQ29udGVudFNuYXBzaG90LmNvbnN0cnVjdG9yID0gQ29udGVudFNuYXBzaG90O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gQ29udGVudFNuYXBzaG90O1xyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICB2YXIgVHJhbnNpdGlvbiA9IHJlcXVpcmUoJy4uL3RyYW5zaXRpb24vVHJhbnNpdGlvbicpLFxyXG4gICAgICAgIENvbnRlbnRTbmFwc2hvdCA9IHJlcXVpcmUoJy4vQ29udGVudFNuYXBzaG90Jyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTbGlkZSBDbGFzc1xyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKiBAbmFtZSBTbGlkZVxyXG4gICAgICogQHZlcnNpb24gMC4xLjBcclxuICAgICAqIEBhdXRob3IgQ3Jpc3RpYW4gQm90ZSA8bWVAY3Jpc3RpYW5ib3RlLnJvPlxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGdhbWUgUGhhc2VyLkdhbWUgaW5zdGFuY2VcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbm9TdGFnZSBObyBzdGFnZSBmbGFnXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIFNsaWRlKGdhbWUsIG5vU3RhZ2UpIHtcclxuICAgICAgICB0aGlzLmdhbWUgPSBnYW1lO1xyXG4gICAgICAgIHRoaXMuX2NvbnRlbnRTbmFwc2hvdCA9IG5ldyBDb250ZW50U25hcHNob3QoZ2FtZSwgMCwgMCwgbm9TdGFnZSk7XHJcbiAgICAgICAgdGhpcy5fdHJhbnNpdGlvbiA9IG5ldyBUcmFuc2l0aW9uKGdhbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3RhcnQgc2xpZGluZ1xyXG4gICAgICogQG1ldGhvZFxyXG4gICAgICogQG5hbWUgZ29cclxuICAgICAqIEB2ZXJzaW9uIDAuMS4wXHJcbiAgICAgKiBAYXV0aG9yIENyaXN0aWFuIEJvdGUgPG1lQGNyaXN0aWFuYm90ZS5ybz5cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRyYW5zaXRpb24gb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBTbGlkZS5wcm90b3R5cGUuZ28gPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5nYW1lLnN0YWdlLmFkZENoaWxkQXQodGhpcy5fY29udGVudFNuYXBzaG90LCB0aGlzLmdhbWUuc3RhZ2UuY2hpbGRyZW4ubGVuZ3RoKTtcclxuICAgICAgICB0aGlzLl90cmFuc2l0aW9uLnN0YXJ0KHRoaXMuX2NvbnRlbnRTbmFwc2hvdCwgb3B0aW9ucyk7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gU2xpZGU7XHJcbn0oKSk7XHJcbiIsIi8qZ2xvYmFsXHJcbiAgICBQaGFzZXI6IHRydWVcclxuICAgIHdpbmRvdzogdHJ1ZVxyXG4qL1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIFN0YXRlTWFuYWdlckNhY2hlZFN0YXJ0ID0gUGhhc2VyLlN0YXRlTWFuYWdlci5wcm90b3R5cGUuc3RhcnQsXHJcbiAgICAgICAgU2xpZGUgPSByZXF1aXJlKCcuL1NsaWRlJyksXHJcbiAgICAgICAgQ29udGVudFNuYXBzaG90ID0gcmVxdWlyZSgnLi9Db250ZW50U25hcHNob3QnKTtcclxuXHJcbiAgICBmdW5jdGlvbiBjbGVhbnVwKGNoaWxkcmVuKSB7XHJcbiAgICAgICAgdmFyIGkgPSAwLFxyXG4gICAgICAgICAgICBsID0gY2hpbGRyZW4ubGVuZ3RoO1xyXG5cclxuICAgICAgICBmb3IoOyBpIDwgbDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgIGlmIChjaGlsZHJlbltpXSAmJiAoY2hpbGRyZW5baV0gaW5zdGFuY2VvZiBDb250ZW50U25hcHNob3QpKSB7XHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbltpXS5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gU3RhdGVNYW5hZ2VyU3RhcnQoc3RhdGVJZCwgc2xpZGVPdXRPcHRpb25zLCBzbGlkZUluT3B0aW9ucykge1xyXG4gICAgICAgIHZhciBfc2xpZGUsXHJcbiAgICAgICAgICAgIF9pbnRyb1NsaWRlLFxyXG4gICAgICAgICAgICBfc3RhdGVNYW5hZ2VyID0gdGhpcyxcclxuICAgICAgICAgICAgX3N0YXRlID0gX3N0YXRlTWFuYWdlci5zdGF0ZXNbc3RhdGVJZF0sXHJcbiAgICAgICAgICAgIF9hcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpLFxyXG4gICAgICAgICAgICBfY2FjaGVkU3RhdGVDcmVhdGUgPSBfc3RhdGUuY3JlYXRlO1xyXG5cclxuICAgICAgICBfc3RhdGVNYW5hZ2VyLmdhbWUuc3RhZ2UgJiYgY2xlYW51cChfc3RhdGVNYW5hZ2VyLmdhbWUuc3RhZ2UuY2hpbGRyZW4pO1xyXG5cclxuICAgICAgICBpZiAoX3N0YXRlTWFuYWdlci5nYW1lLmlzQm9vdGVkICYmIHNsaWRlT3V0T3B0aW9ucykge1xyXG4gICAgICAgICAgICBfc2xpZGUgPSBuZXcgU2xpZGUodGhpcy5nYW1lLCBzbGlkZU91dE9wdGlvbnMubm9TdGFnZSk7XHJcblxyXG4gICAgICAgICAgICAoZnVuY3Rpb24gKF9zdGF0ZSwgc2xpZGVPdXRPcHRpb25zLCBzbGlkZUluT3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgX3N0YXRlLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBfY2FjaGVkU3RhdGVDcmVhdGUuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2xpZGUgaW4gaW50cm9cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2xpZGVJbk9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX2ludHJvU2xpZGUgPSBuZXcgU2xpZGUoX3N0YXRlTWFuYWdlci5nYW1lLCBzbGlkZUluT3B0aW9ucy5ub1N0YWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3N0YXRlTWFuYWdlci5fY3JlYXRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfaW50cm9TbGlkZS5nbyhzbGlkZUluT3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfaW50cm9TbGlkZS5fdHJhbnNpdGlvbi5vbkNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3N0YXRlTWFuYWdlci5fY3JlYXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKF9zdGF0ZU1hbmFnZXIuZ2FtZS5zdGFnZS5jaGlsZHJlbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBfc2xpZGUuZ28oc2xpZGVPdXRPcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUHV0IHRoZSBvcmlnaW5hbCBjcmVhdGUgYmFja1xyXG4gICAgICAgICAgICAgICAgICAgIF9zdGF0ZS5jcmVhdGUgPSBfY2FjaGVkU3RhdGVDcmVhdGU7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9KF9zdGF0ZSwgc2xpZGVPdXRPcHRpb25zLCBzbGlkZUluT3B0aW9ucykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gU3RhcnQgdGhlIGNhY2hlZCBzdGF0ZSB3aXRoIHRoZSBwYXJhbXMgZm9yIGl0XHJcbiAgICAgICAgU3RhdGVNYW5hZ2VyQ2FjaGVkU3RhcnQuYXBwbHkodGhpcywgW3N0YXRlSWRdLmNvbmNhdChfYXJncy5zbGljZSgzKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gU3RhdGVNYW5hZ2VyU3RhcnQ7XHJcbn0oKSk7XHJcbiIsIi8qZ2xvYmFsXHJcbiBQaGFzZXI6IHRydWVcclxuIHdpbmRvdzogdHJ1ZVxyXG4gKi9cclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIHZhciBEZWZhdWx0VHJhbnNpdGlvbiA9IHJlcXVpcmUoJy4uL3RyYW5zaXRpb24vRGVmYXVsdFRyYW5zaXRpb24nKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBoYXNlciBTdGF0ZSBQbHVnaW4gQ2xhc3NcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICogQHZlcnNpb24gMC4xLjBcclxuICAgICAqIEBhdXRob3IgQ3Jpc3RpYW4gQm90ZSA8bWVAY3Jpc3RpYW5ib3RlLnJvPlxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGdhbWUgUGhhc2VyLkdhbWUgaW5zdGFuY2VcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJlbnQgUGFyZW50IGVsZW1lbnRcclxuICAgICAqIEBleHRlbmQge1BoYXNlci5QbHVnaW59XHJcbiAgICAgKiBAZXhhbXBsZTogPGNhcHRpb24+VXNhZ2U8L2NhcHRpb24+XHJcbiAgICAgKiB2YXIgcGx1Z2luID0gdGhpcy5nYW1lLnBsdWdpbnMuYWRkKFBoYXNlci5QbHVnaW5nLlN0YXRlVHJhbnNpdGlvbik7XHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIFN0YXRlVHJhbnNpdGlvbihnYW1lLCBwYXJlbnQpIHtcclxuICAgICAgICBQaGFzZXIuUGx1Z2luLmNhbGwodGhpcywgZ2FtZSwgcGFyZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBTdGF0ZVRyYW5zaXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuUGx1Z2luLnByb3RvdHlwZSk7XHJcbiAgICBTdGF0ZVRyYW5zaXRpb24uY29uc3RydWN0b3IgPSBTdGF0ZVRyYW5zaXRpb247XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgY3VzdG9tIHRyYW5zaXRpb25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRyYW5zaXRpb24gb2JqZWN0XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmludHJvXSBJcyB0aGlzIGEgaW50cm9kdWN0aW9uIHRyYW5zaXRpb25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fGZ1bmN0aW9ufSBvcHRpb25zLnByb3BzIFByb3BlcnRpZXMgdG8gdHJhbnNpdGlvbiB0b1xyXG4gICAgICovXHJcbiAgICBTdGF0ZVRyYW5zaXRpb24uY3JlYXRlVHJhbnNpdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICByZXR1cm4gRGVmYXVsdFRyYW5zaXRpb24ob3B0aW9ucyk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW50cm8gdHJhbnNpdGlvbiBsaXN0XHJcbiAgICAgKiBAdHlwZSB7b2JqZWN0fVxyXG4gICAgICovXHJcbiAgICBTdGF0ZVRyYW5zaXRpb24uSW4gPSB7XHJcblxyXG4gICAgICAgIFNsaWRlTGVmdDogRGVmYXVsdFRyYW5zaXRpb24oe1xyXG4gICAgICAgICAgICBpbnRybzogdHJ1ZSxcclxuICAgICAgICAgICAgcHJvcHM6IHtcclxuICAgICAgICAgICAgICAgIHg6IGZ1bmN0aW9uKGdhbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2FtZS53aWR0aFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSksXHJcblxyXG4gICAgICAgIFNsaWRlUmlnaHQ6IERlZmF1bHRUcmFuc2l0aW9uKHtcclxuICAgICAgICAgICAgaW50cm86IHRydWUsXHJcbiAgICAgICAgICAgIHByb3BzOiB7XHJcbiAgICAgICAgICAgICAgICB4OiBmdW5jdGlvbihnYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC1nYW1lLndpZHRoXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgU2xpZGVUb3A6IERlZmF1bHRUcmFuc2l0aW9uKHtcclxuICAgICAgICAgICAgaW50cm86IHRydWUsXHJcbiAgICAgICAgICAgIHByb3BzOiB7XHJcbiAgICAgICAgICAgICAgICB5OiBmdW5jdGlvbihnYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdhbWUuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgU2xpZGVCb3R0b206IERlZmF1bHRUcmFuc2l0aW9uKHtcclxuICAgICAgICAgICAgaW50cm86IHRydWUsXHJcbiAgICAgICAgICAgIHByb3BzOiB7XHJcbiAgICAgICAgICAgICAgICB5OiBmdW5jdGlvbihnYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC1nYW1lLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSksXHJcblxyXG4gICAgICAgIFNjYWxlVXA6IERlZmF1bHRUcmFuc2l0aW9uKHtcclxuICAgICAgICAgICAgaW50cm86IHRydWUsXHJcbiAgICAgICAgICAgIHByb3BzOiB7XHJcbiAgICAgICAgICAgICAgICBhbHBoYTogMC40LFxyXG4gICAgICAgICAgICAgICAgc2NhbGU6IG5ldyBQaGFzZXIuUG9pbnQoe1xyXG4gICAgICAgICAgICAgICAgICAgIHg6IDJcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgZmFkZTogRGVmYXVsdFRyYW5zaXRpb24oe1xyXG4gICAgICAgICAgICBpbnRybzogdHJ1ZSxcclxuICAgICAgICAgICAgcHJvcHM6IHtcclxuICAgICAgICAgICAgICAgIGFscGhhOiAxXHJcbiAgICAgICAgICAgIH0sXHJcblx0XHRcdGR1cmF0aW9uOiAxNTAwXHJcbiAgICAgICAgfSlcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGl0IHRyYW5zaXRpb24gbGlzdFxyXG4gICAgICogQHR5cGUge29iamVjdH1cclxuICAgICAqL1xyXG4gICAgU3RhdGVUcmFuc2l0aW9uLk91dCA9IHtcclxuXHJcbiAgICAgICAgU2xpZGVMZWZ0OiBEZWZhdWx0VHJhbnNpdGlvbih7XHJcbiAgICAgICAgICAgIHByb3BzOiB7XHJcbiAgICAgICAgICAgICAgICB4OiBmdW5jdGlvbihnYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC1nYW1lLndpZHRoXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgU2xpZGVSaWdodDogRGVmYXVsdFRyYW5zaXRpb24oe1xyXG4gICAgICAgICAgICBwcm9wczoge1xyXG4gICAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZ2FtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnYW1lLndpZHRoXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgU2xpZGVUb3A6IERlZmF1bHRUcmFuc2l0aW9uKHtcclxuICAgICAgICAgICAgcHJvcHM6IHtcclxuICAgICAgICAgICAgICAgIHk6IGZ1bmN0aW9uKGdhbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLWdhbWUuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgU2xpZGVCb3R0b206IERlZmF1bHRUcmFuc2l0aW9uKHtcclxuICAgICAgICAgICAgcHJvcHM6IGZ1bmN0aW9uKGdhbWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgeTogZ2FtZS5oZWlnaHRcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pLFxyXG5cclxuICAgICAgICBTY2FsZVVwOiBEZWZhdWx0VHJhbnNpdGlvbih7XHJcbiAgICAgICAgICAgIHByb3BzOiB7XHJcbiAgICAgICAgICAgICAgICB4OiBmdW5jdGlvbihnYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdhbWUud2lkdGggLyAyXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc2NhbGU6IHtcclxuICAgICAgICAgICAgICAgICAgICB4OiAwXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgZmFkZTogRGVmYXVsdFRyYW5zaXRpb24oe1xyXG4gICAgICAgICAgICBwcm9wczoge1xyXG4gICAgICAgICAgICAgICAgYWxwaGE6IDBcclxuICAgICAgICAgICAgfSxcclxuXHRcdFx0ZHVyYXRpb246IDE1MDBcclxuICAgICAgICB9KVxyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFN0YXRlVHJhbnNpdGlvbjtcclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cdFwidXNlIHN0cmljdFwiO1xyXG5cclxuXHR2YXIgU2xpZGUgPSByZXF1aXJlKCcuL2NvcmUvU2xpZGUnKSxcclxuXHRcdFN0YXRlTWFuYWdlclN0YXJ0ID0gcmVxdWlyZSgnLi9jb3JlL1N0YXRlTWFuYWdlclN0YXJ0JyksXHJcblx0XHREZWZhdWx0VHJhbnNpdGlvbiA9IHJlcXVpcmUoJy4vdHJhbnNpdGlvbi9EZWZhdWx0VHJhbnNpdGlvbicpO1xyXG5cclxuXHJcbiAgICAvLyBEZWZpbmUgdGhlIFBsdWdpbiBDbGFzc1xyXG5cdFBoYXNlci5QbHVnaW4uU3RhdGVUcmFuc2l0aW9uID0gcmVxdWlyZSgnLi9jb3JlL1N0YXRlVHJhbnNpdGlvbicpO1xyXG5cclxuXHQvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBzdGF0ZS5zdGFydFxyXG5cdFBoYXNlci5TdGF0ZU1hbmFnZXIucHJvdG90eXBlLnN0YXJ0ID0gU3RhdGVNYW5hZ2VyU3RhcnQ7XHJcblxyXG5cdG1vZHVsZS5leHBvcnRzID0gd2luZG93LlN0YXRlVHJhbnNpdGlvbiA9IFBoYXNlci5QbHVnaW4uU3RhdGVUcmFuc2l0aW9uO1xyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24oKXtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGVhc2U6IG9wdGlvbnMuZWFzZSB8fCBQaGFzZXIuRWFzaW5nLkV4cG9uZW50aWFsLkluT3V0LFxyXG4gICAgICAgICAgICBkdXJhdGlvbjogb3B0aW9ucy5kdXJhdGlvbiB8fCA1MDAsXHJcbiAgICAgICAgICAgIGludHJvOiBvcHRpb25zLmludHJvIHx8IGZhbHNlLFxyXG4gICAgICAgICAgICBwcm9wczogb3B0aW9ucy5wcm9wcyB8fCB7fVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0oKSk7XHJcbiIsIihmdW5jdGlvbigpe1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgdmFyIHJhZiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmFuc2l0aW9uIENsYXNzXHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqIEBuYW1lIFRyYW5zaXRpb25cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBnYW1lIEdhbWUgaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gVHJhbnNpdGlvbihnYW1lKSB7XHJcbiAgICAgICAgdGhpcy5nYW1lID0gZ2FtZTtcclxuICAgICAgICB0aGlzLm9uQ29tcGxldGUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX3R3ZWVucyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3RhcnQgdGhlIHRyYW5zaXRpb24gd2l0aCBhIGdpdmVuIHRhcmdldCBhbmQgb3B0aW9uc1xyXG4gICAgICogQG5hbWUgc3RhcnRcclxuICAgICAqIEBwYXJhbSB0YXJnZXRcclxuICAgICAqIEBwYXJhbSBvcHRpb25zXHJcbiAgICAgKi9cclxuICAgIFRyYW5zaXRpb24ucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24odGFyZ2V0LCBvcHRpb25zKSB7XHJcbiAgICAgICAgdmFyIHByb3AsXHJcbiAgICAgICAgICAgIF9wcm9wcyA9IG9wdGlvbnMucHJvcHMsXHJcbiAgICAgICAgICAgIF9pc0ludHJvID0gISFvcHRpb25zLmludHJvLFxyXG4gICAgICAgICAgICBfdHdlZW5UYXJnZXQsXHJcbiAgICAgICAgICAgIF90d2Vlbkluc3RhbmNlLFxyXG4gICAgICAgICAgICBfcXVldWUgPSB7XHJcbiAgICAgICAgICAgICAgICAnXyc6IHt9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIFN0b3JlIHRoZSBjdXJyZW50VGFyZ2V0XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VGFyZ2V0ID0gdGFyZ2V0O1xyXG5cclxuICAgICAgICAvLyBJZiB3ZSBuZWVkIHRvIGNvbXBpbGUgdGhlIG91dHB1dFxyXG4gICAgICAgIGlmICh0eXBlb2YgX3Byb3BzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIF9wcm9wcyA9IF9wcm9wcyh0aGlzLmdhbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBwcm9wZXIgdmFsdWVzIGZvciBwcm9wcyBhcmUgdGhlcmVcclxuICAgICAgICBfaXNJbnRybyAmJiB0aGlzLl9wcmVwYXJlVGFyZ2V0Rm9yVHdlZW5pbmcoX3Byb3BzKTtcclxuXHJcbiAgICAgICAgLy8gUGFyc2UgdGhlIG9wdGlvbnMucHJvcHMgYW5kIGdlbmVyYXRlIHRoZSB0d2VlbnMgb3B0aW9uc1xyXG4gICAgICAgIGZvciAocHJvcCBpbiBfcHJvcHMpIHtcclxuICAgICAgICAgICAgaWYgKF9wcm9wcy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgbmVlZCB0byBjb21waWxlIHRoZSBvdXRwdXRcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgX3Byb3BzW3Byb3BdID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3Byb3BzW3Byb3BdID0gX3Byb3BzW3Byb3BdKHRoaXMuZ2FtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIG9yaWdpbmFsIHZhbHVlIGlzIGFuIG9iamVjdFxyXG4gICAgICAgICAgICAgICAgLy8gd2UgbmVlZCBhIHNlcGFyYXRlIHR3ZWVuXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRhcmdldFtwcm9wXSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBfcXVldWVbcHJvcF0gPSBfcHJvcHNbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIF9xdWV1ZVsnXyddW3Byb3BdID0gX3Byb3BzW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHByb3AgaW4gX3F1ZXVlKSB7XHJcbiAgICAgICAgICAgIGlmIChfcXVldWUuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIF90d2VlblRhcmdldCA9IHByb3AgPT09ICdfJyA/IHRhcmdldCA6IHRhcmdldFtwcm9wXTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLl90d2VlbnMucHVzaChcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKF90d2VlblRhcmdldClcclxuICAgICAgICAgICAgICAgICAgICAgICAgW19pc0ludHJvID8gJ2Zyb20nIDogJ3RvJ10oXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcXVldWVbcHJvcF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmR1cmF0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lYXNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZGVsYXlcclxuICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBfdHdlZW5JbnN0YW5jZSA9IHRoaXMuX3R3ZWVuc1t0aGlzLl90d2VlbnMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICAgICAgICBfdHdlZW5JbnN0YW5jZS5vbkNvbXBsZXRlLmFkZE9uY2UodGhpcy5fY2hlY2tGb3JDb21wbGV0ZSwgdGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVmVyaWZ5IGNvbXBsZXRlIHN0YXRlIGZvciB0cmFuc2l0aW9uXHJcbiAgICAgKiBAcGFyYW0gdGFyZ2V0XHJcbiAgICAgKiBAcGFyYW0gdHdlZW5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIFRyYW5zaXRpb24ucHJvdG90eXBlLl9jaGVja0ZvckNvbXBsZXRlID0gZnVuY3Rpb24odGFyZ2V0LCB0d2Vlbikge1xyXG4gICAgICAgIHZhciBpID0gMCxcclxuICAgICAgICAgICAgbCA9IHRoaXMuX3R3ZWVucy5sZW5ndGgsXHJcbiAgICAgICAgICAgIF9jdXJyZW50VHdlZW4sXHJcbiAgICAgICAgICAgIGNvbXBsZXRlZCA9IDA7XHJcblxyXG4gICAgICAgIGZvcig7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgX2N1cnJlbnRUd2VlbiA9IHRoaXMuX3R3ZWVuc1tpXTtcclxuICAgICAgICAgICAgaWYgKF9jdXJyZW50VHdlZW4uaXNSdW5uaW5nID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGVkKys7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWUudHdlZW5zLnJlbW92ZSh0d2Vlbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjb21wbGV0ZWQgPT09IGwpIHtcclxuICAgICAgICAgICAgdGhpcy5vbkNvbXBsZXRlICYmIHRoaXMub25Db21wbGV0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXJnZXQuZGVzdHJveSgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlcyBzdXJlLCBiZWZvcmUgdGhlIHRyYW5zaXRpb24gc3RhcnRzLCB0aGF0IHdlJ3JlIGRvaW5nIGZpbmVcclxuICAgICAqIHByb3BlcnR5IHdpc2UuXHJcbiAgICAgKiBAcGFyYW0gcHJvcHNcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIFRyYW5zaXRpb24ucHJvdG90eXBlLl9wcmVwYXJlVGFyZ2V0Rm9yVHdlZW5pbmcgPSBmdW5jdGlvbihwcm9wcykge1xyXG4gICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eSgnYWxwaGEnKSkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXJnZXQuYWxwaGEgPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZXN0cm95IGhhbmRsZXJcclxuICAgICAqIEBwYXJhbSB0YXJnZXRcclxuICAgICAqL1xyXG4gICAgVHJhbnNpdGlvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgIHRhcmdldC5kZXN0cm95KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3RvcCBoYW5kbGVyXHJcbiAgICAgKi9cclxuICAgIFRyYW5zaXRpb24ucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLl9hY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSB1bmlxdWUgaWRlbnRpZmllciBiYXNlZCBpbiBEYXRlLm5vdygpIHN0YW1wLlxyXG4gICAgICogTm90IHRoYXQgcmVsaWFibGUuXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gX2dldElkZW50aWZpZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIERhdGUubm93KCkudG9TdHJpbmcoMjIpLnN1YnN0cigtNCwgNCk7XHJcbiAgICB9XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUcmFuc2l0aW9uO1xyXG59KCkpO1xyXG4iXX0=
