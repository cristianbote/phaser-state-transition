/*global
    Phaser: true
    window: true
*/

(function() {
    "use strict";

    var StateManagerCachedStart = Phaser.StateManager.prototype.start,
        Slide = require('./Slide'),
        ContentSnapshot = require('./ContentSnapshot');

    function StateManagerStart(stateId, slideOutOptions, slideInOptions) {
        var _exitSlide,
            _introSlide,
            _exitSnapshot,
            _stateManager = this,
            _state = _stateManager.states[stateId],
            _args = [].slice.call(arguments),
            _cachedStateCreate = _state.create;

        if (_stateManager.game.isBooted && (slideOutOptions || slideInOptions) ) {
            //need to take a snapshot before the next state's create function, otherwise everything on screen will be wiped out and snapshot will be empty
            if(slideOutOptions) _exitSnapshot = new ContentSnapshot(this.game);

            _state.create = function () {
                //create next state. Do this before exit transition so that there is something to transition to (screen will not be empty).
                _cachedStateCreate.call(this);

                //slide out
                if(slideOutOptions){
                    _exitSlide = new Slide(this.game, _exitSnapshot);
                    _exitSlide.go(slideOutOptions);
                }

                // Snapshot and slide in intro
                if (slideInOptions) {
                    _introSlide = new Slide(_stateManager.game);
                    _stateManager._created = false;
                    this.game.world.alpha = 0; //hide world while transitioning
                    _introSlide.go(slideInOptions);

                    _introSlide.setOnComplete(
                        function(){
                          console.log("complete")
                            this.game.world.alpha = 1; //show world again once transition in finishes
                            _stateManager._created = true;
                        }.bind(this)
                    );
                }

                // Put the original create back
                _state.create = _cachedStateCreate;
            };
        }

        // Start the cached state with the params for it
        StateManagerCachedStart.apply(this, [stateId].concat(_args.slice(3)));
    }

    module.exports = StateManagerStart;
}());
