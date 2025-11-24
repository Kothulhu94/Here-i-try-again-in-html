class Pathfinder {
    static isLineOfSightClear(startX, startY, endX, endY, worldMap) {
        const dist = this.getDistance(startX, startY, endX, endY);
        const steps = Math.floor(dist / (GRID_SIZE / 8)); // Increased resolution to prevent corner cutting
        if (steps <= 1) return true;
        const dx = (endX - startX) / steps;
        const dy = (endY - startY) / steps;
        const margin = GRID_SIZE / 8; // Define margin for corner checking

        for (let i = 1; i <= steps; i++) {
            const checkX = startX + dx * i;
            const checkY = startY + dy * i;

            const terrain = worldMap.getTerrainAt(checkX, checkY);
            const isRoad = worldMap.isRoadAt(checkX, checkY);

            if (worldMap.isImpassable(terrain) && !isRoad) return false;

            // Check margins to ensure we don't clip corners (unless on a road)
            if (!isRoad) {
                if ((worldMap.isImpassable(worldMap.getTerrainAt(checkX + margin, checkY)) && !worldMap.isRoadAt(checkX + margin, checkY)) ||
                    (worldMap.isImpassable(worldMap.getTerrainAt(checkX - margin, checkY)) && !worldMap.isRoadAt(checkX - margin, checkY)) ||
                    (worldMap.isImpassable(worldMap.getTerrainAt(checkX, checkY + margin)) && !worldMap.isRoadAt(checkX, checkY + margin)) ||
                    (worldMap.isImpassable(worldMap.getTerrainAt(checkX, checkY - margin)) && !worldMap.isRoadAt(checkX, checkY - margin))) {
                    return false;
                }
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
                total_path[0] = [startX, startY]; // Start exactly where the unit is
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
                    const isRoad = worldMap.isRoadAt(neighbor.x * GRID_SIZE, neighbor.y * GRID_SIZE);

                    if (worldMap.isImpassable(terrainType) && !isRoad) continue;

                    if (dx !== 0 && dy !== 0) {
                        // Diagonal check for cutting corners
                        const adjacent1X = (current.x + dx) * GRID_SIZE + GRID_SIZE / 2;
                        const adjacent1Y = current.y * GRID_SIZE + GRID_SIZE / 2;
                        const adjacent2X = current.x * GRID_SIZE + GRID_SIZE / 2;
                        const adjacent2Y = (current.y + dy) * GRID_SIZE + GRID_SIZE / 2;

                        const t1 = worldMap.getTerrainAt(adjacent1X, adjacent1Y);
                        const t2 = worldMap.getTerrainAt(adjacent2X, adjacent2Y);
                        const r1 = worldMap.isRoadAt(adjacent1X, adjacent1Y);
                        const r2 = worldMap.isRoadAt(adjacent2X, adjacent2Y);

                        if ((worldMap.isImpassable(t1) && !r1) || (worldMap.isImpassable(t2) && !r2)) {
                            continue;
                        }
                    }

                    if (closedSet.has(nodeKey(neighbor))) continue;

                    const dist = this.getDistance(current.x, current.y, neighbor.x, neighbor.y);
                    let speedMod = TERRAIN_TYPES[terrainType]?.speedModifier || 1.0;
                    if (isRoad) speedMod = TERRAIN_TYPES['road'].speedModifier;

                    const movementCost = dist / speedMod;

                    const tentative_gScore = gScore.get(nodeKey(current)) + movementCost;
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
