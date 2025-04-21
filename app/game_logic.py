from app.minmax import TicTacToeAI
from app.alphabeta import AlphaBetaAI

class TicTacToeGame:
    def __init__(self):
        self.board = [''] * 9
        self.minmax_ai = TicTacToeAI()
        self.alphabeta_ai = AlphaBetaAI()
        self.current_ai = self.minmax_ai  # Default to MinMax
        self.current_player = 'X'  # Human starts
        self.game_over = False
        self.winner = None
        self.ai_stats = {
            'nodes_explored': 0,
            'algorithm': 'minmax'
        }

    def set_algorithm(self, algorithm):
        if algorithm == 'alphabeta':
            self.current_ai = self.alphabeta_ai
            self.ai_stats['algorithm'] = 'alphabeta'
        else:
            self.current_ai = self.minmax_ai
            self.ai_stats['algorithm'] = 'minmax'

    def make_move(self, position):
        if self.game_over or position < 0 or position > 8 or self.board[position]:
            return False

        self.board[position] = self.current_player
        
        if self.check_winner(self.current_player):
            self.game_over = True
            self.winner = self.current_player
            return True

        if '' not in self.board:
            self.game_over = True
            self.winner = 'Tie'
            return True

        self.current_player = 'O'
        return True

    def ai_move(self):
        if self.game_over:
            return False

        # Unpack the tuple correctly
        move_info = self.current_ai.get_best_move(self.board)
        if isinstance(move_info, tuple):
            ai_position, nodes_explored = move_info
            self.ai_stats['nodes_explored'] = nodes_explored
        else:
            ai_position = move_info
            self.ai_stats['nodes_explored'] = 0

        if ai_position is not None:
            self.board[ai_position] = 'O'
            
            if self.check_winner('O'):
                self.game_over = True
                self.winner = 'O'
            elif '' not in self.board:
                self.game_over = True
                self.winner = 'Tie'
            
            self.current_player = 'X'
            return True
        return False

    def check_winner(self, player):
        return self.current_ai.is_winner(self.board, player)

    def get_game_state(self):
        return {
            'board': self.board,
            'current_player': self.current_player,
            'game_over': self.game_over,
            'winner': self.winner,
            'ai_stats': self.ai_stats
        }

    def generate_tree(self, board, depth):
        """Generate tree using current AI algorithm"""
        return self.current_ai.generate_tree(board, depth)

    def reset_game(self):
        self.__init__()