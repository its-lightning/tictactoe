// Last updated: 2025-04-10 17:08:46 UTC
// Author: its-lightning

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const board = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const status = document.getElementById('status');
    const resetBtn = document.getElementById('reset-btn');
    const treeContainer = document.getElementById('tree-container');
    const treeContent = document.getElementById('tree-content');
    const nodesCount = document.getElementById('nodes-count');
    const currentAlgo = document.getElementById('current-algo');
    const algoButtons = document.querySelectorAll('.algo-btn');
    
    // Game state
    let currentAlgorithm = 'minmax';

    // Initialize panzoom
    const panzoomInstance = panzoom(treeContent, {
        maxZoom: 2,
        minZoom: 0.1,
        initialZoom: 0.6,
        bounds: true,
        boundsPadding: 0.1,
        beforeWheel: (e) => {
            if (e.target.closest('.board')) {
                return true;
            }
        }
    });

    // Algorithm selection
    algoButtons.forEach(button => {
        button.addEventListener('click', () => {
            algoButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentAlgorithm = button.dataset.algo;
            currentAlgo.textContent = currentAlgorithm === 'minmax' ? 'MinMax' : 'Alpha-Beta';
            resetGame();
        });
    });

    // Add click handlers to cells
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    resetBtn.addEventListener('click', resetGame);

    function handleCellClick(e) {
        e.preventDefault();
        const cell = e.target;
        const position = cell.dataset.index;

        if (cell.textContent || cell.classList.contains('X') || cell.classList.contains('O')) {
            return;
        }

        fetch('/make_move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                position: parseInt(position),
                algorithm: currentAlgorithm
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(gameState => {
            updateGame(gameState);
            updateTree(gameState.board);
        })
        .catch(error => console.error('Error:', error));
    }

    function createMiniBoard(board) {
        const miniBoard = document.createElement('div');
        miniBoard.className = 'mini-board';
        
        board.forEach((cell, index) => {
            const miniCell = document.createElement('div');
            miniCell.className = `mini-cell${cell ? ' ' + cell : ''}`;
            miniCell.textContent = cell || '';
            miniBoard.appendChild(miniCell);
        });
        
        return miniBoard;
    }

    function getScoreClass(score) {
        if (score > 0) return 'score-positive';
        if (score < 0) return 'score-negative';
        return 'score-neutral';
    }

    function createSvgContainer() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('class', 'connections-layer');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.overflow = 'visible';
        return svg;
    }

    function drawConnections(treeData, nodeElements, transform = { scale: 1, x: 0, y: 0 }) {
        // Remove existing SVG if any
        const existingSvg = document.querySelector('.connections-layer');
        if (existingSvg) {
            existingSvg.remove();
        }
    
        // Create new SVG container
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('class', 'connections-layer');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.overflow = 'visible';
    
        // Create a group element to apply transforms
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute('transform', `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`);
        svg.appendChild(group);
    
        // Draw connections
        treeData.edges.forEach(edge => {
            const fromNode = nodeElements.get(edge.from);
            const toNode = nodeElements.get(edge.to);
    
            if (fromNode && toNode) {
                const fromRect = fromNode.getBoundingClientRect();
                const toRect = toNode.getBoundingClientRect();
                const containerRect = treeContainer.getBoundingClientRect();
    
                // Calculate positions relative to container
                const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
                const y1 = fromRect.bottom - containerRect.top;
                const x2 = toRect.left + toRect.width / 2 - containerRect.left;
                const y2 = toRect.top - containerRect.top;
    
                // Create line with curve
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const midY = y1 + (y2 - y1) / 2;
                
                const d = `M ${x1},${y1} 
                          C ${x1},${midY}
                            ${x2},${midY}
                            ${x2},${y2}`;
    
                path.setAttribute('d', d);
                path.setAttribute('class', 'connection-line');
                group.appendChild(path);
            }
        });
    
        treeContainer.insertBefore(svg, treeContent);
        return svg;
    }    

    // Add this to the node creation in renderTree function
// Update the createNodeDiv function
    function createNodeDiv(node) {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = `tree-node${node.isPruned ? ' pruned' : ''}`;
        nodeDiv.dataset.nodeId = node.id;
        
        // Add inverted player indicator
        const playerIndicator = document.createElement('div');
        // Invert the display - show the next player's turn
        const displayPlayer = node.currentPlayer === 'X' ? 'O' : 'X';
        playerIndicator.className = `player-indicator ${displayPlayer}`;
        playerIndicator.textContent = `${displayPlayer}'s turn`;
        nodeDiv.appendChild(playerIndicator);
        
        nodeDiv.appendChild(createMiniBoard(node.board));
        
        const scoreDiv = document.createElement('div');
        scoreDiv.className = `node-score ${getScoreClass(node.score)}`;
        scoreDiv.textContent = `${node.score > 0 ? '+' : ''}${node.score}`;
        nodeDiv.appendChild(scoreDiv);
        
        if (node.isPruned) {
            const prunedLabel = document.createElement('div');
            prunedLabel.className = 'pruned-label';
            prunedLabel.textContent = 'Pruned';
            nodeDiv.appendChild(prunedLabel);
        }
        
        return nodeDiv;
    }
    
    // Modify the existing renderTree function to handle pruned nodes
    function renderTree(treeData) {
        treeContent.innerHTML = '';
        const nodeElements = new Map();
        const levels = {};
    
        // Group nodes by depth
        treeData.nodes.forEach(node => {
            if (!levels[node.depth]) {
                levels[node.depth] = [];
            }
            levels[node.depth].push(node);
        });
    
        // Create each level
        Object.entries(levels).forEach(([depth, nodes]) => {
            const levelDiv = document.createElement('div');
            levelDiv.className = 'tree-level';
            
            nodes.forEach(node => {
                // Use createNodeDiv instead of inline creation
                const nodeDiv = createNodeDiv(node);
                levelDiv.appendChild(nodeDiv);
                nodeElements.set(node.id, nodeDiv);
            });
    
            treeContent.appendChild(levelDiv);
        });
    
        // Initial draw of connections
        drawConnections(treeData, nodeElements);
    
        // Update connections on transform
        panzoomInstance.on('transform', (e) => {
            const transform = e.getTransform();
            drawConnections(treeData, nodeElements, {
                x: transform.x,
                y: transform.y,
                scale: transform.scale
            });
        });
    
        // Center the tree
        const treeContentRect = treeContent.getBoundingClientRect();
        const containerRect = treeContainer.getBoundingClientRect();
        const scale = Math.min(
            containerRect.width / treeContentRect.width,
            containerRect.height / treeContentRect.height,
            1
        );
        
        panzoomInstance.zoomTo(
            containerRect.width / 2,
            containerRect.height / 2,
            scale * 0.9
        );
    }
    
    // Modify drawConnections to handle pruned edges
    function drawConnections(treeData, nodeElements, transform = { scale: 1, x: 0, y: 0 }) {
        // Remove existing SVG if any
        const existingSvg = document.querySelector('.connections-layer');
        if (existingSvg) {
            existingSvg.remove();
        }
    
        // Create new SVG container
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('class', 'connections-layer');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.overflow = 'visible';
    
        // Create a group element to apply transforms
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute('transform', `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`);
        svg.appendChild(group);
    
        // Draw connections
        treeData.edges.forEach(edge => {
            const fromNode = nodeElements.get(edge.from);
            const toNode = nodeElements.get(edge.to);
    
            if (fromNode && toNode) {
                const fromRect = fromNode.getBoundingClientRect();
                const toRect = toNode.getBoundingClientRect();
                const containerRect = treeContainer.getBoundingClientRect();
    
                // Calculate positions relative to container
                const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
                const y1 = fromRect.bottom - containerRect.top;
                const x2 = toRect.left + toRect.width / 2 - containerRect.left;
                const y2 = toRect.top - containerRect.top;
    
                // Create line with curve
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const midY = y1 + (y2 - y1) / 2;
                
                const d = `M ${x1},${y1} 
                          C ${x1},${midY}
                            ${x2},${midY}
                            ${x2},${y2}`;
    
                path.setAttribute('d', d);
                path.setAttribute('class', `connection-line${edge.isPruned ? ' pruned' : ''}`);
                group.appendChild(path);
            }
        });
    
        treeContainer.insertBefore(svg, treeContent);
        return svg;
    }
    

    function updateGame(gameState) {
        gameState.board.forEach((mark, index) => {
            const cell = cells[index];
            cell.textContent = mark;
            cell.classList.remove('X', 'O');
            if (mark) cell.classList.add(mark);
        });

        // Update stats
        if (gameState.ai_stats) {
            nodesCount.textContent = gameState.ai_stats.nodes_explored;
            currentAlgo.textContent = gameState.ai_stats.algorithm === 'minmax' ? 'MinMax' : 'Alpha-Beta';
        }

        if (gameState.game_over) {
            status.textContent = gameState.winner === 'Tie' 
                ? "It's a tie!" 
                : `Player ${gameState.winner} wins!`;
        } else {
            status.textContent = `${gameState.current_player}'s turn`;
        }
    }

    function updateTree(board) {
        fetch('/get_tree', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                board: board,
                algorithm: currentAlgorithm 
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(renderTree)
        .catch(error => console.error('Error:', error));
    }

    function resetGame() {
        fetch('/reset', {
            method: 'POST',
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(gameState => {
            updateGame(gameState);
            updateTree(gameState.board);
        })
        .catch(error => console.error('Error:', error));
    }

    // Initialize the game
    resetGame();
});