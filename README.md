State Transition Plugin for Phaser
=======================
[![npm version](https://badge.fury.io/js/phaser-state-transition.svg)](https://badge.fury.io/js/phaser-state-transition)

## About
This plugin allows a [juicier](https://www.youtube.com/watch?v=Fy0aCDmgnxg) transition between states. A snapshot is taken of the current state, next state begins, an 'out' transition runs, another snapshot and 'in' transition occurs. Transitions occur through tweening.

## Installation

1. Download the `dist/phaser-state-transition.min.js` file directly
2. Or run `npm install phaser-state-transition --save`. This will download the file from the [NPM repo](https://www.npmjs.com/package/phaser-state-transition) and add a dependency to your package.json.

Now you need to import/require the package in one of your game states, Boot or Preload is recommended. If you got the file from NPM you can simply import directly `import 'phaser-state-transition';`, but if you download it directly you will need to provide a relative path (eg `import '../plugins/phaser-state-transition';`)

## Usage

The plugin overrides the default state creation, so you're automatically using it. However, parameters are re-arranged from Phaser's [default state creation](http://phaser.io/docs/2.6.2/Phaser.StateManager.html#start) to include transitions as well:

```javascript

game.state.start('playState', [outTransition],[inTranstion], clearWorld, clearCache, parameters);
```

###Examples

```javascript
//Change the state to 'Game':

//Use default transitions
this.game.state.start('Game', Phaser.Plugin.StateTransition.Out.SlideTop, Phaser.Plugin.StateTransition.In.SlideTop );

//Use only a default In transition
this.game.state.start('Game', null, Phaser.Plugin.StateTransition.In.SlideRight );

//Use a custom Out transition
this.game.state.start('Game',
{
 ease: Phaser.Easing.Exponential.InOut,
 duration: 3e3, // 3 seconds
 intro: true,
 props: {
   y: function(game) { //final y position of snapshot
     return game.height;
   }
 }
} );
```

There are a number of default outTransition and inTranstion parameters you can use, run

```javascript
console.log(Phaser.Plugin.StateTransition.Out);
console.log(Phaser.Plugin.StateTransition.In);
```

to see them.



## Feedback
If there's something you think it could be improved let me know, or create a pr.

To build your own, first download & modify the source and then run `grunt` or `grunt uglify` to output a single plugin file.
