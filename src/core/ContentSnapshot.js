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
