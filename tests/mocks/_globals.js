function noop(){}
noop.prototype.start = function() {};

window.Phaser = {
    Plugin: noop,
    Image: noop,
    StateManager: noop,
    Point: noop,
    Easing: {
        Exponential: {
            InOut: noop
        }
    }
};