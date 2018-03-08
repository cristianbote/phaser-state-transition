const PHASER_LEGACY = 248;

const shouldRenderBasedOnCameraPosition = () => {
    const currentVersion = parseInt(Phaser.VERSION.replace(/\./g, ''), 10);
    return currentVersion > PHASER_LEGACY;
};

export class ContentSnapshot extends Phaser.Image {

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
    constructor(game, x, y, noStage) {
        const texture = new Phaser.RenderTexture(game, game.width, game.height);

        super(game, x || 0, y || 0, texture);

        if (!noStage) {
            // Create the game background fill
            const backgroundFill = new Phaser.Graphics(game, 0, 0);
            backgroundFill.beginFill(game.stage.backgroundColor);
            backgroundFill.drawRect(0, 0, game.width, game.height);
            backgroundFill.endFill();

            // Add the graphicFill object temporary to the stage at the base
            game.stage.addChildAt(backgroundFill, 0);
            texture.renderXY(backgroundFill, 0, 0);
            // After this is rendered to the texture, remove it
            game.stage.removeChild(backgroundFill);
        }

        // After 2.4.8 (0,0) it's basically middle
        if (shouldRenderBasedOnCameraPosition()) {
            texture.renderXY(game.world, game.camera.position.x * -1, game.camera.position.y * -1);
        } else {
            texture.renderXY(game.world, game.width / 2 - game.camera.position.x, game.height / 2 - game.camera.position.y);
        }

        // Capture all input events
        this.inputEnabled = true;
    }
}
