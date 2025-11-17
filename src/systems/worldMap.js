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
            }
        }
    }
}
