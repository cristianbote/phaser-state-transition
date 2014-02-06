State Transition Plugin for Phaser
=======================

Plugin for phaser.js(http://phaser.io/) v 1.1.4

## About
Currently the switch between states is really static and a game should be able to transition between states. Therefore, this plugin does exactly that: draws the `game.world` into a `renderTexture` which is rendered on a `sprite`, and finally it's tweening that sprite.
source: `src/phaser-state-transition.js`
build(minified): `build/phaser-state-transition.min.js`

## Usage
Take a look inside `demo` folder. It's pretty straight forward. The easiest way is to add the plugin into your game, keep a reference to it, and call:

````
//add the plugin
var transitionPlugin = game.plugins.add(Phaser.Plugin.StateTransition);

//define new properties to be tweened, duration, even ease
transitionPlugin.settings({

	//how long the animation should take
	duration: 1000,

	//ease property
	ease: Phaser.Easing.Exponential.InOut, /* default ease */

	//what property should be tweened
	properties: {
		alpha: 0,
		scale: {
			x: 1.5,
			y: 1.5
		}
	}
});

//and later on
transitionPlugin.to("yourStateName");
````

## Feedback
If there's something you think it could be improved let me know, or create a pr.