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
        this._texture = game.add.renderTexture(game.width, game.height);
        this._texture.renderXY(this._graphicFill, 0, 0);

        // After this is rendered to the texture, remove it
        game.stage.removeChild(this._graphicFill);

        //If you try to renderXY() on game.world, game.world will get messed up big time. Then groups and sprites will render incorrectly
        //INSTEAD, iterate over all children in game.world, and render their images to this._texture
        game.world.children.forEach(
          function(element){
            this._texture.renderXY(element, element.x, element.y);
          }.bind(this)
        );

        // Get the image
        Phaser.Image.call(this, game, x || 0, y || 0, this._texture);

        // Capture all input events
        this.inputEnabled = true;
    }

    ContentSnapshot.prototype = Object.create(Phaser.Image.prototype);
    ContentSnapshot.constructor = ContentSnapshot;

    module.exports = ContentSnapshot;
}());
