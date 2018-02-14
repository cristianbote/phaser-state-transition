import { stateManagerStart } from "./core/state-manager-start";

const cachedStart = Phaser.StateManager.prototype.start;
Phaser.StateManager.prototype.start = function start(stateId, slideInOption, slideOut, ...args) {
    stateManagerStart.call(this, stateId, slideInOption, slideOut);
    cachedStart.call(this, stateId, ...args);
};

/**
 * Creates a transition object
 * @param options
 * @returns {{ease: *, duration: number, intro: boolean, props: {}}}
 */
export const createTransition = (options) => {
    return {
        ease: options.ease || Phaser.Easing.Exponential.InOut,
        duration: options.duration || 500,
        intro: options.intro || false,
        props: options.props || {}
    }
};

export default class StateTransition extends Phaser.Plugin {}

// Expose the createTransition function
StateTransition.createTransition = createTransition;