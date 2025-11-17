class Pathfinder {
    static isLineOfSightClear(startX, startY, endX, endY, worldMap) {
        const dist = this.getDistance(startX, startY, endX, endY);
        const steps = Math.floor(dist / (GRID_SIZE / 2));
        if (steps <= 1) return true;
        const dx = (endX - startX) / steps;
        const dy = (endY - startY) / steps;
        for (let i = 1; i < steps; i++) {
            if (worldMap.isImpassable(worldMap.getTerrainAt(startX + dx * i, startY + dy * i))) {
                return false;
            }
        }
        return true;
    }

    static smoothPath(path, worldMap) {
        if (!path || path.length < 3) return path;
        let smoothedPath = [path[0]];
        let anchorIndex = 0;
        for (let i = 2; i < path.length; i++) {
            const anchorPoint = path[anchorIndex];
            const testPoint = path[i];
            if (!this.isLineOfSightClear(anchorPoint[0], anchorPoint[1], testPoint[0], testPoint[1], worldMap)) {
                smoothedPath.push(path[i - 1]);
                anchorIndex = i - 1;
            }
        }
        smoothedPath.push(path[path.length - 1]);
        return smoothedPath;
    }

    static findPathAStar(startX, startY, endX, endY, worldMap) {
        const startNode = { x: Math.floor(startX / GRID_SIZE), y: Math.floor(startY / GRID_SIZE) };
        const endNode = { x: Math.floor(endX / GRID_SIZE), y: Math.floor(endY / GRID_SIZE) };
        const openSet = [], closedSet = new Set(), cameFrom = new Map(), gScore = new Map(), fScore = new Map();
        const nodeKey = (node) => `${node.x},${node.y}`;
        gScore.set(nodeKey(startNode), 0);
        fScore.set(nodeKey(startNode), this.getDistance(startNode.x, startNode.y, endNode.x, endNode.y));
        openSet.push({ ...startNode, f: fScore.get(nodeKey(startNode)) });
        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            if (current.x === endNode.x && current.y === endNode.y) {
                const total_path = []; let temp = current;
                while (temp) { total_path.unshift([temp.x * GRID_SIZE + GRID_SIZE / 2, temp.y * GRID_SIZE + GRID_SIZE / 2]); temp = cameFrom.get(nodeKey(temp)); }
                total_path.push([endX, endY]);
                return this.smoothPath(total_path, worldMap);
            }
            closedSet.add(nodeKey(current));
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const neighbor = { x: current.x + dx, y: current.y + dy };
                    if (neighbor.x < 0 || neighbor.x >= worldMap.gridWidth || neighbor.y < 0 || neighbor.y >= worldMap.gridHeight) continue;
                    const terrainType = worldMap.getTerrainAt(neighbor.x * GRID_SIZE, neighbor.y * GRID_SIZE);
                    if (worldMap.isImpassable(terrainType)) continue;

                    if (dx !== 0 && dy !== 0) {
                        const adjacent1Terrain = worldMap.getTerrainAt((current.x + dx) * GRID_SIZE + GRID_SIZE/2, current.y * GRID_SIZE + GRID_SIZE/2);
                        const adjacent2Terrain = worldMap.getTerrainAt(current.x * GRID_SIZE + GRID_SIZE/2, (current.y + dy) * GRID_SIZE + GRID_SIZE/2);
                        if (worldMap.isImpassable(adjacent1Terrain) || worldMap.isImpassable(adjacent2Terrain)) {
                            continue;
                        }
                    }

                    if (closedSet.has(nodeKey(neighbor))) continue;
                    const tentative_gScore = gScore.get(nodeKey(current)) + this.getDistance(current.x, current.y, neighbor.x, neighbor.y);
                    if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) openSet.push(neighbor);
                    else if (tentative_gScore >= (gScore.get(nodeKey(neighbor)) || Infinity)) continue;
                    cameFrom.set(nodeKey(neighbor), current);
                    gScore.set(nodeKey(neighbor), tentative_gScore);
                    const h = this.getDistance(neighbor.x, neighbor.y, endNode.x, endNode.y);
                    const f = tentative_gScore + h;
                    fScore.set(nodeKey(neighbor), f);
                    const openNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
                    if (openNode) openNode.f = f;
                }
            }
        }
        console.warn("A* path not found!");
        return [[endX, endY]];
    }

    static getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
}
