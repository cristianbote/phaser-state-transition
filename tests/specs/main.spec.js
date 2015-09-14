(function() {
    "use strict";

    var StateTransition = Phaser.Plugin.StateTransition,
        assert = chai.assert;

    describe('Phaser State Transition Class', function() {

        it('should have proper API', function() {
            console.log('-----');
            console.log('StateTransition', StateTransition);
            console.log('-----');
            assert.isDefined(StateTransition);
        });

    });

});