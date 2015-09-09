(function() {
	"use strict";

	var Slide = require('./core/Slide'),
		StateManagerStart = require('./core/StateManagerStart'),
		DefaultTransition = require('./transition/DefaultTransition');


    // Define the Plugin Class
	Phaser.Plugin.StateTransition = require('./core/StateTransition');

	// Override the default state.start
	Phaser.StateManager.prototype.start = StateManagerStart;

	module.exports = Phaser.Plugin.StateTransition;
}());
