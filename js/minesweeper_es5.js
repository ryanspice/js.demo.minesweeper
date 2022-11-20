"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* Config options */

var _OPTIONS_ = {
	difficulty: 0,
	grids: [
	// X, Y, #of mines
	[9, 9, 10], [16, 16, 50], [30, 16, 99]]
};

/* Dedicated to handling the grid/board and its session*/

var MineSweeper = function () {
	function MineSweeper(options) {
		_classCallCheck(this, MineSweeper);

		this.options = options;
		this.animationframe = 0;
		this.timer = document.getElementById("timer");
		this.timewon = document.getElementById("timewon");
		this.remaining = document.getElementById("flagCount");
		this.msgWon = document.getElementById("msgWon");
		this.msgLost = document.getElementById("msgLost");
		this.board = [];
		this.resetGrid();
	}

	/**/

	_createClass(MineSweeper, [{
		key: "resetGrid",
		value: function resetGrid() {

			this.board = [];
			this.list = [[]];
			this.flagCount = 0;
			this.timeValue = 0;
			this.msgWon.hidden = true;
			this.msgLost.hidden = true;

			smileyUnDead();
		}

		/**/

	}, {
		key: "buildGrid",
		value: function buildGrid() {

			this.resetGrid();

			// Fetch grid and clear out old elements.
			var grid = document.getElementById("minefield");
			grid.innerHTML = "";

			var columns = this.options.grids[this.options.difficulty][0];
			var rows = this.options.grids[this.options.difficulty][1];

			//Pre allocate the array
			this.list = new Array(columns);
			for (var i = 0; i <= columns; i++) {
				this.list[i] = new Array(rows);
			}

			// Build DOM Grid
			var tile = void 0;
			for (var y = 0; y < rows; y++) {
				for (var x = 0; x < columns; x++) {
					//tile = createTile(x,y);
					tile = new Mine();
					tile.position = { x: x, y: y };
					this.list[x][y] = tile; //.push(tile);
					tile = tile.elementRef;
					grid.appendChild(tile);
				}
			}

			var style = window.getComputedStyle(tile);

			var width = parseInt(style.width.slice(0, -2));
			var height = parseInt(style.height.slice(0, -2));

			grid.style.width = columns * width + "px";
			grid.style.height = rows * height + "px";
		}

		/**/

	}, {
		key: "checkRemaining",
		value: function checkRemaining() {

			var columns = this.options.grids[this.options.difficulty][0];
			var rows = this.options.grids[this.options.difficulty][1];

			var count = 0;
			var minecount = 0;

			for (var y = 0; y < rows; y++) {
				for (var x = 0; x < columns; x++) {

					if (this.list[x][y].state.revealed) count++;
					if (this.list[x][y].state.mine) minecount++;
				}
			}

			var tilesCount = this.options.grids[this.options.difficulty][0] * this.options.grids[this.options.difficulty][1] - 1;

			if (count + minecount == tilesCount) {

				cancelAnimationFrame(this.animationframe);
				smileyWon();
				this.msgWon.hidden = false;
			}
		}

		/**/

	}, {
		key: "gameOver",
		value: function gameOver() {

			cancelAnimationFrame(this.animationframe);
			smileyDead();
			this.msgLost.hidden = false;
		}

		/*Recursively reveal tiles in the grid/list */

	}, {
		key: "revealGrid",
		value: function revealGrid(x, y) {
			var forceOnNumber = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;


			var rows = this.options.grids[this.options.difficulty][1];
			var columns = this.options.grids[this.options.difficulty][0];

			//Bounds
			if (x < 0 || x == this.list.length - 1 || y == this.list[0].length || y < 0 || x > columns || y > rows) return;

			var obj = this.list[x][y];

			if (obj.state.revealed) return;

			this.checkRemaining();

			//Skip if flagged/revealed
			if (!forceOnNumber) {

				if (obj.state.flagged || obj.state.revealed) return;

				if (obj.state.mine) {

					obj.state.revealed = true;
					obj.state.explode = true;

					this.gameOver(obj);

					return;
				}
			} else {

				if (obj.state.flagged || obj.state.mine) return;

				if (obj.state.adjacent == 0) return;
			}

			obj.state.revealed = true;

			var cols = this.list.length - 1;
			rows = this.list[0].length - 1;

			if (!forceOnNumber) {
				if (obj.state.adjacent == 0 && obj.state.mine == false) {
					Game.field.revealGrid(x - 1, y);
					Game.field.revealGrid(x + 1, y);
					Game.field.revealGrid(x, y + 1);
					Game.field.revealGrid(x, y - 1);
				}
			} else {

				if (obj.state.mine == false) {
					Game.field.revealGrid(x - 1, y);
					Game.field.revealGrid(x + 1, y);
					Game.field.revealGrid(x, y + 1);
					Game.field.revealGrid(x, y - 1);
				}
			}
			obj.update();
		}

		/* Increases the Adjacent tile number */

	}, {
		key: "increaseWarning",
		value: function increaseWarning(y, x) {

			var cols = this.list.length - 1;
			var rows = this.list[0].length - 1;

			if (x < 0 || y < 0) return;
			if (x > cols || y > rows) return;

			var obj = this.list[x][y];

			if (!obj) return;

			if (obj.state.mine) return;

			obj.state.adjacent++;
			obj.update();
		}

		/* Starts a timer to increase 'time' */

	}, {
		key: "startTimer",
		value: function startTimer() {
			var _this = this;

			this.timeValue = 0;
			cancelAnimationFrame(this.animationframe);
			this.animationframe = requestAnimationFrame(function () {
				_this.onTimerTick();
			});
		}

		/* Increase timer 'time' */

	}, {
		key: "onTimerTick",
		value: function onTimerTick() {

			this.timeValue += 1 / 60;
			this.updateTimer();
		}

		/* Updates 'time' element, triggers another tick */

	}, {
		key: "updateTimer",
		value: function updateTimer() {
			var _this2 = this;

			this.timer.innerHTML = Math.round(this.timeValue);
			this.timewon.innerHTML = Math.round(this.timeValue);
			this.animationframe = requestAnimationFrame(function () {
				_this2.onTimerTick();
			});
		}
	}]);

	return MineSweeper;
}();

/* Handles difficulty and instanciating 'rounds' */

var Game = function () {
	function Game() {
		_classCallCheck(this, Game);

		this.field = new MineSweeper(_OPTIONS_);
	}

	/* handle Setting the token */

	_createClass(Game, [{
		key: "handleSetDifficulty",
		value: function handleSetDifficulty(evt) {

			this.field.options.difficulty = evt.target.value;
			this.field.buildGrid();
		}

		/**/

	}, {
		key: "handleStartGame",
		value: function handleStartGame() {

			this.field.buildGrid();
		}
	}]);

	return Game;
}();

/* Start game when document finished */

document.addEventListener('DOMContentLoaded', function () {

	//Dirty, only cause lazy, better have reset function
	Game = new Game();
});

var time = 0;
var tileIdCount = 0;

var Mine = function () {
	function Mine() {
		_classCallCheck(this, Mine);

		this.elementRef = this.createTile();

		this.hasChecked = false;

		this.id = tileIdCount++;

		this.state = {

			revealed: false,
			flagged: false,
			adjacent: 0,
			mine: false

		};
	}

	/**/

	_createClass(Mine, [{
		key: "createTile",
		value: function createTile() {
			var _this3 = this;

			var tile = document.createElement("div");

			tile.classList.add("tile");
			tile.classList.add("hidden");

			tile.addEventListener("auxclick", function (e) {
				e.preventDefault();
			}); // Middle Click
			tile.addEventListener("contextmenu", function (e) {
				e.preventDefault();
			}); // Right Click
			tile.addEventListener("mouseup", function (evt) {
				_this3.handleTileClick(evt);
			}); // All Clicks

			return tile;
		}

		/**/

	}, {
		key: "handleTileClick",
		value: function handleTileClick(event) {
			var _this4 = this;

			if (!Game.field.msgWon.hidden || !Game.field.msgLost.hidden) return;

			if (Game.field.timeValue == 0) {

				Game.field.startTimer();

				//Grab grid and clear out old elements.
				var grid = document.getElementById("minefield");
				grid.innerHTML = "";

				var columns = Game.field.options.grids[Game.field.options.difficulty][0];
				var rows = Game.field.options.grids[Game.field.options.difficulty][1];

				//Pre allocate the array
				this.list = new Array(columns);

				for (var i = 0; i <= columns; i++) {

					this.list[i] = new Array(rows);
				}
				console.log(this.list);

				// Build DOM Grid
				var tile = void 0;

				for (var y = 0; y < rows; y++) {
					for (var x = 0; x < columns; x++) {

						tile = new Mine();
						tile.position = { x: x, y: y };
						Game.field.list[x][y] = tile;

						var tileElm = tile.elementRef;
						grid.appendChild(tileElm);
						tile.update();
					}
				}

				for (var n = 0; n < Game.field.options.grids[Game.field.options.difficulty][2]; n++) {

					var _x2 = Math.round(Math.random() * columns);
					var _y = Math.round(Math.random() * rows);

					if (this.position.x == _x2 && this.position.y == _y) _x2 += Math.round(Math.random() * 4), _y += Math.round(Math.random() * 4);

					var obj = Game.field.list[_x2][_y];

					if (obj && obj.state.mine == false) {

						obj.state.mine = true;
						obj.update();

						//TODO reverse X, Y
						Game.field.increaseWarning(_y - 1, _x2 - 1);
						Game.field.increaseWarning(_y - 1, _x2);
						Game.field.increaseWarning(_y - 1, _x2 + 1);
						Game.field.increaseWarning(_y, _x2 - 1);
						Game.field.increaseWarning(_y, _x2);
						Game.field.increaseWarning(_y + 1, _x2);
						Game.field.increaseWarning(_y, _x2 + 1);
						Game.field.increaseWarning(_y + 1, _x2 - 1);
						Game.field.increaseWarning(_y + 1, _x2 + 1);
					}

					continue;
				}

				Game.field.revealGrid(this.position.x, this.position.y);
				return;
			}

			// Left Click
			if (event.which === 1) {

				//TODO reveal the tile
				Game.field.revealGrid(this.position.x, this.position.y);
			}
			// Middle Click
			else if (event.which === 2) {

					//TODO try to reveal adjacent tiles
					//Game.field.revealGrid(this.position.x,this.position.y,true);
					var adjacentFlags = 0;

					if (this.state.adjacent < 1 || !this.state.revealed || this.state.flagged) return;

					var toFlag = [];

					var flag = function flag(x, y) {

						toFlag.push(Game.field.list[_this4.position.x + x][_this4.position.y + y]);

						if (Game.field.list[_this4.position.x + x][_this4.position.y + y].state.flagged == true) adjacentFlags++;
					};

					flag(-1, -1);
					flag(-1, 0);
					flag(-1, 1);
					flag(0, -1);
					flag(0, 0);
					flag(1, 0);
					flag(0, 1);
					flag(1, -1);
					flag(1, 1);

					if (this.state.adjacent !== adjacentFlags) return;

					toFlag.forEach(function (flag) {

						flag.state.revealed = true;

						if (flag.state.flagged) return;

						if (flag.state.mine) flag.state.explode = true;

						flag.update();

						Game.field.gameOver();
					});
				}
				// Right Click
				else if (event.which === 3) {

						//TODO toggle a tile flag
						if (!this.state.revealed) {

							(this.state.flagged = !this.state.flagged) ? Game.field.flagCount++ : -Game.field.flagCount--;
						}
					}

			this.update();

			Game.field.remaining.innerHTML = Math.round(Game.field.options.grids[Game.field.options.difficulty][2] - Game.field.flagCount);
		}

		/**/

	}, {
		key: "update",
		value: function update() {

			this.elementRef.className = this.state.explode ? 'tile mine_hit' : this.state.mine && this.state.revealed ? 'tile mine' : this.state.flagged ? 'tile flag' : this.state.revealed ? this.state.adjacent ? 'tile tile_' + this.state.adjacent : 'tile' : 'tile hidden';
		}
	}]);

	return Mine;
}();

/**/

function smileyDown() {
	var smiley = document.getElementById("smiley");
	smiley.classList.add("face_down");
	smiley.classList.remove("face_limbo");
}

function smileyUp() {
	var smiley = document.getElementById("smiley");
	smiley.classList.remove("face_down");
	smiley.classList.remove("face_win");
}

function smileyDead() {
	var smiley = document.getElementById("smiley");
	smiley.classList.add("face_lose");
	smiley.classList.remove("face_down");
	smiley.classList.remove("face_limbo");
}

function smileyWon() {
	var smiley = document.getElementById("smiley");
	smiley.classList.add("face_win");
	smiley.classList.remove("face_down");
	smiley.classList.remove("face_limbo");
}

function smileyUnDead() {
	var smiley = document.getElementById("smiley");
	smiley.classList.remove("face_lose");
	smiley.classList.remove("face_win");
}

function smileyLimbo() {
	var smiley = document.getElementById("smiley");
	smiley.classList.add("face_limbo");
}

function smileyLimboRemove() {
	var smiley = document.getElementById("smiley");
	smiley.classList.remove("face_down");
	smiley.classList.remove("face_limbo");
}
