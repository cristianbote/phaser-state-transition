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
    function Slide(game, contentSnapshot) {
        this.game = game;
        this._contentSnapshot = contentSnapshot || new ContentSnapshot(game);
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
        this.setOnComplete();
        this._transition.start(this._contentSnapshot, options);
    };

    /**
     * Sliding has finished
     * @method
     * @name setOnComplete
     * @version 2.2.2
     * @author James Lowrey <jtronlabs@gmail.com>
     * @param {function} onCompleteAction Action to complete once the slide has finished
     */
    Slide.prototype.setOnComplete = function(onCompleteAction) {

      this._transition.onComplete = function(){
        this._contentSnapshot.destroy();
        if(onCompleteAction) onCompleteAction();
      }.bind(this);

    };



    module.exports = Slide;
}());
