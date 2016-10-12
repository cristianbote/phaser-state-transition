State Transition Plugin for Phaser
=======================
[![npm version](https://badge.fury.io/js/phaser-state-transition.svg)](https://badge.fury.io/js/phaser-state-transition)

## About
Currently the switch between states is really static and a game should be able to transition between states. Therefore, this plugin does exactly that: draws the `game.world` into a `renderTexture` which is rendered on a `sprite`, and finally it's tweening that sprite.

## Transition Examples
https://codepen.io/cristianbote/full/GjgVxg

## How to use it
You have several options here

### Straight
Just download the `dist/phaser-state-transition.min.js` file and you're done
 
### Npm
Run `npm install phaser-state-transition --save`, and you could reference it later.

## Usage
Since we're talking about v2, there's been some changes. Now, the plugin basically overrides the create state method, so you could keep you're code the same, and just add transition configs where you see fit.

```javascript

game.state.start('playState', [outTransition, [inTransition]], clearWorld, clearCache, parameters);
```

Notice the 2 optional params, that are transition config instances. There are several available by default, you should run this: `console.log(Phaser.Plugin.StateTransition.Out);` and `console.log(Phaser.Plugin.StateTransition.In);`. Obviously you could easily add your own nice transition as well.

## Feedback
If there's something you think it could be improved let me know, or create a pr.
