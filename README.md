This project creates a 2D board and pieces to play checkers with in the browser.
The game places pieces initially in the proper spots. 
The game, obviously, follows the rules of checkers: including normal moving only to one of the two places towards the opponent’s side of the board, allows for jumping by moving two places towards the opponent's side of the board with an opponent's piece in-between and the opponent's piece is removed, turning a piece into a "king" once it reaches the opponent's side of the board which then allows that 
piece to move backward or forward.
Multi-jumps, forced jumps, and game-over are not implemented.
The JavaScript click event is used for the user to select one of their pieces and then select its destination.
If the initial click location is not over a valid square nothing is done.
After the initial click an indicator is drawn in all of the valid destination squares.
If a square with an indicator is clicked, then the piece is moved appropriately (possibly removing jumped pieces and/or being promoted to a king).
If another valid square is clicked instead then the indicators are updated for the new valid piece.
The users are able to distinguish whose turn it is, which piece is selected, potential moves, and kings vs non-kings at a glance 
The kings and non-kings are the same color as would be in a regular game, their difference is that they are two pieces stacked.
The vertices and base colors for a single square, a single regular piece, and a single king are the only things sent in 
bulk to the GPU (and then transformed from there).
Additionally, uniforms are used to send transformation colors and information about adjusting the color of pieces from the base.