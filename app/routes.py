from flask import Blueprint, render_template, jsonify, request
from app.game_logic import TicTacToeGame

main = Blueprint('main', __name__)
game = TicTacToeGame()

@main.route('/')
def index():
    game.reset_game()
    return render_template('game.html')

@main.route('/make_move', methods=['POST'])
def make_move():
    data = request.json
    position = data.get('position')
    algorithm = data.get('algorithm', 'minmax')
    
    if position is None:
        return jsonify({'error': 'Position not provided'}), 400
    
    try:
        position = int(position)
    except ValueError:
        return jsonify({'error': 'Invalid position format'}), 400

    # Set the AI algorithm before making the move
    game.set_algorithm(algorithm)

    if game.make_move(position):
        if not game.game_over:
            game.ai_move()
        return jsonify(game.get_game_state())
    return jsonify({'error': 'Invalid move'}), 400

@main.route('/get_tree', methods=['POST'])
def get_tree():
    data = request.json
    board = data.get('board', [''] * 9)
    algorithm = data.get('algorithm', 'minmax')
    
    # Set the algorithm before generating tree
    game.set_algorithm(algorithm)
    
    # Adjust depth based on algorithm
    if algorithm == 'alphabeta':
        depth = 3  # Increased depth for alpha-beta
    else:
        depth = 3  # Keep original depth for minmax
        
    tree_data = game.generate_tree(board, depth)
    return jsonify(tree_data)

@main.route('/reset', methods=['POST'])
def reset():
    game.reset_game()
    return jsonify(game.get_game_state())