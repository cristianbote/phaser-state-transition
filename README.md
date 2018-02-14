State Transition Plugin for Phaser
=======================
[![npm version](https://badge.fury.io/js/phaser-state-transition.svg)](https://badge.fury.io/js/phaser-state-transition)

## About
Currently the switch between states is really static and a game should be able to transition between states. Therefore, this plugin does exactly that: draws the `game.world` into a `renderTexture` which is rendered on a `sprite`, and finally it's tweening that sprite.

## Transition Examples

![](https://i.imgur.com/Kgzc24u.gif)

https://codepen.io/cristianbote/full/GjgVxg

## How to use it
You have several options here including es6 imports.
 
### Npm

```bash
npm install phaser-state-transition --save
```

And then import it in your project

```js
import "phaser-state-transition";
```

The plugin needs the `Phaser` framework to work, therefore you should make sure that this is included before the plugin's import.

#### Straight but nor recommended
Just download the `dist/phaser-state-transition.umd.js` file and you're done, but this is not the recommended way. You should use it via npm. You have better control on what version you're keeping locally.

## Usage
The easiest way to use it, is by just passing a transition for entering.

```js
import { createTransition } from "phaser-state-transition";

const EnteringTransition = createTransition({
    props: {
        x: game => game.width
    }
});

game.state.start("stateName", EnteringTransition);
```

The transition options to pass in are basically just some instructions for the plugin, to handle the _how_ of the transition. You'll find there are other properties inside, like ease, duration and other properties that are not that important to have nice transitions.

## API

### StateTransitionPlugin
The plugin class. Normally you should not work on this class, but you could extend it if needed. The plugin does not need a class to be working. 

### createTransition(options)
This helper function, generates a transition object to be passed along the `game.state.start` method.

The default duration would be `500ms` and the ease function `Phaser.Easing.Exponential.InOut`

* `@param {object} options` The options to create a transition object
* `@returns {object}` The transition object to be passed along the `game.start.state`


## Feedback
If there's something you think it could be improved let me know, or create a pr.
