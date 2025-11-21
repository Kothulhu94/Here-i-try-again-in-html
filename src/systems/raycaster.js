class Raycaster {
    constructor(game, enemyParty) {
        this.game = game;
        this.enemyParty = enemyParty;
        this.mapWidth = 24;
        this.mapHeight = 24;
        this.worldMap = [];
        this.enemies = [];
        this.player = {
            x: 3.5,
            y: 3.5,
            dirX: -1,
            dirY: 0,
            planeX: 0,
            planeY: 0.66,
            hp: 100,
            maxHp: 100
        };
        this.keys = {};
        this.lastTime = 0;
        this.resolution = 4; // Cast a ray every N pixels
        this.weaponState = 0; // 0: idle, >0: attacking
        this.generateMap();
        this.spawnEnemies();
        this.bindInput();
    }

    generateMap() {
        // Simple arena generation
        for (let x = 0; x < this.mapWidth; x++) {
            this.worldMap[x] = [];
            for (let y = 0; y < this.mapHeight; y++) {
                if (x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1) {
                    this.worldMap[x][y] = 1; // Wall
                } else if (Math.random() < 0.05) {
                    this.worldMap[x][y] = 2; // Obstacle
                } else {
                    this.worldMap[x][y] = 0; // Floor
                }
            }
        }
    }

    spawnEnemies() {
        const enemyColor = FACTIONS[this.enemyParty.factionId]?.color || '#ff0000';
        const partySize = Party.getPartySize(this.enemyParty.party);
        // Cap enemies for performance and gameplay balance in FPS mode
        const enemyCount = Math.min(partySize, 20);

        for (let i = 0; i < enemyCount; i++) {
            let ex, ey;
            do {
                ex = Math.floor(Math.random() * (this.mapWidth - 2)) + 1.5;
                ey = Math.floor(Math.random() * (this.mapHeight - 2)) + 1.5;
            } while (this.worldMap[Math.floor(ex)][Math.floor(ey)] !== 0 || Math.hypot(ex - this.player.x, ey - this.player.y) < 5);

            // Scale HP based on troop type roughly (simplified)
            const hp = 20 + (Math.random() * 10);

            this.enemies.push({
                x: ex,
                y: ey,
                hp: hp,
                maxHp: hp,
                color: enemyColor,
                speed: 1.5 + Math.random() * 1.0,
                state: 'chase'
            });
        }
    }

    bindInput() {
        this.onKeyDown = (e) => { this.keys[e.code] = true; };
        this.onKeyUp = (e) => { this.keys[e.code] = false; };
        this.onMouseMove = (e) => {
            if (document.pointerLockElement === this.game.canvas) {
                this.rotate(e.movementX * 0.002);
            }
        };
        this.onMouseDown = (e) => {
            if (document.pointerLockElement === this.game.canvas) {
                this.attack();
            } else {
                this.game.canvas.requestPointerLock();
            }
        };

        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mousedown', this.onMouseDown);
    }

    cleanup() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.exitPointerLock();
    }

    rotate(rotSpeed) {
        const oldDirX = this.player.dirX;
        this.player.dirX = this.player.dirX * Math.cos(rotSpeed) - this.player.dirY * Math.sin(rotSpeed);
        this.player.dirY = oldDirX * Math.sin(rotSpeed) + this.player.dirY * Math.cos(rotSpeed);
        const oldPlaneX = this.player.planeX;
        this.player.planeX = this.player.planeX * Math.cos(rotSpeed) - this.player.planeY * Math.sin(rotSpeed);
        this.player.planeY = oldPlaneX * Math.sin(rotSpeed) + this.player.planeY * Math.cos(rotSpeed);
    }

    attack() {
        if (this.weaponState === 0) {
            this.weaponState = 1;
            // Hitscan
            // Sort enemies by distance
            this.enemies.sort((a, b) => {
                return ((this.player.x - a.x) ** 2 + (this.player.y - a.y) ** 2) - ((this.player.x - b.x) ** 2 + (this.player.y - b.y) ** 2);
            });

            // Check if closest enemy is in front and in range
            const closest = this.enemies[0]; // Closest is at end or start? Sort is ascending distance? Yes.
            if (closest) {
                const dist = Math.hypot(closest.x - this.player.x, closest.y - this.player.y);
                if (dist < 2.5) {
                    // Check angle
                    const dx = closest.x - this.player.x;
                    const dy = closest.y - this.player.y;
                    // Dot product
                    const dot = dx * this.player.dirX + dy * this.player.dirY;
                    if (dot > 0.5) { // Roughly in front
                        closest.hp -= 15;
                        // Knockback
                        closest.x += dx * 0.2;
                        closest.y += dy * 0.2;
                    }
                }
            }
        }
    }

    update(deltaTime) {
        const moveSpeed = 5.0 * deltaTime;
        const rotSpeed = 3.0 * deltaTime;

        if (this.keys['KeyW']) {
            if (this.worldMap[Math.floor(this.player.x + this.player.dirX * moveSpeed)][Math.floor(this.player.y)] === 0) this.player.x += this.player.dirX * moveSpeed;
            if (this.worldMap[Math.floor(this.player.x)][Math.floor(this.player.y + this.player.dirY * moveSpeed)] === 0) this.player.y += this.player.dirY * moveSpeed;
        }
        if (this.keys['KeyS']) {
            if (this.worldMap[Math.floor(this.player.x - this.player.dirX * moveSpeed)][Math.floor(this.player.y)] === 0) this.player.x -= this.player.dirX * moveSpeed;
            if (this.worldMap[Math.floor(this.player.x)][Math.floor(this.player.y - this.player.dirY * moveSpeed)] === 0) this.player.y -= this.player.dirY * moveSpeed;
        }
        if (this.keys['KeyD']) {
            if (this.worldMap[Math.floor(this.player.x + this.player.planeX * moveSpeed)][Math.floor(this.player.y)] === 0) this.player.x += this.player.planeX * moveSpeed;
            if (this.worldMap[Math.floor(this.player.x)][Math.floor(this.player.y + this.player.planeY * moveSpeed)] === 0) this.player.y += this.player.planeY * moveSpeed;
        }
        if (this.keys['KeyA']) {
            if (this.worldMap[Math.floor(this.player.x - this.player.planeX * moveSpeed)][Math.floor(this.player.y)] === 0) this.player.x -= this.player.planeX * moveSpeed;
            if (this.worldMap[Math.floor(this.player.x)][Math.floor(this.player.y - this.player.planeY * moveSpeed)] === 0) this.player.y -= this.player.planeY * moveSpeed;
        }
        if (this.keys['ArrowRight']) this.rotate(-rotSpeed);
        if (this.keys['ArrowLeft']) this.rotate(rotSpeed);

        // Weapon animation
        if (this.weaponState > 0) {
            this.weaponState += deltaTime * 10;
            if (this.weaponState > 5) this.weaponState = 0;
        }

        // Enemy Logic
        this.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;
            const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
            if (dist > 0.8) {
                const dx = (this.player.x - enemy.x) / dist;
                const dy = (this.player.y - enemy.y) / dist;
                const nextX = enemy.x + dx * enemy.speed * deltaTime;
                const nextY = enemy.y + dy * enemy.speed * deltaTime;
                if (this.worldMap[Math.floor(nextX)][Math.floor(enemy.y)] === 0) enemy.x = nextX;
                if (this.worldMap[Math.floor(enemy.x)][Math.floor(nextY)] === 0) enemy.y = nextY;
            } else {
                // Attack player
                this.player.hp -= 10 * deltaTime;
            }
        });

        // Cleanup dead enemies
        this.enemies = this.enemies.filter(e => e.hp > 0);

        // Win/Loss Condition
        if (this.enemies.length === 0) {
            this.game.finish3DCombat({ result: 'win', hpRemaining: this.player.hp });
        } else if (this.player.hp <= 0) {
            this.game.finish3DCombat({ result: 'loss' });
        }
    }

    render(ctx) {
        const w = this.game.canvasWidth;
        const h = this.game.canvasHeight;

        // Ceiling and Floor
        ctx.fillStyle = '#1f2937'; // Dark Grey Ceiling
        ctx.fillRect(0, 0, w, h / 2);
        ctx.fillStyle = '#374151'; // Lighter Grey Floor
        ctx.fillRect(0, h / 2, w, h / 2);

        // Walls
        for (let x = 0; x < w; x += this.resolution) {
            const cameraX = 2 * x / w - 1;
            const rayDirX = this.player.dirX + this.player.planeX * cameraX;
            const rayDirY = this.player.dirY + this.player.planeY * cameraX;

            let mapX = Math.floor(this.player.x);
            let mapY = Math.floor(this.player.y);

            let sideDistX, sideDistY;
            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);
            let perpWallDist;
            let stepX, stepY;
            let hit = 0;
            let side;

            if (rayDirX < 0) { stepX = -1; sideDistX = (this.player.x - mapX) * deltaDistX; }
            else { stepX = 1; sideDistX = (mapX + 1.0 - this.player.x) * deltaDistX; }
            if (rayDirY < 0) { stepY = -1; sideDistY = (this.player.y - mapY) * deltaDistY; }
            else { stepY = 1; sideDistY = (mapY + 1.0 - this.player.y) * deltaDistY; }

            while (hit === 0) {
                if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
                else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
                if (this.worldMap[mapX][mapY] > 0) hit = 1;
            }

            if (side === 0) perpWallDist = (mapX - this.player.x + (1 - stepX) / 2) / rayDirX;
            else perpWallDist = (mapY - this.player.y + (1 - stepY) / 2) / rayDirY;

            const lineHeight = Math.floor(h / perpWallDist);
            let drawStart = -lineHeight / 2 + h / 2;
            if (drawStart < 0) drawStart = 0;
            let drawEnd = lineHeight / 2 + h / 2;
            if (drawEnd >= h) drawEnd = h - 1;

            let color = this.worldMap[mapX][mapY] === 1 ? '#4b5563' : '#6b7280';
            if (side === 1) color = '#374151'; // Shading

            ctx.fillStyle = color;
            ctx.fillRect(x, drawStart, this.resolution, drawEnd - drawStart);
        }

        // Sprites (Enemies)
        // Sort sprites by distance
        const spriteOrder = this.enemies.map(e => {
            return { enemy: e, dist: ((this.player.x - e.x) ** 2 + (this.player.y - e.y) ** 2) };
        }).sort((a, b) => b.dist - a.dist);

        for (const item of spriteOrder) {
            const enemy = item.enemy;
            const spriteX = enemy.x - this.player.x;
            const spriteY = enemy.y - this.player.y;

            const invDet = 1.0 / (this.player.planeX * this.player.dirY - this.player.dirX * this.player.planeY);
            const transformX = invDet * (this.player.dirY * spriteX - this.player.dirX * spriteY);
            const transformY = invDet * (-this.player.planeY * spriteX + this.player.planeX * spriteY);

            const spriteScreenX = Math.floor((w / 2) * (1 + transformX / transformY));
            const spriteHeight = Math.abs(Math.floor(h / transformY));
            const spriteWidth = Math.abs(Math.floor(h / transformY)); // Square sprites
            let spriteTop = -spriteHeight / 2 + h / 2;
            if (spriteTop < 0) spriteTop = 0;
            let spriteLeft = spriteScreenX - spriteWidth / 2;

            if (transformY > 0) { // In front of camera
                ctx.fillStyle = enemy.color;
                ctx.fillRect(spriteLeft, spriteTop, spriteWidth, spriteHeight);

                // Health Bar
                const hpPercent = enemy.hp / enemy.maxHp;
                ctx.fillStyle = 'red';
                ctx.fillRect(spriteLeft, spriteTop - 10, spriteWidth, 5);
                ctx.fillStyle = 'green';
                ctx.fillRect(spriteLeft, spriteTop - 10, spriteWidth * hpPercent, 5);
            }
        }

        // Weapon Overlay
        const weaponOffset = Math.sin(this.weaponState) * 50;
        ctx.fillStyle = '#9ca3af'; // Steel color
        ctx.beginPath();
        ctx.moveTo(w / 2, h);
        ctx.lineTo(w / 2 - 50 + weaponOffset, h - 200 - weaponOffset);
        ctx.lineTo(w / 2 + 50 + weaponOffset, h - 200 - weaponOffset);
        ctx.fill();

        // HUD
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`HP: ${Math.floor(this.player.hp)}`, 20, h - 20);
        ctx.fillText(`Enemies: ${this.enemies.length}`, 20, h - 50);

        // Crosshair
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 10, h / 2); ctx.lineTo(w / 2 + 10, h / 2);
        ctx.moveTo(w / 2, h / 2 - 10); ctx.lineTo(w / 2, h / 2 + 10);
        ctx.stroke();
    }
}
