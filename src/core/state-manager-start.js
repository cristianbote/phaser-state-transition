import { Slide } from "./slide";
import { ContentSnapshot } from "./content-snapshot";

const cleanup = (children) => {
    let i = 0;
    let l = children.length;

    for(; i < l; i += 1) {
        if (children[i] && (children[i] instanceof ContentSnapshot)) {
            children[i].destroy();
        }
    }
};

export function stateManagerStart(stateId, slideOutOptions, slideInOptions) {
    let _slide,
        _introSlide,
        _stateManager = this,
        _state = _stateManager.states[stateId],
        _cachedStateCreate = _state.create;

    _stateManager.game.stage && cleanup(_stateManager.game.stage.children);

    if (_stateManager.game.isBooted && slideOutOptions) {
        _slide = new Slide(_stateManager.game, slideOutOptions.noStage);

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
}
