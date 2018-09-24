// GL context
let gl;

// Drawing sizes
const SQUARE_SZ = 2/8;
const PIECE_RADIUS = SQUARE_SZ/2 * 0.8; // make the radius a little smaller than a square so it fits inside

// Square colors
let dark_square = vec4(0.82, 0.55, 0.28, 1.0);
let lght_square = vec4(1.0, 0.89, 0.67, 1.0);

// Offset and counts for objects
let square_info;

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
	let blk = vec4(0.0, 0.0, 0.0, 1.0);

	// Board Square - 0,0 is top-left corner
	let off = verts.length;
	rect(0, 0, SQUARE_SZ, SQUARE_SZ, verts);
	while (colors.length < verts.length) { colors.push(wht); }
	square_info = [off, verts.length - off];

	// Vertex Shader
	let vertShdr = compileShader(gl, gl.VERTEX_SHADER, `
		attribute vec4 vPosition;
		attribute vec4 vColor;
		varying vec4 fColor;
		void main() {
			gl_Position = vPosition;
			fColor = vColor;
		}
	`);

	// Fragment Shader
	let fragShdr = compileShader(gl, gl.FRAGMENT_SHADER, `
		precision mediump float;
		varying vec4 fColor;
		void main() {
			gl_FragColor = fColor;
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
	
	// Draw square
	let [off,count] = square_info;
	gl.drawArrays(gl.TRIANGLES, off, count);
}

/**
 * Add a rectangle to pts as 2 triangles. (x0,y0) is one corner and
 * (x1,y1) is the opposite corner of the rectangle.
 */
function rect(x0, y0, x1, y1, pts) {
	pts.push(vec2(x0, y0), vec2(x1, y0), vec2(x1, y1),
			 vec2(x0, y0), vec2(x1, y1), vec2(x0, y1));
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

