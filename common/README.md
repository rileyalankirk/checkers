Common files to be included in HTML files before the project code.


webgl-utils.js
==============

Utilities from Google/Khronos group to provide WebGL functions for cross-browser code. Some built-in
functions are modified to be cross-browser.

Functions
---------

`WebGLUtils.setupWebGL(canvas, [opt_attribs])` -  Creates a WebGL context. If creation fails it
will change the contents of the container of the `<canvas>` tag to an error message with the correct
links for WebGL. Returns the created context.

`WebGLUtils.create3DContext(canvas, [opt_attribs])` - Creates a WebGL context without handling of
errors. Returns the created context.



MV.js
=====

Matrix/vector package provided by the book _Interactive Computer Graphics - A Top-Down Approach with
WebGL_ by Edward Angel.

Functions
---------

### Utilities

`radians(degrees)` - Converts degrees to radians

### Vector/Matrix Constructors

`vec2([a], [b])`, `vec3([a], [b], [c])`, `vec4([a], [b], [c], [d])` - Construct a 2, 3, or 4 element
vector. Extra values are ignored and missing values are assumed to be 0.

`mat2(...)`, `mat3(...)`, `mat4(...)` - Construct a 2x2, 3x3, or 4x4 matrix. If given no arguments,
creates an identity matrix. If given a single argument, creates a matrix with that value along the
diagonal and 0s everywhere else. In all other cases the matrix is filled across the columns then
down the rows. Extra values are ignored and missing values are assumed to be 0.

### Vector/Matrix Functions

`equal(u, v)` - Checks if two vectors or matrices are equal to each other.
`add(u, v)` - Element-wise addition of two vectors or matrices.
`subtract(u, v)` - Element-wise subtraction of two vectors or matrices.
`mult(u, v)` - Element-wise multiply of two vectors or matrices.
`scale(s, u)` - Scale a vector or matrix `u` by a constant scale factor `s`.
`negate(u)` - Take negative of each element in the vector or matrix `u`.
`flatten(v)` - Flattens a vector, matrix, or array of vectors into a `Float32Array`. Matrices are
flattened down columns then across rows.

### Matrix Functions

`printm(m)` - Print the matrix to the console.
`transpose(m)` - Create and return the transpose of the matrix.
`det(m)` - Calculate the determinant of the matrix.

### Vector Functions

`length(u)` - Length/magnitude of a vector (square root of dot product with itself).
`dot(u, v)` - Dot product of two vectors.
`cross(u, v)` - Cross product of two vectors.
`normalize(u, [excludeLastComponent])` - Normalize the vector sum that its length/magnitude is 1.
If `excludeLastComponent` is provided and is true the last element is not included in the
normalization.
`mix(u, v, s)` - Scale and add two vectors together, equivalent to `add(scale(1-s, u), scale(s, v))`.
`sizeof[...]` - Dictionary of byte sizes of the results of `Float32Array` for the given vector or
matrix type. The key is one of `vec2`, `vec3`, `vec4`, `mat2`, `mat3`, or `mat4`.

### Affine Transformation Matrix Creators
`translate(x, y, z)` - Create translation matrix. Can also call with a single, length-3, vector
argument.
`rotate(angle, axis1, axis2, axis3)` - Create rotation matrix. `angle` is given in degrees. The axis
can also be given as a single, length-3, vector argument.
`rotateX(theta)` - Create rotation matrix. `theta` is given in degrees around the X-axis.
`rotateY(theta)` - Create rotation matrix. `theta` is given in degrees around the Y-axis.
`rotateZ(theta)` - Create rotation matrix. `theta` is given in degrees around the Z-axis.
`scalem(x, y, z)` - Create scale matrix. Can also call with a single, length-3, vector argument.
`lookAt(eye, at, up)` - Create model-view matrix that is defined by the position of `eye` that is
looking at the position `at` and oriented with the vector `up`. All three arguments are length-3
vectors.

### Projection Matrix Creators

`ortho(left, right, bottom, top, near, far)` - Create orthographic view matrix with the defined
sides of the cube.
`perspective(fovy, aspect, near, far)` - Create perspective view matrix with the given
field-of-view angle along y, the aspect ratio, and near/far clipping planes.



init-shaders.js
===============

Utilities to initialize shaders, including compiling and linking.

Functions
---------

`loadFile(name, ondone, onerror)` - Loads a file asynchronously, calling either `ondone` or
`onerror` on completion. This function returns immediately. Inside the called functions `this` is
the `XMLHttpRequest` object (so `this.responseText` is the file's contents).

`compileShader(gl, type, shader)` - Compiles and checks the shader. `gl` is a WebGL context object,
`type` must be one of the OpenGL constants for shaders (like `gl.VERTEX_SHADER` or
`gl.FRAGMENT_SHADER`), and `shader` is the code for the shader.

`linkProgram(gl, shaders)` - Links several shaders into a WebGL program. `gl` is a WebGL context
object and `shaders` is an array of shaders returned by `compileShader`.
