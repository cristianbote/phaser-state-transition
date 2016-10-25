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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29yZS9Db250ZW50U25hcHNob3QuanMiLCJzcmMvY29yZS9TbGlkZS5qcyIsInNyYy9jb3JlL1N0YXRlTWFuYWdlclN0YXJ0LmpzIiwic3JjL2NvcmUvU3RhdGVUcmFuc2l0aW9uLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL3RyYW5zaXRpb24vRGVmYXVsdFRyYW5zaXRpb24uanMiLCJzcmMvdHJhbnNpdGlvbi9UcmFuc2l0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBQSEFTRVJfTEVHQUNZID0gJzIuNC44JztcblxuICAgIC8qKlxuICAgICAqIENvbnRlbnQgU25hcHNob3QgQ2xhc3NcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKiBAbmFtZSBDb250ZW50U25hcHNob3RcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZ2FtZSBHYW1lIG9iamVjdCBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IE9mZnNldCBvZiB4XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHkgT2Zmc2V0IG9mIHlcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG5vU3RhZ2UgRmxhZyBkbyBza2lwIHJlbmRlcmluZyB0aGUgc3RhZ2UgZm9yIHNsaWRlclxuICAgICAqIEBleHRlbmQgUGhhc2VyLkltYWdlXG4gICAgICovXG4gICAgZnVuY3Rpb24gQ29udGVudFNuYXBzaG90KGdhbWUsIHgsIHksIG5vU3RhZ2UpIHtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGdhbWUgdGV4dHVyZVxuICAgICAgICB0aGlzLl90ZXh0dXJlID0gbmV3IFBoYXNlci5SZW5kZXJUZXh0dXJlKGdhbWUsIGdhbWUud2lkdGgsIGdhbWUuaGVpZ2h0KTtcblxuICAgICAgICBpZiAoIW5vU3RhZ2UpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgZ2FtZSBiYWNrZ3JvdW5kIGZpbGxcbiAgICAgICAgICAgIHRoaXMuX2dyYXBoaWNGaWxsID0gbmV3IFBoYXNlci5HcmFwaGljcyhnYW1lLCAwLCAwKTtcbiAgICAgICAgICAgIHRoaXMuX2dyYXBoaWNGaWxsLmJlZ2luRmlsbChnYW1lLnN0YWdlLmJhY2tncm91bmRDb2xvcik7XG4gICAgICAgICAgICB0aGlzLl9ncmFwaGljRmlsbC5kcmF3UmVjdCgwLCAwLCBnYW1lLndpZHRoLCBnYW1lLmhlaWdodCk7XG4gICAgICAgICAgICB0aGlzLl9ncmFwaGljRmlsbC5lbmRGaWxsKCk7XG5cbiAgICAgICAgICAgIC8vIEFkZCB0aGUgZ3JhcGhpY0ZpbGwgb2JqZWN0IHRlbXBvcmFyeSB0byB0aGUgc3RhZ2UgYXQgdGhlIGJhc2VcbiAgICAgICAgICAgIGdhbWUuc3RhZ2UuYWRkQ2hpbGRBdCh0aGlzLl9ncmFwaGljRmlsbCwgMCk7XG4gICAgICAgICAgICB0aGlzLl90ZXh0dXJlLnJlbmRlclhZKHRoaXMuX2dyYXBoaWNGaWxsLCAwLCAwKTtcbiAgICAgICAgICAgIC8vIEFmdGVyIHRoaXMgaXMgcmVuZGVyZWQgdG8gdGhlIHRleHR1cmUsIHJlbW92ZSBpdFxuICAgICAgICAgICAgZ2FtZS5zdGFnZS5yZW1vdmVDaGlsZCh0aGlzLl9ncmFwaGljRmlsbCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZnRlciAyLjQuOCAoMCwwKSBpdCdzIGJhc2ljYWxseSBtaWRkbGVcbiAgICAgICAgaWYgKFBoYXNlci5WRVJTSU9OID4gUEhBU0VSX0xFR0FDWSkge1xuICAgICAgICAgICAgdGhpcy5fdGV4dHVyZS5yZW5kZXJYWShnYW1lLndvcmxkLCBnYW1lLmNhbWVyYS5wb3NpdGlvbi54ICogLTEsIGdhbWUuY2FtZXJhLnBvc2l0aW9uLnkgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl90ZXh0dXJlLnJlbmRlclhZKGdhbWUud29ybGQsIGdhbWUud2lkdGggLyAyIC0gZ2FtZS5jYW1lcmEucG9zaXRpb24ueCwgZ2FtZS5oZWlnaHQgLyAyIC0gZ2FtZS5jYW1lcmEucG9zaXRpb24ueSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgdGhlIGltYWdlXG4gICAgICAgIFBoYXNlci5JbWFnZS5jYWxsKHRoaXMsIGdhbWUsIHggfHwgMCwgeSB8fCAwLCB0aGlzLl90ZXh0dXJlKTtcblxuICAgICAgICAvLyBDYXB0dXJlIGFsbCBpbnB1dCBldmVudHNcbiAgICAgICAgdGhpcy5pbnB1dEVuYWJsZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIENvbnRlbnRTbmFwc2hvdC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5JbWFnZS5wcm90b3R5cGUpO1xuICAgIENvbnRlbnRTbmFwc2hvdC5jb25zdHJ1Y3RvciA9IENvbnRlbnRTbmFwc2hvdDtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gQ29udGVudFNuYXBzaG90O1xufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBUcmFuc2l0aW9uID0gcmVxdWlyZSgnLi4vdHJhbnNpdGlvbi9UcmFuc2l0aW9uJyksXG4gICAgICAgIENvbnRlbnRTbmFwc2hvdCA9IHJlcXVpcmUoJy4vQ29udGVudFNuYXBzaG90Jyk7XG5cbiAgICAvKipcbiAgICAgKiBTbGlkZSBDbGFzc1xuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqIEBuYW1lIFNsaWRlXG4gICAgICogQHZlcnNpb24gMC4xLjBcbiAgICAgKiBAYXV0aG9yIENyaXN0aWFuIEJvdGUgPG1lQGNyaXN0aWFuYm90ZS5ybz5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZ2FtZSBQaGFzZXIuR2FtZSBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbm9TdGFnZSBObyBzdGFnZSBmbGFnXG4gICAgICovXG4gICAgZnVuY3Rpb24gU2xpZGUoZ2FtZSwgbm9TdGFnZSkge1xuICAgICAgICB0aGlzLmdhbWUgPSBnYW1lO1xuICAgICAgICB0aGlzLl9jb250ZW50U25hcHNob3QgPSBuZXcgQ29udGVudFNuYXBzaG90KGdhbWUsIDAsIDAsIG5vU3RhZ2UpO1xuICAgICAgICB0aGlzLl90cmFuc2l0aW9uID0gbmV3IFRyYW5zaXRpb24oZ2FtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgc2xpZGluZ1xuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbmFtZSBnb1xuICAgICAqIEB2ZXJzaW9uIDAuMS4wXG4gICAgICogQGF1dGhvciBDcmlzdGlhbiBCb3RlIDxtZUBjcmlzdGlhbmJvdGUucm8+XG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgVHJhbnNpdGlvbiBvcHRpb25zXG4gICAgICovXG4gICAgU2xpZGUucHJvdG90eXBlLmdvID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLmdhbWUuc3RhZ2UuYWRkQ2hpbGRBdCh0aGlzLl9jb250ZW50U25hcHNob3QsIHRoaXMuZ2FtZS5zdGFnZS5jaGlsZHJlbi5sZW5ndGgpO1xuICAgICAgICB0aGlzLl90cmFuc2l0aW9uLnN0YXJ0KHRoaXMuX2NvbnRlbnRTbmFwc2hvdCwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gU2xpZGU7XG59KCkpO1xuIiwiLypnbG9iYWxcbiAgICBQaGFzZXI6IHRydWVcbiAgICB3aW5kb3c6IHRydWVcbiovXG5cbihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBTdGF0ZU1hbmFnZXJDYWNoZWRTdGFydCA9IFBoYXNlci5TdGF0ZU1hbmFnZXIucHJvdG90eXBlLnN0YXJ0LFxuICAgICAgICBTbGlkZSA9IHJlcXVpcmUoJy4vU2xpZGUnKSxcbiAgICAgICAgQ29udGVudFNuYXBzaG90ID0gcmVxdWlyZSgnLi9Db250ZW50U25hcHNob3QnKTtcblxuICAgIGZ1bmN0aW9uIGNsZWFudXAoY2hpbGRyZW4pIHtcbiAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgbCA9IGNoaWxkcmVuLmxlbmd0aDtcblxuICAgICAgICBmb3IoOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpZiAoY2hpbGRyZW5baV0gJiYgKGNoaWxkcmVuW2ldIGluc3RhbmNlb2YgQ29udGVudFNuYXBzaG90KSkge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuW2ldLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIFN0YXRlTWFuYWdlclN0YXJ0KHN0YXRlSWQsIHNsaWRlT3V0T3B0aW9ucywgc2xpZGVJbk9wdGlvbnMpIHtcbiAgICAgICAgdmFyIF9zbGlkZSxcbiAgICAgICAgICAgIF9pbnRyb1NsaWRlLFxuICAgICAgICAgICAgX3N0YXRlTWFuYWdlciA9IHRoaXMsXG4gICAgICAgICAgICBfc3RhdGUgPSBfc3RhdGVNYW5hZ2VyLnN0YXRlc1tzdGF0ZUlkXSxcbiAgICAgICAgICAgIF9hcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgICAgX2NhY2hlZFN0YXRlQ3JlYXRlID0gX3N0YXRlLmNyZWF0ZTtcblxuICAgICAgICBfc3RhdGVNYW5hZ2VyLmdhbWUuc3RhZ2UgJiYgY2xlYW51cChfc3RhdGVNYW5hZ2VyLmdhbWUuc3RhZ2UuY2hpbGRyZW4pO1xuXG4gICAgICAgIGlmIChfc3RhdGVNYW5hZ2VyLmdhbWUuaXNCb290ZWQgJiYgc2xpZGVPdXRPcHRpb25zKSB7XG4gICAgICAgICAgICBfc2xpZGUgPSBuZXcgU2xpZGUodGhpcy5nYW1lLCBzbGlkZU91dE9wdGlvbnMubm9TdGFnZSk7XG5cbiAgICAgICAgICAgIChmdW5jdGlvbiAoX3N0YXRlLCBzbGlkZU91dE9wdGlvbnMsIHNsaWRlSW5PcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgX3N0YXRlLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgX2NhY2hlZFN0YXRlQ3JlYXRlLmNhbGwodGhpcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU2xpZGUgaW4gaW50cm9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNsaWRlSW5PcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW50cm9TbGlkZSA9IG5ldyBTbGlkZShfc3RhdGVNYW5hZ2VyLmdhbWUsIHNsaWRlSW5PcHRpb25zLm5vU3RhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3N0YXRlTWFuYWdlci5fY3JlYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgX2ludHJvU2xpZGUuZ28oc2xpZGVJbk9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBfaW50cm9TbGlkZS5fdHJhbnNpdGlvbi5vbkNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9zdGF0ZU1hbmFnZXIuX2NyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFudXAoX3N0YXRlTWFuYWdlci5nYW1lLnN0YWdlLmNoaWxkcmVuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBfc2xpZGUuZ28oc2xpZGVPdXRPcHRpb25zKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBQdXQgdGhlIG9yaWdpbmFsIGNyZWF0ZSBiYWNrXG4gICAgICAgICAgICAgICAgICAgIF9zdGF0ZS5jcmVhdGUgPSBfY2FjaGVkU3RhdGVDcmVhdGU7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0oX3N0YXRlLCBzbGlkZU91dE9wdGlvbnMsIHNsaWRlSW5PcHRpb25zKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdGFydCB0aGUgY2FjaGVkIHN0YXRlIHdpdGggdGhlIHBhcmFtcyBmb3IgaXRcbiAgICAgICAgU3RhdGVNYW5hZ2VyQ2FjaGVkU3RhcnQuYXBwbHkodGhpcywgW3N0YXRlSWRdLmNvbmNhdChfYXJncy5zbGljZSgzKSkpO1xuICAgIH1cblxuICAgIG1vZHVsZS5leHBvcnRzID0gU3RhdGVNYW5hZ2VyU3RhcnQ7XG59KCkpO1xuIiwiLypnbG9iYWxcbiBQaGFzZXI6IHRydWVcbiB3aW5kb3c6IHRydWVcbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgRGVmYXVsdFRyYW5zaXRpb24gPSByZXF1aXJlKCcuLi90cmFuc2l0aW9uL0RlZmF1bHRUcmFuc2l0aW9uJyk7XG5cbiAgICAvKipcbiAgICAgKiBQaGFzZXIgU3RhdGUgUGx1Z2luIENsYXNzXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQHZlcnNpb24gMC4xLjBcbiAgICAgKiBAYXV0aG9yIENyaXN0aWFuIEJvdGUgPG1lQGNyaXN0aWFuYm90ZS5ybz5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZ2FtZSBQaGFzZXIuR2FtZSBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJlbnQgUGFyZW50IGVsZW1lbnRcbiAgICAgKiBAZXh0ZW5kIHtQaGFzZXIuUGx1Z2lufVxuICAgICAqIEBleGFtcGxlOiA8Y2FwdGlvbj5Vc2FnZTwvY2FwdGlvbj5cbiAgICAgKiB2YXIgcGx1Z2luID0gdGhpcy5nYW1lLnBsdWdpbnMuYWRkKFBoYXNlci5QbHVnaW5nLlN0YXRlVHJhbnNpdGlvbik7XG4gICAgICovXG4gICAgZnVuY3Rpb24gU3RhdGVUcmFuc2l0aW9uKGdhbWUsIHBhcmVudCkge1xuICAgICAgICBQaGFzZXIuUGx1Z2luLmNhbGwodGhpcywgZ2FtZSwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBTdGF0ZVRyYW5zaXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuUGx1Z2luLnByb3RvdHlwZSk7XG4gICAgU3RhdGVUcmFuc2l0aW9uLmNvbnN0cnVjdG9yID0gU3RhdGVUcmFuc2l0aW9uO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGN1c3RvbSB0cmFuc2l0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgVHJhbnNpdGlvbiBvYmplY3RcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmludHJvXSBJcyB0aGlzIGEgaW50cm9kdWN0aW9uIHRyYW5zaXRpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdHxmdW5jdGlvbn0gb3B0aW9ucy5wcm9wcyBQcm9wZXJ0aWVzIHRvIHRyYW5zaXRpb24gdG9cbiAgICAgKi9cbiAgICBTdGF0ZVRyYW5zaXRpb24uY3JlYXRlVHJhbnNpdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIERlZmF1bHRUcmFuc2l0aW9uKG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbnRybyB0cmFuc2l0aW9uIGxpc3RcbiAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAqL1xuICAgIFN0YXRlVHJhbnNpdGlvbi5JbiA9IHtcblxuICAgICAgICBTbGlkZUxlZnQ6IERlZmF1bHRUcmFuc2l0aW9uKHtcbiAgICAgICAgICAgIGludHJvOiB0cnVlLFxuICAgICAgICAgICAgcHJvcHM6IHtcbiAgICAgICAgICAgICAgICB4OiBmdW5jdGlvbihnYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnYW1lLndpZHRoXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSxcblxuICAgICAgICBTbGlkZVJpZ2h0OiBEZWZhdWx0VHJhbnNpdGlvbih7XG4gICAgICAgICAgICBpbnRybzogdHJ1ZSxcbiAgICAgICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZ2FtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLWdhbWUud2lkdGhcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLFxuXG4gICAgICAgIFNsaWRlVG9wOiBEZWZhdWx0VHJhbnNpdGlvbih7XG4gICAgICAgICAgICBpbnRybzogdHJ1ZSxcbiAgICAgICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZ2FtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2FtZS5oZWlnaHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLFxuXG4gICAgICAgIFNsaWRlQm90dG9tOiBEZWZhdWx0VHJhbnNpdGlvbih7XG4gICAgICAgICAgICBpbnRybzogdHJ1ZSxcbiAgICAgICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZ2FtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLWdhbWUuaGVpZ2h0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSxcblxuICAgICAgICBTY2FsZVVwOiBEZWZhdWx0VHJhbnNpdGlvbih7XG4gICAgICAgICAgICBpbnRybzogdHJ1ZSxcbiAgICAgICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICAgICAgYWxwaGE6IDAuNCxcbiAgICAgICAgICAgICAgICBzY2FsZTogbmV3IFBoYXNlci5Qb2ludCh7XG4gICAgICAgICAgICAgICAgICAgIHg6IDJcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBFeGl0IHRyYW5zaXRpb24gbGlzdFxuICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICovXG4gICAgU3RhdGVUcmFuc2l0aW9uLk91dCA9IHtcblxuICAgICAgICBTbGlkZUxlZnQ6IERlZmF1bHRUcmFuc2l0aW9uKHtcbiAgICAgICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZ2FtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLWdhbWUud2lkdGhcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLFxuXG4gICAgICAgIFNsaWRlUmlnaHQ6IERlZmF1bHRUcmFuc2l0aW9uKHtcbiAgICAgICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICAgICAgeDogZnVuY3Rpb24oZ2FtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2FtZS53aWR0aFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG5cbiAgICAgICAgU2xpZGVUb3A6IERlZmF1bHRUcmFuc2l0aW9uKHtcbiAgICAgICAgICAgIHByb3BzOiB7XG4gICAgICAgICAgICAgICAgeTogZnVuY3Rpb24oZ2FtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLWdhbWUuaGVpZ2h0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSxcblxuICAgICAgICBTbGlkZUJvdHRvbTogRGVmYXVsdFRyYW5zaXRpb24oe1xuICAgICAgICAgICAgcHJvcHM6IGZ1bmN0aW9uKGdhbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB5OiBnYW1lLmhlaWdodFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG5cbiAgICAgICAgU2NhbGVVcDogRGVmYXVsdFRyYW5zaXRpb24oe1xuICAgICAgICAgICAgcHJvcHM6IHtcbiAgICAgICAgICAgICAgICB4OiBmdW5jdGlvbihnYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnYW1lLndpZHRoIC8gMlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2NhbGU6IHtcbiAgICAgICAgICAgICAgICAgICAgeDogMFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBTdGF0ZVRyYW5zaXRpb247XG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgU2xpZGUgPSByZXF1aXJlKCcuL2NvcmUvU2xpZGUnKSxcblx0XHRTdGF0ZU1hbmFnZXJTdGFydCA9IHJlcXVpcmUoJy4vY29yZS9TdGF0ZU1hbmFnZXJTdGFydCcpLFxuXHRcdERlZmF1bHRUcmFuc2l0aW9uID0gcmVxdWlyZSgnLi90cmFuc2l0aW9uL0RlZmF1bHRUcmFuc2l0aW9uJyk7XG5cblxuICAgIC8vIERlZmluZSB0aGUgUGx1Z2luIENsYXNzXG5cdFBoYXNlci5QbHVnaW4uU3RhdGVUcmFuc2l0aW9uID0gcmVxdWlyZSgnLi9jb3JlL1N0YXRlVHJhbnNpdGlvbicpO1xuXG5cdC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IHN0YXRlLnN0YXJ0XG5cdFBoYXNlci5TdGF0ZU1hbmFnZXIucHJvdG90eXBlLnN0YXJ0ID0gU3RhdGVNYW5hZ2VyU3RhcnQ7XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBQaGFzZXIuUGx1Z2luLlN0YXRlVHJhbnNpdGlvbjtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKXtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZWFzZTogb3B0aW9ucy5lYXNlIHx8IFBoYXNlci5FYXNpbmcuRXhwb25lbnRpYWwuSW5PdXQsXG4gICAgICAgICAgICBkdXJhdGlvbjogb3B0aW9ucy5kdXJhdGlvbiB8fCA1MDAsXG4gICAgICAgICAgICBpbnRybzogb3B0aW9ucy5pbnRybyB8fCBmYWxzZSxcbiAgICAgICAgICAgIHByb3BzOiBvcHRpb25zLnByb3BzIHx8IHt9XG4gICAgICAgIH1cbiAgICB9O1xufSgpKTtcbiIsIihmdW5jdGlvbigpe1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIHJhZiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG5cbiAgICAvKipcbiAgICAgKiBUcmFuc2l0aW9uIENsYXNzXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQG5hbWUgVHJhbnNpdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBnYW1lIEdhbWUgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBUcmFuc2l0aW9uKGdhbWUpIHtcbiAgICAgICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgICAgICAgdGhpcy5vbkNvbXBsZXRlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fdHdlZW5zID0gW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgdGhlIHRyYW5zaXRpb24gd2l0aCBhIGdpdmVuIHRhcmdldCBhbmQgb3B0aW9uc1xuICAgICAqIEBuYW1lIHN0YXJ0XG4gICAgICogQHBhcmFtIHRhcmdldFxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICovXG4gICAgVHJhbnNpdGlvbi5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbih0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHByb3AsXG4gICAgICAgICAgICBfcHJvcHMgPSBvcHRpb25zLnByb3BzLFxuICAgICAgICAgICAgX2lzSW50cm8gPSAhIW9wdGlvbnMuaW50cm8sXG4gICAgICAgICAgICBfdHdlZW5UYXJnZXQsXG4gICAgICAgICAgICBfdHdlZW5JbnN0YW5jZSxcbiAgICAgICAgICAgIF9xdWV1ZSA9IHtcbiAgICAgICAgICAgICAgICAnXyc6IHt9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIC8vIFN0b3JlIHRoZSBjdXJyZW50VGFyZ2V0XG4gICAgICAgIHRoaXMuY3VycmVudFRhcmdldCA9IHRhcmdldDtcblxuICAgICAgICAvLyBJZiB3ZSBuZWVkIHRvIGNvbXBpbGUgdGhlIG91dHB1dFxuICAgICAgICBpZiAodHlwZW9mIF9wcm9wcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgX3Byb3BzID0gX3Byb3BzKHRoaXMuZ2FtZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIHByb3BlciB2YWx1ZXMgZm9yIHByb3BzIGFyZSB0aGVyZVxuICAgICAgICBfaXNJbnRybyAmJiB0aGlzLl9wcmVwYXJlVGFyZ2V0Rm9yVHdlZW5pbmcoX3Byb3BzKTtcblxuICAgICAgICAvLyBQYXJzZSB0aGUgb3B0aW9ucy5wcm9wcyBhbmQgZ2VuZXJhdGUgdGhlIHR3ZWVucyBvcHRpb25zXG4gICAgICAgIGZvciAocHJvcCBpbiBfcHJvcHMpIHtcbiAgICAgICAgICAgIGlmIChfcHJvcHMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB3ZSBuZWVkIHRvIGNvbXBpbGUgdGhlIG91dHB1dFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgX3Byb3BzW3Byb3BdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIF9wcm9wc1twcm9wXSA9IF9wcm9wc1twcm9wXSh0aGlzLmdhbWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBvcmlnaW5hbCB2YWx1ZSBpcyBhbiBvYmplY3RcbiAgICAgICAgICAgICAgICAvLyB3ZSBuZWVkIGEgc2VwYXJhdGUgdHdlZW5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRhcmdldFtwcm9wXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgX3F1ZXVlW3Byb3BdID0gX3Byb3BzW3Byb3BdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF9xdWV1ZVsnXyddW3Byb3BdID0gX3Byb3BzW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAocHJvcCBpbiBfcXVldWUpIHtcbiAgICAgICAgICAgIGlmIChfcXVldWUuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgICAgICBfdHdlZW5UYXJnZXQgPSBwcm9wID09PSAnXycgPyB0YXJnZXQgOiB0YXJnZXRbcHJvcF07XG5cbiAgICAgICAgICAgICAgICB0aGlzLl90d2VlbnMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lLmFkZC50d2VlbihfdHdlZW5UYXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICBbX2lzSW50cm8gPyAnZnJvbScgOiAndG8nXShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcXVldWVbcHJvcF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5kdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmVhc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmRlbGF5XG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIF90d2Vlbkluc3RhbmNlID0gdGhpcy5fdHdlZW5zW3RoaXMuX3R3ZWVucy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICBfdHdlZW5JbnN0YW5jZS5vbkNvbXBsZXRlLmFkZE9uY2UodGhpcy5fY2hlY2tGb3JDb21wbGV0ZSwgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVmVyaWZ5IGNvbXBsZXRlIHN0YXRlIGZvciB0cmFuc2l0aW9uXG4gICAgICogQHBhcmFtIHRhcmdldFxuICAgICAqIEBwYXJhbSB0d2VlblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgVHJhbnNpdGlvbi5wcm90b3R5cGUuX2NoZWNrRm9yQ29tcGxldGUgPSBmdW5jdGlvbih0YXJnZXQsIHR3ZWVuKSB7XG4gICAgICAgIHZhciBpID0gMCxcbiAgICAgICAgICAgIGwgPSB0aGlzLl90d2VlbnMubGVuZ3RoLFxuICAgICAgICAgICAgX2N1cnJlbnRUd2VlbixcbiAgICAgICAgICAgIGNvbXBsZXRlZCA9IDA7XG5cbiAgICAgICAgZm9yKDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgX2N1cnJlbnRUd2VlbiA9IHRoaXMuX3R3ZWVuc1tpXTtcbiAgICAgICAgICAgIGlmIChfY3VycmVudFR3ZWVuLmlzUnVubmluZyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBjb21wbGV0ZWQrKztcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWUudHdlZW5zLnJlbW92ZSh0d2Vlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29tcGxldGVkID09PSBsKSB7XG4gICAgICAgICAgICB0aGlzLm9uQ29tcGxldGUgJiYgdGhpcy5vbkNvbXBsZXRlKCk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXJnZXQuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIHN1cmUsIGJlZm9yZSB0aGUgdHJhbnNpdGlvbiBzdGFydHMsIHRoYXQgd2UncmUgZG9pbmcgZmluZVxuICAgICAqIHByb3BlcnR5IHdpc2UuXG4gICAgICogQHBhcmFtIHByb3BzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBUcmFuc2l0aW9uLnByb3RvdHlwZS5fcHJlcGFyZVRhcmdldEZvclR3ZWVuaW5nID0gZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KCdhbHBoYScpKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRUYXJnZXQuYWxwaGEgPSAwO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERlc3Ryb3kgaGFuZGxlclxuICAgICAqIEBwYXJhbSB0YXJnZXRcbiAgICAgKi9cbiAgICBUcmFuc2l0aW9uLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgIHRhcmdldC5kZXN0cm95KCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFN0b3AgaGFuZGxlclxuICAgICAqL1xuICAgIFRyYW5zaXRpb24ucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB1bmlxdWUgaWRlbnRpZmllciBiYXNlZCBpbiBEYXRlLm5vdygpIHN0YW1wLlxuICAgICAqIE5vdCB0aGF0IHJlbGlhYmxlLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfZ2V0SWRlbnRpZmllcigpIHtcbiAgICAgICAgcmV0dXJuIERhdGUubm93KCkudG9TdHJpbmcoMjIpLnN1YnN0cigtNCwgNCk7XG4gICAgfVxuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUcmFuc2l0aW9uO1xufSgpKTtcbiJdfQ==
