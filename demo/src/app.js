/**
  * Main app file
  */


(function(window, Phaser) {

	
	var size = {width: 640, height: 480}, stage = document.getElementById('stage');

	var game = new Phaser.Game(size.width, size.height, Phaser.AUTO, stage),
		transitions = null;

	/**
	  * Warning: This is NOT the proper way to add states, but because I'm lazy creating another files, this will work for demo purposes
	  */
	game.state.add("preload", function(game) {
		this.game = game;

		/* Preload assets */
		this.preload = function() {
			this.load.image('blue', 'assets/element_blue.png');
			this.load.image('red', 'assets/element_red.png');
			this.load.spritesheet('button', 'assets/button_sprite_sheet.png', 193, 71);
		};

		/* Preload assets */
		this.create = function() {
			/*  */
			transitions = game.plugins.add(Phaser.Plugin.StateTransition);
			transitions.settings({
				duration: 1000,
				properties: {
					alpha: 0,
					scale: {
						x: 1.5,
						y: 1.5
					}
				}
			})

			this.game.state.start("blue");
		};
	}, true);


	game.state.add("blue", function(game) {
		this.game = game;

		/* Preload assets */
		this.create = function() {
			this.tile = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'blue');

			this.game.add.button(96, 96, 'button', function() {
				transitions.to('red');
			}, this, 2, 1, 0);
		};

		this.update = function() {
			this.tile.tilePosition.x -= 1;
		}
	});

	game.state.add("red", function(game) {
		this.game = game;

		/* Preload assets */
		this.create = function() {
			this.tile = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'red');

			this.game.add.button(96 + 200, 96, 'button', function() {
				transitions.to('blue');
			}, this, 2, 1, 0);
		};

		this.update = function() {
			this.tile.tilePosition.y += 1;
		}
	});

}(window, Phaser));