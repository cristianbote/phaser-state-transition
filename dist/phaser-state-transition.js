(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
	"use strict";

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

        // Create the game texture
		this._texture = new Phaser.RenderTexture(game, game.width, game.height);
		this._texture.renderXY(this._graphicFill, 0, 0);
		this._texture.renderXY(game.world, game.width / 2 - game.camera.position.x, game.height / 2 - game.camera.position.y);

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
        Slide = require('./Slide');

    function StateManagerStart(stateId, slideOutOptions, slideInOptions) {
        var _slide,
            _introSlide,
            _stateManager = this,
            _state = this.states[stateId],
            _args,
            _cachedStateCreate = _state.create;

        if (this.game.isBooted && slideOutOptions) {
            _slide = new Slide(this.game);

            (function (_state, slideOutOptions, slideInOptions) {
                _state.create = function () {
                    _args = Array.prototype.slice(arguments);
                    _cachedStateCreate.apply(this, _args);

                    // Slide in intro
                    if (slideInOptions) {
                        _introSlide = new Slide(this.game);
                        _stateManager.clearCurrentState();
                        _introSlide.go(slideInOptions);

                        _introSlide._transition.onComplete = function () {
                            _cachedStateCreate.apply(this, _args);
                        }.bind(this);
                    }

                    _slide.go(slideOutOptions);

                    // Put the original create back
                    _state.create = _cachedStateCreate;
                };
            }(_state, slideOutOptions, slideInOptions));
        }

        StateManagerCachedStart.call(this, stateId);
    }

    module.exports = StateManagerStart;
}());

},{"./Slide":2}],4:[function(require,module,exports){
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

},{}]},{},[1,2,3,4,5,6,7]);
