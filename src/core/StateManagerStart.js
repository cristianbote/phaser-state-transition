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
