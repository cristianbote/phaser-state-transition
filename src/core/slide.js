import { Transition } from "../transition/transition";
import { ContentSnapshot } from "./content-snapshot";

export class Slide {

    constructor(game, noStage) {
        this.game = game;
        this._contentSnapshot = new ContentSnapshot(game, 0, 0, noStage);
        this._transition = new Transition(game);
    }

    go(options) {
        this.game.stage.addChildAt(this._contentSnapshot, this.game.stage.children.length);
        this._transition.start(this._contentSnapshot, options);
    }

}
