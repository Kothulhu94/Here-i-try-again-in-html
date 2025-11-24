class WorldMap {
    constructor() {
        this.mapWidth = MAP_DIMENSION;
        this.mapHeight = MAP_DIMENSION;
        this.gridWidth = this.mapWidth / GRID_SIZE;
        this.gridHeight = this.mapHeight / GRID_SIZE;
        this.terrainGrid = [];
    }

    getTerrainAt(worldX, worldY) {
        const gridX = Math.floor(worldX / GRID_SIZE);
        const gridY = Math.floor(worldY / GRID_SIZE);
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) return 'plains';
        if (!this.terrainGrid || this.terrainGrid.length === 0 || !this.terrainGrid[gridX]) return 'plains';
        return this.terrainGrid[gridX][gridY];
    }

    isImpassable(terrainType) {
        return terrainType === 'water' || terrainType === 'mountain';
    }

    generateTerrain() {
        const grid = Array(this.gridWidth).fill(0).map(() => Array(this.gridHeight).fill('plains'));
        const localSetTerrain = (x, y, type) => {
            if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) grid[x][y] = type;
        };
        const localGetTerrain = (x, y) => {
            if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) return grid[x][y];
            return 'plains';
        };
        const generateSolidLake = (startX, startY, steps) => {
            let x = startX, y = startY;
            for (let i = 0; i < steps; i++) {
                localSetTerrain(x, y, 'water'); localSetTerrain(x + 1, y, 'water');
                localSetTerrain(x, y + 1, 'water'); localSetTerrain(x + 1, y + 1, 'water');
                const dir = Math.floor(Math.random() * 4);
                if (dir === 0) x++; else if (dir === 1) x--; else if (dir === 2) y++; else y--;
                x = Math.max(0, Math.min(this.gridWidth - 2, x));
                y = Math.max(0, Math.min(this.gridHeight - 2, y));
            }
        };
        for (let i = 0; i < 50; i++) generateSolidLake(Math.floor(Math.random() * this.gridWidth), Math.floor(Math.random() * this.gridHeight), 5000);
        const generateMountainRanges = (type, count, baseSize) => {
            for (let i = 0; i < count; i++) {
                const numSquares = 3 + Math.floor(Math.random() * 3), squares = [];
                for (let j = 0; j < numSquares; j++) {
                    const currentSize = baseSize * (0.4 + Math.random() * 0.6), halfSize = Math.floor(currentSize / 2);
                    let cx, cy;
                    if (j === 0) { cx = Math.floor(Math.random() * this.gridWidth); cy = Math.floor(Math.random() * this.gridHeight); }
                    else {
                        const anchorSquare = squares[Math.floor(Math.random() * squares.length)], angle = Math.random() * 2 * Math.PI, distance = (anchorSquare.size / 2) * (0.6 + Math.random() * 0.4);
                        cx = Math.floor(anchorSquare.x + Math.cos(angle) * distance); cy = Math.floor(anchorSquare.y + Math.sin(angle) * distance);
                    }
                    squares.push({ x: cx, y: cy, size: currentSize });
                    for (let dx = -halfSize; dx <= halfSize; dx++) for (let dy = -halfSize; dy <= halfSize; dy++) if (localGetTerrain(cx + dx, cy + dy) === 'plains') localSetTerrain(cx + dx, cy + dy, type);
                }
            }
        };
        const generateFeature = (type, count, size) => {
            for (let i = 0; i < count; i++) {
                const cx = Math.floor(Math.random() * this.gridWidth), cy = Math.floor(Math.random() * this.gridHeight);
                for (let dx = -size; dx <= size; dx++) for (let dy = -size; dy <= size; dy++) if (Math.random() > (Pathfinder.getDistance(0, 0, dx, dy) / size)) if (localGetTerrain(cx + dx, cy + dy) === 'plains') localSetTerrain(cx + dx, cy + dy, type);
            }
        };
        generateMountainRanges('mountain', 40, 48);
        generateFeature('forest', 500, 20);
        this.terrainGrid = grid;
        this.terrainGrid = grid;
        this.roads = new Map(); // Changed from Set to Map to store road type
    }

    isRoadAt(worldX, worldY) {
        const gridX = Math.floor(worldX / GRID_SIZE);
        const gridY = Math.floor(worldY / GRID_SIZE);
        return this.roads.has(`${gridX},${gridY}`);
    }

    generateRoads(locations) {
        this.roads.clear();
        const towns = locations.filter(l => l.type === 'town');
        const villages = locations.filter(l => l.type === 'village');

        const connections = [];

        // Connect villages ONLY to their parent town
        villages.forEach(v => {
            const town = towns.find(t => t.id === v.townId);
            if (town) connections.push({ start: v, end: town, type: 'minor' });
        });

        // Connect towns to 2 nearest towns (Major Roads)
        towns.forEach(t1 => {
            const others = towns.filter(t => t !== t1).map(t2 => ({
                town: t2,
                dist: Pathfinder.getDistance(t1.x, t1.y, t2.x, t2.y)
            })).sort((a, b) => a.dist - b.dist);

            others.slice(0, 2).forEach(o => connections.push({ start: t1, end: o.town, type: 'major' }));
        });

        connections.forEach(conn => {
            this._buildRoad(conn.start, conn.end, conn.type);
        });
    }

    _buildRoad(startLoc, endLoc, roadType) {
        const startNode = { x: Math.floor(startLoc.x / GRID_SIZE), y: Math.floor(startLoc.y / GRID_SIZE) };
        const endNode = { x: Math.floor(endLoc.x / GRID_SIZE), y: Math.floor(endLoc.y / GRID_SIZE) };

        const openSet = new MinHeap();
        openSet.push({ ...startNode, cost: 0, priority: 0 });

        const cameFrom = new Map();
        const costSoFar = new Map();
        const key = (x, y) => `${x},${y}`;

        costSoFar.set(key(startNode.x, startNode.y), 0);

        while (openSet.size() > 0) {
            const current = openSet.pop();

            if (current.x === endNode.x && current.y === endNode.y) {
                let currX = current.x;
                let currY = current.y;
                while (true) {
                    const k = `${currX},${currY}`;
                    // If road exists, only upgrade minor to major, never downgrade
                    if (!this.roads.has(k) || (this.roads.get(k) === 'minor' && roadType === 'major')) {
                        this.roads.set(k, roadType);
                    }

                    const prevKey = cameFrom.get(key(currX, currY));
                    if (!prevKey) break;
                    const [px, py] = prevKey.split(',').map(Number);
                    currX = px;
                    currY = py;
                }
                return;
            }

            const neighbors = [
                { x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 }
            ];

            for (const next of neighbors) {
                if (next.x < 0 || next.x >= this.gridWidth || next.y < 0 || next.y >= this.gridHeight) continue;

                const terrain = this.terrainGrid[next.x][next.y];
                let moveCost = 1; // Plains
                if (terrain === 'forest') moveCost = 2; // Avoid forests
                else if (terrain === 'water' || terrain === 'mountain') moveCost = 8; // Can cut through but expensive

                // If road already exists, it's very cheap!
                if (this.roads.has(key(next.x, next.y))) moveCost = 0.2;

                const nextK = key(next.x, next.y);
                const newCost = costSoFar.get(key(current.x, current.y)) + moveCost;

                if (!costSoFar.has(nextK) || newCost < costSoFar.get(nextK)) {
                    costSoFar.set(nextK, newCost);
                    // Manhattan distance is faster and sufficient for grid
                    const heuristic = (Math.abs(next.x - endNode.x) + Math.abs(next.y - endNode.y));
                    const priority = newCost + heuristic;
                    openSet.push({ ...next, cost: newCost, priority });
                    cameFrom.set(nextK, key(current.x, current.y));
                }
            }
        }
    }

    render(ctx, game) {
        const topLeftWorld = game.screenToWorld(0, 0);
        const bottomRightWorld = game.screenToWorld(game.canvasWidth, game.canvasHeight);
        const startX = Math.max(0, Math.floor(topLeftWorld.x / GRID_SIZE));
        const endX = Math.min(this.gridWidth - 1, Math.floor(bottomRightWorld.x / GRID_SIZE));
        const startY = Math.max(0, Math.floor(topLeftWorld.y / GRID_SIZE));
        const endY = Math.min(this.gridHeight - 1, Math.floor(bottomRightWorld.y / GRID_SIZE));

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const worldX = x * GRID_SIZE;
                const worldY = y * GRID_SIZE;
                const type = this.terrainGrid[x][y];
                const screenPos = game.worldToScreen(worldX, worldY);
                const screenSize = GRID_SIZE * game.cameraZoom;
                ctx.fillStyle = TERRAIN_TYPES[type].color;
                ctx.fillRect(screenPos.x, screenPos.y, screenSize + 1, screenSize + 1);

                if (this.roads.has(`${x},${y}`)) {
                    ctx.fillStyle = TERRAIN_TYPES['road'].color;
                    const roadType = this.roads.get(`${x},${y}`);

                    // Base width: 48 (3x player width of 16)
                    // Major roads: 25% wider -> 60
                    const baseWidth = 48;
                    const width = (roadType === 'major' ? baseWidth * 1.25 : baseWidth) * game.cameraZoom;

                    ctx.fillRect(screenPos.x + (screenSize - width) / 2, screenPos.y + (screenSize - width) / 2, width, width);

                    // To make it look connected, we'd need to check neighbors, but simple squares is a start.
                    // Let's try to connect them visually.
                    const neighbors = [
                        { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
                    ];
                    neighbors.forEach(n => {
                        const neighborKey = `${x + n.dx},${y + n.dy}`;
                        if (this.roads.has(neighborKey)) {
                            // Determine connection width based on the smaller of the two roads
                            // This prevents a fat road from looking weird connecting to a thin one
                            const neighborType = this.roads.get(neighborKey);
                            const neighborWidth = (neighborType === 'major' ? baseWidth * 1.25 : baseWidth) * game.cameraZoom;
                            const connWidth = Math.min(width, neighborWidth);

                            const w = n.dx !== 0 ? (screenSize + connWidth) / 2 : connWidth;
                            const h = n.dy !== 0 ? (screenSize + connWidth) / 2 : connWidth;

                            // Calculate offsets to center the connection
                            let drawX = screenPos.x + (screenSize - connWidth) / 2;
                            let drawY = screenPos.y + (screenSize - connWidth) / 2;

                            if (n.dx === 1) { // Right
                                drawX = screenPos.x + (screenSize + width) / 2 - (width - connWidth) / 2; // Start from edge of center block
                                // Actually simpler: just draw from center to center
                                // But we want to fill the gap.
                                // Let's just draw a rect from center of this tile to edge
                                drawX = screenPos.x + screenSize / 2;
                            }
                            if (n.dx === -1) { // Left
                                drawX = screenPos.x;
                            }
                            if (n.dy === 1) { // Down
                                drawY = screenPos.y + screenSize / 2;
                            }
                            if (n.dy === -1) { // Up
                                drawY = screenPos.y;
                            }

                            // Re-simplifying connection logic to be robust:
                            // Draw a rectangle bridging the gap between the center square and the neighbor's edge

                            if (n.dx === 1) { // Right
                                ctx.fillRect(screenPos.x + (screenSize + width) / 2 - (width - connWidth) / 2, screenPos.y + (screenSize - connWidth) / 2, (screenSize - width) / 2 + 1, connWidth);
                            }
                            if (n.dx === -1) { // Left
                                ctx.fillRect(screenPos.x, screenPos.y + (screenSize - connWidth) / 2, (screenSize - width) / 2 + 1, connWidth);
                            }
                            if (n.dy === 1) { // Down
                                ctx.fillRect(screenPos.x + (screenSize - connWidth) / 2, screenPos.y + (screenSize + width) / 2 - (width - connWidth) / 2, connWidth, (screenSize - width) / 2 + 1);
                            }
                            if (n.dy === -1) { // Up
                                ctx.fillRect(screenPos.x + (screenSize - connWidth) / 2, screenPos.y, connWidth, (screenSize - width) / 2 + 1);
                            }
                        }
                    });
                }
            }
        }
    }
}

class MinHeap {
    constructor() {
        this.heap = [];
    }
    push(node) {
        this.heap.push(node);
        this._bubbleUp(this.heap.length - 1);
    }
    pop() {
        if (this.heap.length === 0) return null;
        const min = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this._sinkDown(0);
        }
        return min;
    }
    size() {
        return this.heap.length;
    }
    _bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[parentIndex].priority <= this.heap[index].priority) break;
            [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
            index = parentIndex;
        }
    }
    _sinkDown(index) {
        const length = this.heap.length;
        while (true) {
            let leftChildIndex = 2 * index + 1;
            let rightChildIndex = 2 * index + 2;
            let swap = null;
            if (leftChildIndex < length) {
                if (this.heap[leftChildIndex].priority < this.heap[index].priority) {
                    swap = leftChildIndex;
                }
            }
            if (rightChildIndex < length) {
                if ((swap === null && this.heap[rightChildIndex].priority < this.heap[index].priority) ||
                    (swap !== null && this.heap[rightChildIndex].priority < this.heap[swap].priority)) {
                    swap = rightChildIndex;
                }
            }
            if (swap === null) break;
            [this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]];
            index = swap;
        }
    }
}
