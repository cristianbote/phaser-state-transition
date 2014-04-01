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
  
!function(t,e){function i(){this._cover&&this._cover.bringToTop()}function s(t){if(this.game.paused=!0,this._cover&&this._cover.destroy(),this._texture||(this._texture=new e.RenderTexture(this.game,this.game.width,this.game.height,"cover")),this._texture.renderXY(this.game.stage,-this.game.camera.x,-this.game.camera.y),t){var i=this.game.state.states[t].create,s=this;this._cover=new e.Sprite(this.game,0,0,this._texture),this._cover.fixedToCamera=!0,this._cover.anchor.setTo(.5,.5),this._cover.cameraOffset.x=this.game.width/2,this._cover.cameraOffset.y=this.game.height/2,this.game.state.states[t].create=function(){i.call(s.game.state.states[t]),s.game.add.existing(s._cover),r.call(s)},this.game.state.start(t)}this.game.paused=!1}function r(){if(o&&o.properties){for(var t in o.properties)if("object"!=typeof o.properties[t]){var e={};e[t]=o.properties[t],this._tween=this.game.add.tween(this._cover).to(e,o.duration,o.ease,!0)}else this._tween=this.game.add.tween(this._cover[t]).to(o.properties[t],o.duration,o.ease,!0);this._tween.onComplete.addOnce(a,this)}}function a(){this._cover&&this._cover.destroy(),this._cover=null,this._texture&&this._texture.destroy(),this._texture=null}e.Plugin.StateTransition=function(t,i){e.Plugin.call(this,t,i)},e.Plugin.StateTransition.prototype=Object.create(e.Plugin.prototype),e.Plugin.StateTransition.prototype.constructor=e.Plugin.StateTransition,e.Plugin.StateTransition.prototype.to=function(t){s.call(this,t)},e.Plugin.StateTransition.prototype.bringToTop=function(){i.call(this)},e.Plugin.StateTransition.prototype.settings=function(t){if(!t)return Object.create(o);for(var e in t)o[e]&&(o[e]=t[e])};var o={duration:300,ease:e.Easing.Exponential.InOut,properties:{alpha:0}}}(window,Phaser);