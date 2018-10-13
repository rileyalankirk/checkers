// GL context
let gl;

// Drawing sizes
const SQUARE_SZ = 2/8;
const PIECE_RADIUS = SQUARE_SZ/2 * 0.8; // make the radius a little smaller than a square so it fits inside
const KING_OFFSET = SQUARE_SZ / 16;

// Square colors
let dark_square = vec4(0.82, 0.55, 0.28, 1.0);
let lght_square = vec4(1.0, 0.89, 0.67, 1.0);

// Offset and counts for objects
let square_info;
let piece_info;

// Location of the transform uniform
let transform_loc;
let color_loc;

// Piece types
const EMPTY 		 = 0;
const BLACK 		 = 1;
const WHITE 		 = 2;
const BLACK_KING = 3;
const WHITE_KING = 4;

// Global for the current turn, current piece, and available moves
let current_turn = WHITE;
let current_piece = [-1, -1]; // (row, col)
let available_moves = []; // index 0,1 = place to move to; index 2,3 = piece jumped

// Locations of the pieces (also keeps track of kings)
let board = [
	[BLACK, BLACK, BLACK, BLACK],
	[BLACK, BLACK, BLACK, BLACK],
	[BLACK, BLACK, BLACK, BLACK],
	[EMPTY, EMPTY, EMPTY, EMPTY],
	[EMPTY, EMPTY, EMPTY, EMPTY],
	[WHITE, WHITE, WHITE, WHITE],
	[WHITE, WHITE, WHITE, WHITE],
	[WHITE, WHITE, WHITE, WHITE]
]

// Once the document is fully loaded run this init function.
window.addEventListener('load', function init() {
	// Get the HTML5 canvas object from it's ID
	const canvas = document.getElementById('gl-canvas');

	// Get the WebGL context (save into a global variable)
	gl = WebGLUtils.create3DContext(canvas);
	if (!gl) {
		window.alert("WebGL isn't available");
		return;
	}

	// Configure WebGL
	gl.viewport(0, 0, canvas.width, canvas.height); // this is the region of the canvas we want to draw on (all of it)
	gl.clearColor(lght_square[0], lght_square[1], lght_square[2], lght_square[3]); // setup the background color

	// Setup the data
	let verts = [], colors = [];
	let wht = vec4(1.0, 1.0, 1.0, 1.0);

	// Board Square - In top-left corner
	let off = verts.length;
	rect(-1, 1, SQUARE_SZ - 1, 1 - SQUARE_SZ, verts);
	while (colors.length < verts.length) { colors.push(dark_square); }
	square_info = [off, verts.length - off];

	// White Checker Piece
	off = verts.length;
	circle([0.5*SQUARE_SZ - 1, 1 - 0.5*SQUARE_SZ], PIECE_RADIUS, 32, verts);
	while (colors.length < verts.length) { colors.push(wht); }
	piece_info = [off, verts.length - off];

	// Vertex Shader
	let vertShdr = compileShader(gl, gl.VERTEX_SHADER, `
		attribute vec4 vPosition;
		attribute vec4 vColor;
		varying vec4 fColor;
		uniform mat4 transform;
		void main() {
			gl_Position = transform*vPosition;
			fColor = vColor;
		}
	`);

	// Fragment Shader
	let fragShdr = compileShader(gl, gl.FRAGMENT_SHADER, `
		precision mediump float;
		varying vec4 fColor;
		uniform vec4 color;
		void main() {
			gl_FragColor = color*fColor;
		}
	`);

	// Link the programs and use them with the WebGL context
	let program = linkProgram(gl, [vertShdr, fragShdr]);
	gl.useProgram(program);

	// Allocate the vertex data buffer on the GPU and associate with shader
	let vBuffer = gl.createBuffer(); // create a new buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer); // bind to the new buffer
	gl.bufferData(gl.ARRAY_BUFFER, flatten(verts), gl.STATIC_DRAW); // allocate the buffer
	let vPosition = gl.getAttribLocation(program, 'vPosition'); // get the vertex shader attribute "vPosition"
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0); // associate the buffer with "vPosition" making sure it knows it is length-2 vectors of floats
	gl.enableVertexAttribArray(vPosition); // enable this set of data

	// Allocate the color data buffer on the GPU and associate with shader
	let cBuffer = gl.createBuffer(); // create a new buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer); // bind to the new buffer
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW); // allocate the buffer
	let vColor = gl.getAttribLocation(program, 'vColor'); // get the vertex shader attribute "vColor"
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0); // associate the buffer with "vColor" making sure it knows it is length-2 vectors of floats
	gl.enableVertexAttribArray(vColor); // enable this set of data

	// Get the location of the transform and color uniforms
	transform_loc = gl.getUniformLocation(program, 'transform');
	color_loc = gl.getUniformLocation(program, 'color');

	// Add the click listener
	canvas.addEventListener('click', onClick);

	// Render the static scene
	render();
});

/**
 * Render the scene. Uses a loop to to go over the entire board and render each square and piece.
 * The light squares (which cannot have pieces on them) are not directly done here but instead by
 * the clear color.
 */
function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);

	// set the initial color uniform
	gl.uniform4f(color_loc, 1, 1, 1, 1);

	drawBoard();
	drawPieces();
}

/**
 * Add a rectangle to pts as 2 triangles. (x0,y0) is one corner and
 * (x1,y1) is the opposite corner of the rectangle.
 */
function rect(x0, y0, x1, y1, pts) {
	pts.push(vec2(x0, y0), vec2(x1, y0), vec2(x1, y1), vec2(x0, y0), vec2(x1, y1), vec2(x0, y1));
}

/**
 * Add the vertices for a circle centered at c with a radius of r and n sides to the array verts.
 */
function circle(c, r, n, verts) {
	let theta = 2*Math.PI/n;
	let a = vec2(c[0]+r, c[1]);
	for (let i = 1; i <= n; ++i) {
		let b = vec2(
			c[0]+Math.cos(i*theta)*r,
			c[1]+Math.sin(i*theta)*r);
		verts.push(c, a, b);
		a = b;
	}
}

/*
 * Determines which tile the user clicked on and either
 * selects or moves a piece if the click is valid
 */
function onClick(evt) {
	// calculates the tile clicked on
	let x = evt.clientX - this.getBoundingClientRect().left - this.clientLeft + this.scrollLeft;
	let y = evt.clientY - this.getBoundingClientRect().top - this.clientTop + this.scrollTop;
	x = 2*(x/this.width) - 1;
	y = 1 - 2*(y/this.height);
	x = Math.floor(4*(x + 1));
	y = Math.floor(8 - 4*(y + 1));

	// check if the square is empty
	if (board[y][(x - y%2)/2] !== EMPTY) {
		// check if the player clicked on a dark square
		if (x % 2 === y % 2) {
			// add a highlight to the current selected piece (has to be their turn)
			if (current_turn % 2 === board[y][(x - y%2)/2] % 2) {
				current_piece = [y, x];
				render();
			}
		}
	} else {
		// check for a move
		for (let i = 0; i < available_moves.length; i++) {
			let move = available_moves[i];
			if (move[0] === y && move[1] === (x - y%2)/2) {
				// switch turn
				current_turn = (current_turn % 2) + 1;
				let pieceType = board[current_piece[0]][(current_piece[1] - current_piece[0]%2)/2];
				// make a jump
				if (move.length > 2) {
					board[move[2]][move[3]] = EMPTY;
				}
				// check for making a regular piece a king
				if (pieceType === WHITE && move[0] === 0) {
					pieceType = WHITE_KING;
				} else if (pieceType === BLACK && move[0] === 7) {
					pieceType = BLACK_KING;
				}
				board[move[0]][move[1]] = pieceType;
				board[current_piece[0]][(current_piece[1] - current_piece[0]%2)/2] = EMPTY;
				current_piece = [-1, -1];   // reset current piece
				i = available_moves.length; // end the loop after this iteration
				available_moves = [];       // reset moves
				render();
			}
		}
	}
}

function drawBoard() {
	// Draw dark squares
	let [off,count] = square_info;
	for (let i = 0; i < 4; i++) {		// 4 columns
		for (let j = 0; j < 4; j++) { // 8 rows (2 rows per iteration)
			let m = translate(2*i*SQUARE_SZ, 1 - (2*j + 4)*SQUARE_SZ, 0);
			gl.uniformMatrix4fv(transform_loc, false, flatten(m));
			gl.drawArrays(gl.TRIANGLES, off, count);
			m = translate((2*i + 1)*SQUARE_SZ, 1 - (2*j + 5)*SQUARE_SZ, 0);
			gl.uniformMatrix4fv(transform_loc, false, flatten(m));
			gl.drawArrays(gl.TRIANGLES, off, count);
		}
	}
}

function drawPieces() {
	// Draw the pieces
	for (let i = 0; i < 8; i++) {		// 8 rows
		for (let j = 0; j < 4; j++) { // 4 columns
			let pieceType = board[i][j];
			if (pieceType !== EMPTY) {
				if (pieceType < 3) {
					drawPiece(i, j, pieceType);
				} else {
					drawKing(i, j, pieceType);
				}
				if (current_piece[0] === i && current_piece[1] === (2*j + i%2)) {
					drawPossibleMoves(i, j, pieceType);
				}
			}
		}
	}
}

function drawPiece(i, j, pieceType) {
	// highlight the current player's piece and then draw the piece
	if ((pieceType % 2) === 1) {
		if (current_turn === BLACK) {
			gl.uniform4f(color_loc, 1, 0, 0, 1);
			draw_piece(i, j, -0.5*KING_OFFSET);
		}
		gl.uniform4f(color_loc, 0, 0, 0, 1);
		// add a highlight to the selected piece
		if (current_piece[0] === i && current_piece[1] === (2*j + i%2)) {
			gl.uniform4f(color_loc, 0.2, 0.2, 0.2, 1);
		}
	} else if ((pieceType % 2) === 0) {
		if (current_turn === WHITE) {
			gl.uniform4f(color_loc, 1, 0, 0, 1);
			draw_piece(i, j, -0.5*KING_OFFSET);
		}
		gl.uniform4f(color_loc, 1, 1, 1, 1);
		// add a highlight to the selected piece
		if (current_piece[0] === i && current_piece[1] === (2*j + i%2)) {
			gl.uniform4f(color_loc, 1, 1, 0.8, 1);
		}
	}

	// draw piece
	draw_piece(i, j, 0);
}

function drawKing(i, j, pieceType) {
	let color;

	if (pieceType === WHITE_KING) {
		color = [1, 1, 1];
		// add highlight to selected piece
		if (current_piece[0] === i && current_piece[1] === (2*j + i%2)) {
			color = [1, 1, 0.8]
		}
	} else if (pieceType === BLACK_KING) {
		color = [0, 0, 0];
		// add highlight to selected piece
		if (current_piece[0] === i && current_piece[1] === (2*j + i%2)) {
			color = [0.2, 0.2, 0.2]
		}
	}
	if ((current_turn % 2) === (pieceType % 2)) {
		gl.uniform4f(color_loc, 1, 0, 0, 1);
		draw_piece(i, j, -0.5*KING_OFFSET);
	}
	// add first piece of king
	gl.uniform4f(color_loc, color[0], color[1], color[2], 1); // set color uniform
	draw_piece(i, j, 0);
	// add inner layer of king
	gl.uniform4f(color_loc, 1, 0, 0, 1); // set color uniform
	draw_piece(i, j, KING_OFFSET);
	// add second piece of king
	gl.uniform4f(color_loc, color[0], color[1], color[2], 1); // set color uniform
	draw_piece(i, j, 1.5*KING_OFFSET);
}

function drawPossibleMoves(i, j, pieceType) {
	available_moves = [];
	gl.uniform4f(color_loc, 1, 1, 0.8, 1); // set move color
	if (pieceType < 3) {
		// regular piece moves
		if (pieceType === WHITE) {
			checkForMoveAbove(i, j, pieceType);
		} else {
			checkForMoveBelow(i, j, pieceType);
		}
	} else {
		// king moves
		checkForMoveAbove(i, j, pieceType);
		checkForMoveBelow(i, j, pieceType);
	}
}

function checkForMoveAbove(i, j, pieceType) {
	// check piece above the current piece (based on the logic of our board)
	if (i - 1 > -1) {
		if (board[i-1][j] === EMPTY) {
			available_moves.push([i-1, j]);
			draw_piece(i-1, j, 0);
		} else {
			// check for a jump above current piece
			if (board[i-1][j] % 2 !== pieceType % 2) {
				if (i % 2 === 0) {
					if (i - 2 > -1 && j + 1 < 8 && board[i-2][j+1] === EMPTY) {
						available_moves.push([i-2, j+1, i-1, j]);
						draw_piece(i-2, j+1, 0);
					}
				} else if (i - 2 > -1 && j - 1 > -1 && board[i-2][j-1] === EMPTY) {
					available_moves.push([i-2, j-1, i-1, j]);
					draw_piece(i-2, j-1, 0);
				}
			}
		}
	}
	// check piece to the right or left and above the current piece
	if (i % 2 === 1) {
		if (i - 1 > -1 && j + 1 < 8) {
			if (board[i-1][j+1] === EMPTY) {
				available_moves.push([i-1, j+1]);
				draw_piece(i-1, j+1, 0);
			} else if (board[i-1][j+1] % 2 !== pieceType % 2) {
				// check for a jump
				if (i - 2 > -1 && board[i-2][j+1] === EMPTY) {
					available_moves.push([i-2, j+1, i-1, j+1]);
					draw_piece(i-2, j+1, 0);
				}
			}
		}
	} else if (i - 1 > -1 && j - 1 > -1) {
		if (board[i-1][j-1] === EMPTY) {
			available_moves.push([i-1, j-1]);
			draw_piece(i-1, j-1, 0);
		} else if (board[i-1][j-1] % 2 !== pieceType % 2) {
			// check for a jump
			if (i - 2 > -1 && board[i-2][j-1] === EMPTY) {
				available_moves.push([i-2, j-1, i-1, j-1]);
				draw_piece(i-2, j-1, 0);
			}
		}
	}
}

function checkForMoveBelow(i, j, pieceType) {
	// check piece below the current piece (based on the logic of our board)
	if (i + 1 < 8) {
		if (board[i+1][j] === EMPTY) {
			available_moves.push([i+1, j]);
			draw_piece(i+1, j, 0);
		} else if (board[i+1][j] % 2 !== pieceType % 2) {
			// check for a jump below
			if (i % 2 === 0) {
				if (i + 2 < 8 && j + 1 < 8 && board[i+2][j+1] === EMPTY) {
					available_moves.push([i+2, j+1, i+1, j]);
					draw_piece(i+2, j+1, 0);
				}
			} else {
				if (i + 2 < 8 && j - 1 > -1 && board[i+2][j-1] === EMPTY) {
					available_moves.push([i+2, j-1, i+1, j]);
					draw_piece(i+2, j-1, 0);
				}
			}
		}
	}
	// check piece to the right or left and below the current piece
	if (i % 2 === 1) {
		if (i + 1 < 8 && j + 1 < 8) {
			if (board[i+1][j+1] === EMPTY) {
				available_moves.push([i+1, j+1]);
				draw_piece(i+1, j+1, 0);
			} else if (board[i+1][j+1] % 2 !== pieceType % 2) {
				// check for a jump
				if (i + 2 < 8 && j + 1 < 8 && board[i+2][j+1] === EMPTY) {
					available_moves.push([i+2, j+1, i+1, j+1]);
					draw_piece(i+2, j+1, 0);
				}
			}
		}
	} else {
		if (i + 1 < 8 && j - 1 > -1) {
			if (board[i+1][j-1] === EMPTY) {
				available_moves.push([i+1, j-1]);
				draw_piece(i+1, j-1, 0);
			} else if (board[i+1][j-1] % 2 !== pieceType % 2) {
				// check for a jump
				if (i + 2 < 8 && j - 1 > -1 && board[i+2][j-1] === EMPTY) {
					available_moves.push([i+2, j-1, i+1, j-1]);
					draw_piece(i+2, j-1, 0);
				}
			}
		}
	}
}

function draw_piece(i, j, offset) {
	let [off,count] = piece_info;
	let m = translate((2*j + i%2)*SQUARE_SZ + offset, -i*SQUARE_SZ + offset, 0);
	gl.uniformMatrix4fv(transform_loc, false, flatten(m));
	gl.drawArrays(gl.TRIANGLES, off, count);
}
