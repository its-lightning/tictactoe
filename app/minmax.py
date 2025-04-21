# Last updated: 2025-04-10 17:50:26 UTC
# Author: its-lightning

from typing import List, Dict, Tuple, Optional

class TicTacToeAI:
    def __init__(self):
        self.ai_player = 'O'
        self.human_player = 'X'
        self.nodes_explored = 0

    def is_winner(self, board: List[str], player: str) -> bool:
        # Check rows
        for i in range(0, 9, 3):
            if board[i] == board[i+1] == board[i+2] == player:
                return True
        
        # Check columns
        for i in range(3):
            if board[i] == board[i+3] == board[i+6] == player:
                return True
        
        # Check diagonals
        if board[0] == board[4] == board[8] == player:
            return True
        if board[2] == board[4] == board[6] == player:
            return True
        
        return False

    def get_empty_cells(self, board: List[str]) -> List[int]:
        return [i for i, cell in enumerate(board) if cell == '']

    def evaluate_position(self, board: List[str]) -> int:
        if self.is_winner(board, self.ai_player):
            return 10
        elif self.is_winner(board, self.human_player):
            return -10
        elif '' not in board:
            return 0
        
        score = 0
        lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8],  # columns
            [0, 4, 8], [2, 4, 6]  # diagonals
        ]
        
        for line in lines:
            ai_count = sum(1 for i in line if board[i] == self.ai_player)
            human_count = sum(1 for i in line if board[i] == self.human_player)
            empty_count = sum(1 for i in line if board[i] == '')
            
            if ai_count == 2 and empty_count == 1:
                score += 3
            elif human_count == 2 and empty_count == 1:
                score -= 3
            elif ai_count == 1 and empty_count == 2:
                score += 1
            elif human_count == 1 and empty_count == 2:
                score -= 1
        
        return score

    def minimax(self, board: List[str], depth: int, is_maximizing: bool) -> Tuple[int, Optional[int]]:
        self.nodes_explored += 1
        empty_cells = self.get_empty_cells(board)
        
        if self.is_winner(board, self.ai_player):
            return 10 - depth, None
        if self.is_winner(board, self.human_player):
            return depth - 10, None
        if not empty_cells:
            return 0, None

        if is_maximizing:
            max_eval = float('-inf')
            best_move = None
            for pos in empty_cells:
                board[pos] = self.ai_player
                eval_score, _ = self.minimax(board, depth + 1, False)
                board[pos] = ''
                if eval_score > max_eval:
                    max_eval = eval_score
                    best_move = pos
            return max_eval, best_move
        else:
            min_eval = float('inf')
            best_move = None
            for pos in empty_cells:
                board[pos] = self.human_player
                eval_score, _ = self.minimax(board, depth + 1, True)
                board[pos] = ''
                if eval_score < min_eval:
                    min_eval = eval_score
                    best_move = pos
            return min_eval, best_move

    def get_best_move(self, board: List[str]) -> Tuple[Optional[int], int]:
        self.nodes_explored = 0
        empty_cells = self.get_empty_cells(board)
        if not empty_cells:
            return None, self.nodes_explored
            
        _, best_move = self.minimax(board.copy(), 0, True)
        return best_move, self.nodes_explored

    def generate_tree(self, board: List[str], max_depth: int = 4) -> Dict:
        self.nodes_explored = 0

        tree = {
            'nodes': [],
            'edges': [],
            'maxDepth': max_depth,
            'nodesExplored': 0
        }

        def create_node(board_state: List[str], depth: int, parent_id: Optional[str] = None) -> Tuple[str, float]:
            # Generate a unique node ID by including parent_id in the hash
            node_id = str(hash((tuple(board_state), depth, parent_id)))

            # Determine current player based on board state
            x_count = board_state.count('X')
            o_count = board_state.count('O')
            current_player = 'X' if x_count <= o_count else 'O'
            is_maximizing = current_player == self.ai_player

            score = self.evaluate_position(board_state)

            # Add node to tree
            tree['nodes'].append({
                'id': node_id,
                'board': board_state.copy(),
                'score': score,
                'depth': depth,
                'isPruned': False,
                'currentPlayer': current_player
            })
            tree['nodesExplored'] += 1

            # Add edge if this isn't the root
            if parent_id is not None:
                tree['edges'].append({
                    'from': parent_id,
                    'to': node_id,
                    'isPruned': False
                })

            # Base cases
            if depth >= max_depth or self.is_winner(board_state, self.ai_player) or \
            self.is_winner(board_state, self.human_player) or not self.get_empty_cells(board_state):
                return node_id, score

            empty_cells = self.get_empty_cells(board_state)

            if is_maximizing:  # AI's turn (O)
                max_eval = float('-inf')
                for pos in empty_cells:
                    new_board = board_state.copy()
                    new_board[pos] = self.ai_player
                    _, eval_score = create_node(new_board, depth + 1, node_id)
                    max_eval = max(max_eval, eval_score)

                # Update node score
                for node in tree['nodes']:
                    if node['id'] == node_id:
                        node['score'] = max_eval
                        break
                return node_id, max_eval
            else:  # Player's turn (X)
                min_eval = float('inf')
                for pos in empty_cells:
                    new_board = board_state.copy()
                    new_board[pos] = self.human_player
                    _, eval_score = create_node(new_board, depth + 1, node_id)
                    min_eval = min(min_eval, eval_score)

                # Update node score
                for node in tree['nodes']:
                    if node['id'] == node_id:
                        node['score'] = min_eval
                        break
                return node_id, min_eval

        # Start tree generation
        root_id, _ = create_node(board, 0)
        tree['nodesExplored'] = self.nodes_explored
        return tree

    def evaluate_position(self, board):
        if self.is_winner(board, self.ai_player):
            return 10
        elif self.is_winner(board, self.human_player):
            return -10
        elif '' not in board:
            return 0
        
        # Heuristic evaluation for non-terminal positions
        score = 0
        # Check rows, columns, and diagonals for potential wins
        lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8],  # columns
            [0, 4, 8], [2, 4, 6]  # diagonals
        ]
        
        for line in lines:
            ai_count = sum(1 for i in line if board[i] == self.ai_player)
            human_count = sum(1 for i in line if board[i] == self.human_player)
            empty_count = sum(1 for i in line if board[i] == '')
            
            if ai_count == 2 and empty_count == 1:
                score += 3
            elif human_count == 2 and empty_count == 1:
                score -= 3
            elif ai_count == 1 and empty_count == 2:
                score += 1
            elif human_count == 1 and empty_count == 2:
                score -= 1
        
        return score