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
                    _args = [].slice(arguments);
                    _cachedStateCreate.apply(this, _args);

                    // Slide in intro
                    if (slideInOptions) {
                        _introSlide = new Slide(this.game);
                        _stateManager._created = false;
                        _introSlide.go(slideInOptions);

                        _introSlide._transition.onComplete = function () {
                            _stateManager._created = true;
                        };
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
