/**
  * Phaser State Transition Plugin
  * It adds a little more liveliness to your state changes

	The MIT License (MIT)

	Copyright (c) 2014 Cristian Bote

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

	Contact: https://github.com/cristianbote, @cristianbote_

  */

(function(window, Phaser) {
	/**
	  * StateTranistion Plugin for Phaser
	  */
	Phaser.Plugin.StateTransition = function (game, parent) {
		/* Extend the plugin */
		Phaser.Plugin.call(this, game, parent);
	};

	//Extends the Phaser.Plugin template, setting up values we need
	Phaser.Plugin.StateTransition.prototype = Object.create(Phaser.Plugin.prototype);
	Phaser.Plugin.StateTransition.prototype.constructor = Phaser.Plugin.StateTransition;

	/**
	  * Calls the _draw method which handles the state changes and transitions
	  */
	Phaser.Plugin.StateTransition.prototype.to = function (state, callback) {
		_draw.call(this, state);
	};

	/** 
	  * Can be called in the create function of states that you transition to, to ensure
	  * that the transition-sprite is on top of everything
	  */
	Phaser.Plugin.StateTransition.prototype.bringToTop = function () {
		_bringCoverToTop.call(this);
	}

	Phaser.Plugin.StateTransition.prototype.settings = function (opt) {
		if (opt) {
			for(var p in opt) {
				if (settings[p]) {
					settings[p] = opt[p];
				}
			}
		} else {
			return Object.create(settings);
		}
	};

	/* Settings object */
	var settings = {
		duration: 300, /* ms */
		ease: Phaser.Easing.Exponential.InOut,
		properties: {
			alpha: 0
		}
	};

	/* Move the Texture-Sprite to the top */
	function _bringCoverToTop() {
		if (this._cover) {
			this._cover.bringToTop();
		}
	}

	/* Draw the world state */
	function _draw(state) {

		/* Pause the game at first */
		this.game.paused = true;

		/* If there's a sprite there, destroy it */
		if (this._cover) {
			this._cover.destroy();
		}

		/* If there's no texture create one */
		if (!this._texture) {
			this._texture = new Phaser.RenderTexture(this.game, this.game.width, this.game.height, 'cover');
		}
		/* Draw the current world to the render */
		this._texture.renderXY(this.game.stage, -this.game.camera.x, -this.game.camera.y);

		/* If there's a state as a paramterer change the state and do the dew */
		if (state) {

			var _create = this.game.state.states[state]['create'], _this = this;

			this._cover = new Phaser.Sprite(this.game, 0, 0, this._texture);
			this._cover.fixedToCamera = true;
			this._cover.anchor.setTo(0.5,0.5);

			/* Instead of x/y we need to set the cameraOffset point */
			this._cover.cameraOffset.x = this.game.width / 2;
			this._cover.cameraOffset.y = this.game.height / 2;

			this.game.state.states[state]['create'] = function() {
				_create.call(_this.game.state.states[state]);

				_this.game.add.existing(_this._cover);

				_animateCover.call(_this);
			}

			this.game.state.start(state);
		}

		/* Resume the game */
		this.game.paused = false;
	}

	function _animateCover() {
		/* Animate */
		if (settings && settings.properties) {
			for (var p in settings.properties) {
				if (typeof settings.properties[p] !== "object") {
					var _dummy = {};
					_dummy[p] = settings.properties[p];
					this._tween = this.game.add
						.tween(this._cover)
						.to(_dummy,
							settings.duration,
							settings.ease, true);
				} else {
					this._tween = this.game.add
						.tween(this._cover[p])
						.to(settings.properties[p],
							settings.duration,
							settings.ease, true);
				}
			}

			this._tween.onComplete.addOnce(_destroy, this);
		}
	}

	/* Destroy all the data */
	function _destroy() {
		this._cover&&this._cover.destroy();
		this._cover = null;
		this._texture&&this._texture.destroy();
		this._texture = null;
	}

}(window, Phaser));