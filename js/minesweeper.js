
/* Config options */

const _OPTIONS_ = {
	difficulty: 0,
	grids: [
		// X, Y, #of mines
		[9, 9, 10],
		[16, 16, 50],
		[30, 16, 99]
	]
};

/* Dedicated to handling the grid/board and its session*/

class MineSweeper {

	constructor(options) {

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

	resetGrid() {

		this.board = [];
		this.list = [[]];
		this.flagCount = 0;
		this.timeValue = 0;
		this.msgWon.hidden = true;
		this.msgLost.hidden = true;

		smileyUnDead()
	}

	/**/

	buildGrid() {

		this.resetGrid();

		// Fetch grid and clear out old elements.
		let grid = document.getElementById("minefield");
		grid.innerHTML = "";

		let columns = this.options.grids[this.options.difficulty][0];
		let rows = this.options.grids[this.options.difficulty][1];

		//Pre allocate the array
		this.list = new Array(columns);
		for (let i = 0; i <= columns; i++) {
			this.list[i] = new Array(rows);
		}

		// Build DOM Grid
		let tile;
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < columns; x++) {
				//tile = createTile(x,y);
				tile = new Mine();
				tile.position = { x: x, y: y };
				this.list[x][y] = tile;//.push(tile);
				tile = tile.elementRef;
				grid.appendChild(tile);
			}
		}


		let style = window.getComputedStyle(tile);

		let width = parseInt(style.width.slice(0, -2));
		let height = parseInt(style.height.slice(0, -2));

		grid.style.width = (columns * width) + "px";
		grid.style.height = (rows * height) + "px";

	}

	/**/

	checkRemaining() {

		let columns = this.options.grids[this.options.difficulty][0];
		let rows = this.options.grids[this.options.difficulty][1];

		let count = 0;
		let minecount = 0;

		for (var y = 0; y < rows; y++) {
			for (var x = 0; x < columns; x++) {

				if (this.list[x][y].state.revealed)
					count++;
				if (this.list[x][y].state.mine)
					minecount++;

			}
		}

		let tilesCount = (this.options.grids[this.options.difficulty][0] * this.options.grids[this.options.difficulty][1]) - 1;

		if (count + minecount == tilesCount) {

			cancelAnimationFrame(this.animationframe);
			smileyWon()
			this.msgWon.hidden = false;

		}

	}

	/**/

	gameOver() {

		cancelAnimationFrame(this.animationframe);
		smileyDead()
		this.msgLost.hidden = false;

	}

	/*Recursively reveal tiles in the grid/list */

	revealGrid(x, y, forceOnNumber = false) {

		let rows = this.options.grids[this.options.difficulty][1];
		let columns = this.options.grids[this.options.difficulty][0];

		//Bounds
		if ((x < 0) ||
			(x == this.list.length - 1) ||
			(y == this.list[0].length) ||
			(y < 0) || (x > columns) || (y > rows))
			return;

		let obj = this.list[x][y];

		if (obj.state.revealed)
			return;

		this.checkRemaining();

		//Skip if flagged/revealed
		if (!forceOnNumber) {

			if ((obj.state.flagged) || (obj.state.revealed)) return;

			if (obj.state.mine) {

				obj.state.revealed = true;
				obj.state.explode = true;

				this.gameOver(obj);

				return;
			}

		} else {

			if ((obj.state.flagged) || (obj.state.mine)) return;

			if ((obj.state.adjacent == 0))
				return;
		}

		obj.state.revealed = true;

		let cols = this.list.length - 1;
		rows = this.list[0].length - 1;

		if (!forceOnNumber) {
			if ((obj.state.adjacent == 0) && (obj.state.mine == false)) {
				Game.field.revealGrid(x - 1, y);
				Game.field.revealGrid(x + 1, y);
				Game.field.revealGrid(x, y + 1);
				Game.field.revealGrid(x, y - 1);
			}
		}
		else {

			if ((obj.state.mine == false)) {
				Game.field.revealGrid(x - 1, y);
				Game.field.revealGrid(x + 1, y);
				Game.field.revealGrid(x, y + 1);
				Game.field.revealGrid(x, y - 1);
			}

		}
		obj.update();
	}

	/* Increases the Adjacent tile number */

	increaseWarning(y, x) {

		let cols = this.list.length - 1;
		let rows = this.list[0].length - 1;

		if ((x < 0) || (y < 0))
			return;
		if ((x > cols) || (y > rows))
			return;

		let obj = this.list[x][y];

		if (!obj)
			return;

		if (obj.state.mine) return;

		obj.state.adjacent++;
		obj.update();

	}

	/* Starts a timer to increase 'time' */

	startTimer() {

		this.timeValue = 0;
		cancelAnimationFrame(this.animationframe);
		this.animationframe = requestAnimationFrame(() => {
			this.onTimerTick();
		});

	}

	/* Increase timer 'time' */

	onTimerTick() {

		this.timeValue += 1 / 60;
		this.updateTimer();

	}

	/* Updates 'time' element, triggers another tick */

	updateTimer() {

		this.timer.innerHTML = Math.round(this.timeValue);
		this.timewon.innerHTML = Math.round(this.timeValue);
		this.animationframe = requestAnimationFrame(() => {
			this.onTimerTick();
		});

	}

}

/* Handles difficulty and instanciating 'rounds' */

class Game {

	constructor() {

		this.field = (new MineSweeper(_OPTIONS_));

	}

	/* handle Setting the token */

	handleSetDifficulty(evt) {

		this.field.options.difficulty = evt.target.value;
		this.field.buildGrid();

	}

	/**/

	handleStartGame() {

		this.field.buildGrid();

	}

}

/* Start game when document finished */

document.addEventListener('DOMContentLoaded', function () {

	//Dirty, only cause lazy, better have reset function
	Game = new Game();

})

var time = 0;
var tileIdCount = 0;
class Mine {

	constructor() {

		this.elementRef = this.createTile();

		this.hasChecked = false;

		this.id = tileIdCount++;

		this.state = {

			revealed: false,
			flagged: false,
			adjacent: 0,
			mine: false

		}

	}

	/**/

	createTile() {

		let tile = document.createElement("div");

		tile.classList.add("tile");
		tile.classList.add("hidden");

		tile.addEventListener("auxclick", function (e) { e.preventDefault(); }); // Middle Click
		tile.addEventListener("contextmenu", function (e) { e.preventDefault(); }); // Right Click
		tile.addEventListener("mouseup", (evt) => { this.handleTileClick(evt); }); // All Clicks

		return tile;
	}

	/**/

	handleTileClick(event) {

		if ((!Game.field.msgWon.hidden) || (!Game.field.msgLost.hidden))
			return;

		if (Game.field.timeValue == 0) {

			Game.field.startTimer();

			//Grab grid and clear out old elements.
			let grid = document.getElementById("minefield");
			grid.innerHTML = "";

			let columns = Game.field.options.grids[Game.field.options.difficulty][0];
			let rows = Game.field.options.grids[Game.field.options.difficulty][1];

			//Pre allocate the array
			this.list = new Array(columns);

			for (let i = 0; i <= columns; i++) {

				this.list[i] = new Array(rows);

			}
			console.log(this.list);

			// Build DOM Grid
			let tile;

			for (let y = 0; y < rows; y++) {
				for (let x = 0; x < columns; x++) {

					tile = new Mine();
					tile.position = { x: x, y: y };
					Game.field.list[x][y] = tile;

					let tileElm = tile.elementRef;
					grid.appendChild(tileElm);
					tile.update();

				}
			}

			for (var n = 0; n < Game.field.options.grids[Game.field.options.difficulty][2]; n++) {

				let x = Math.round(Math.random() * (columns));
				let y = Math.round(Math.random() * (rows));

				if ((this.position.x == x) && (this.position.y == y))
					x += Math.round(Math.random() * (4)), y += Math.round(Math.random() * (4));

				let obj = Game.field.list[x][y];

				if ((obj) && (obj.state.mine == false)) {

					obj.state.mine = true;
					obj.update();

					//TODO reverse X, Y
					Game.field.increaseWarning(y - 1, x - 1);
					Game.field.increaseWarning(y - 1, x);
					Game.field.increaseWarning(y - 1, x + 1);
					Game.field.increaseWarning(y, x - 1);
					Game.field.increaseWarning(y, x);
					Game.field.increaseWarning(y + 1, x);
					Game.field.increaseWarning(y, x + 1);
					Game.field.increaseWarning(y + 1, x - 1);
					Game.field.increaseWarning(y + 1, x + 1);

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
			let adjacentFlags = 0;

			if ((this.state.adjacent < 1) ||
				(!this.state.revealed) ||
				(this.state.flagged))
				return;

			let toFlag = [];

			let flag = (x, y) => {

				toFlag.push(Game.field.list[this.position.x + x][this.position.y + y]);

				if (Game.field.list[this.position.x + x][this.position.y + y].state.flagged == true)
					adjacentFlags++;

			}

			flag(-1, -1);
			flag(-1, 0);
			flag(-1, 1);
			flag(0, -1);
			flag(0, 0);
			flag(1, 0);
			flag(0, 1);
			flag(1, -1);
			flag(1, 1);

			if (this.state.adjacent !== adjacentFlags)
				return;

			toFlag.forEach((flag) => {

				flag.state.revealed = true;

				if (flag.state.flagged)
					return;

				if (flag.state.mine)
					flag.state.explode = true;

				flag.update();

				Game.field.gameOver();

			})

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

	update() {

		this.elementRef.className = (this.state.explode) ? 'tile mine_hit' : (this.state.mine && this.state.revealed) ? 'tile mine' : (this.state.flagged ? 'tile flag' : (this.state.revealed ? (this.state.adjacent ? 'tile tile_' + this.state.adjacent : 'tile') : 'tile hidden'));

	}

}

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
