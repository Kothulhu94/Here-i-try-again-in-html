class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasWidth = 0;
        this.canvasHeight = 0;

        this.uiManager = new UIManager(this);
        this.diplomacyManager = new DiplomacyManager();
        this.worldMap = new WorldMap();

        this.player = null;
        this.locations = [];
        this.parties = [];
        this.factions = {};
        this.locationIdCounter = 0;
        this.partyIdCounter = 0;

        this.gameTime = 12;
        this.currentDay = 1;
        this.gameState = 'title';
        this.gameSpeedMultiplier = 0;

        this.cameraX = MAP_DIMENSION / 2;
        this.cameraY = MAP_DIMENSION / 2;
        this.cameraX = MAP_DIMENSION / 2;
        this.cameraY = MAP_DIMENSION / 2;
        this.cameraZoom = 1.0;
        this.isCameraLocked = true;
        this.cameraLerpFactor = 0.1;

        this.currentLocation = null;
        this.justLeftLocation = false;

        this.animationFrameId = null;
        this.lastTimestamp = 0;

        this.isDragging = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        this.dragThreshold = 5;
        this.dragStarted = false;
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.isTapPending = false;
        this.initialPinchDistance = 0;

        this.raycaster = null;

        // Heartbeat logger to detect freezes
        this.lastHeartbeat = Date.now();

        // Global debugging - accessible from console
        window.gameDebug = {
            getState: () => ({
                gameState: this.gameState,
                gameTime: this.gameTime,
                currentDay: this.currentDay,
                speedMultiplier: this.gameSpeedMultiplier,
                partyCount: this.parties.length,
                playerParty: this.player ? this.player.party : null,
                playerPos: this.player ? { x: this.player.x, y: this.player.y } : null
            }),
            listParties: () => this.parties.map(p => ({
                name: p.name,
                type: p.partyType,
                faction: p.factionId,
                pos: { x: p.x.toFixed(0), y: p.y.toFixed(0) },
                partySize: p.getPartySize(),
                aiState: p.aiState
            })),
            getPlayer: () => this.player,
            pauseGame: () => { this.gameSpeedMultiplier = 0; console.log('⏸️ Game paused'); },
            resumeGame: () => { this.gameSpeedMultiplier = 1; console.log('▶️ Game resumed'); }
        };
        console.log('🐛 Debug mode enabled. Use window.gameDebug in console.');

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('wheel', (e) => this.onWheelZoom(e), { passive: false });
        this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onPointerUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onPointerUp(e));
        this.canvas.addEventListener('contextmenu', (e) => this.onRightClickMove(e));
        this.canvas.addEventListener('touchstart', (e) => this.onPointerDown(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onPointerMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onPointerUp(e));
        this.canvas.addEventListener('touchcancel', (e) => this.onPointerUp(e));

        this.uiManager.checkSaveGameExists();
        this.gameLoop();
    }

    async startNewGame() {
        this.uiManager.showLoadingScreen();

        // Step 1: Reset Game State
        this.uiManager.updateLoadingProgress('Resetting game state...', 10);
        await new Promise(r => setTimeout(r, 50));

        this.factions = {};
        this.parties = [];
        this.locationIdCounter = 0;
        this.partyIdCounter = 0;

        // Step 2: Generate Terrain
        this.uiManager.updateLoadingProgress('Generating world terrain...', 30);
        await new Promise(r => setTimeout(r, 50));
        this.worldMap.generateTerrain();

        // Step 3: Generate Locations
        this.uiManager.updateLoadingProgress('Building towns and villages...', 50);
        await new Promise(r => setTimeout(r, 50));
        this.generateLocations();

        // Step 4: Initialize Diplomacy
        this.uiManager.updateLoadingProgress('Establishing diplomatic relations...', 60);
        await new Promise(r => setTimeout(r, 50));
        this.diplomacyManager.initialize(this.factions);

        // Step 5: Spawn Player
        this.uiManager.updateLoadingProgress('Awakening player...', 70);
        await new Promise(r => setTimeout(r, 50));

        // Spawn player far from nearest town for isolation
        let playerStartX = MAP_DIMENSION / 2, playerStartY = MAP_DIMENSION / 2;
        if (this.locations.length > 0) {
            const towns = this.locations.filter(l => l.type === 'town');
            if (towns.length > 0) {
                // Find a spot far from all towns
                let maxMinDistance = 0;
                for (let i = 0; i < 50; i++) {
                    const testX = Math.random() * (MAP_DIMENSION * 0.8) + MAP_DIMENSION * 0.1;
                    const testY = Math.random() * (MAP_DIMENSION * 0.8) + MAP_DIMENSION * 0.1;
                    if (!this.worldMap.isImpassable(this.worldMap.getTerrainAt(testX, testY))) {
                        const minDist = Math.min(...towns.map(t => Pathfinder.getDistance(testX, testY, t.x, t.y)));
                        if (minDist > maxMinDistance) {
                            maxMinDistance = minDist;
                            playerStartX = testX;
                            playerStartY = testY;
                        }
                    }
                }
            }
        }
        while (this.worldMap.isImpassable(this.worldMap.getTerrainAt(playerStartX, playerStartY))) {
            playerStartX += (Math.random() - 0.5) * 1000; playerStartY += (Math.random() - 0.5) * 1000;
        }

        // Start with 1 'the_sleeper' unit (Cryo-Awakening scenario)
        this.player = new Party('Player', playerStartX, playerStartY, 'player', 'player', BASE_PLAYER_SPEED, [{ type: 'the_sleeper', count: 1 }], 1000, 8);
        this.player.id = ++this.partyIdCounter;

        // Step 6: Spawn AI Parties
        this.uiManager.updateLoadingProgress('Spawning factions and bandits...', 85);
        await new Promise(r => setTimeout(r, 50));

        // Spawn immediate ambush party nearby on passable terrain
        let ambushAngle = Math.random() * 2 * Math.PI;
        let ambushDistance = 300 + Math.random() * 200;
        let ambushX = playerStartX + Math.cos(ambushAngle) * ambushDistance;
        let ambushY = playerStartY + Math.sin(ambushAngle) * ambushDistance;

        // Ensure ambush spawns on passable terrain
        let attempts = 0;
        while (this.worldMap.isImpassable(this.worldMap.getTerrainAt(ambushX, ambushY)) && attempts < 50) {
            ambushAngle = Math.random() * 2 * Math.PI;
            ambushDistance = 300 + Math.random() * 200;
            ambushX = playerStartX + Math.cos(ambushAngle) * ambushDistance;
            ambushY = playerStartY + Math.sin(ambushAngle) * ambushDistance;
            attempts++;
        }

        // Create the ambush party
        const ambushParty = this.createAIParty('bandit', 'Ambush Party', ambushX, ambushY, 'bandit');
        ambushParty.forceAggressive = true; // Force them to chase immediately
        this.parties.push(ambushParty);

        // Create other random parties
        this.parties.push(this.createAIParty('bandit', 'Looter Party', 25000, 25000, 'bandit'));
        this.parties.push(this.createAIParty('bandit', 'Looter Party', 75000, 75000, 'bandit'));

        Object.values(this.factions).filter(f => f.id !== 'player').forEach(faction => {
            const capital = this.locations.find(l => l.id === faction.capitalTownId);
            if (capital) {
                this.parties.push(this.createAIParty('lord', `Lord of ${faction.name}`, capital.x + 2000, capital.y + 2000, faction.id));
            }
        });

        this.gameTime = 12; this.currentDay = 1;
        this.cameraX = this.player.x; this.cameraY = this.player.y; this.cameraZoom = 0.8;

        this.uiManager.elements.titleScreen.classList.add('hidden');
        this.uiManager.elements.uiOverlay.classList.remove('hidden');
        this.gameState = 'map';
        this.gameSpeedMultiplier = 0;

        // Sci-Fi Cryo-Awakening narrative messages
        this.uiManager.elements.messageLog.innerHTML = '';
        this.uiManager.addMessage("Cryo-stasis interrupted. Power levels critical.", "text-cyan-400");
        this.uiManager.addMessage("Scanning environment... Lifeforms detected: Primitive/Hostile.", "text-yellow-400");
        this.uiManager.addMessage("Kinetic Sidearm: Online. Survive.", "text-green-400");
        this.uiManager.addMessage("Right-click or Tap to move.", "text-zinc-400");
        this.uiManager.addMessage("Left-click & drag or Pan to move camera.", "text-zinc-400");

        this.uiManager.updatePlayerStats(this.player, this.currentDay);
        this.uiManager.updateTimeUI(this.currentDay, this.gameTime);
        this.uiManager.updateTimeControlButton();

        if (!this.animationFrameId) {
            this.lastTimestamp = 0;
            this.gameLoop();
        }

        this.uiManager.updateLoadingProgress('Ready!', 100);
        this.uiManager.hideLoadingScreen();
    }

    gameLoop(timestamp) {
        try {
            if (!this.lastTimestamp) this.lastTimestamp = timestamp;

            const timeSinceLastFrame = timestamp - this.lastTimestamp;
            if (timeSinceLastFrame < 1000 / 60) {
                this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
                return;
            }

            const deltaTime = timeSinceLastFrame / 1000;
            this.lastTimestamp = timestamp;

            if (this.gameState === 'map' && this.gameSpeedMultiplier > 0) {
                this.update(deltaTime);
            } else if (this.gameState === 'fps_combat' && this.raycaster) {
                this.raycaster.update(deltaTime);
            }

            this.render();
            this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
        } catch (error) {
            console.error('❌ GAME LOOP ERROR:', error);
            console.error('Stack:', error.stack);
            console.log('Game State:', this.gameState);
            console.log('Game Time:', this.gameTime);
            console.log('Current Day:', this.currentDay);
            console.log('Parties:', this.parties.length);
            throw error; // Re-throw to stop execution
        }
    }

    update(deltaTime) {
        const gameHoursPassed = (deltaTime / REAL_SECONDS_PER_GAME_HOUR) * this.gameSpeedMultiplier;
        this.gameTime += gameHoursPassed;

        const newDay = Math.floor(this.gameTime / 24) + 1;
        if (newDay > this.currentDay) {
            this.currentDay = newDay;
            console.log('📅 DAY', newDay, '| Time:', this.gameTime.toFixed(1), '| Parties:', this.parties.length);
            this.dailyUpdate();
        }
        this.uiManager.updateTimeUI(this.currentDay, this.gameTime);

        this.player.updateSpeed();
        const wasMoving = this.player.path && this.player.path.length > 0;
        this.player.move(gameHoursPassed, this.worldMap);
        const isMoving = this.player.path && this.player.path.length > 0;

        // Only pause if we JUST arrived (was moving, now stopped, and close to target)
        if (wasMoving && !isMoving && Pathfinder.getDistance(this.player.x, this.player.y, this.player.targetX, this.player.targetY) < 10) {
            this.gameSpeedMultiplier = 0;
            this.uiManager.updateTimeControlButton();
        }

        this.aiUpdateCounter = (this.aiUpdateCounter || 0) + 1;
        this.parties.forEach((party, index) => {
            try {
                if (this.aiUpdateCounter % 3 === 0) party.updateAI(this);
                party.move(gameHoursPassed, this.worldMap);
            } catch (error) {
                console.error(`❌ Error updating party ${index} (${party.name}):`, error);
                throw error;
            }
        });

        this.checkPartyArrivals();
        this.checkInteractions();
        this.checkPartyArrivals();
        this.checkInteractions();
        this.uiManager.updatePlayerStats(this.player, this.currentDay);

        // Smart Camera Logic
        if (this.isCameraLocked && this.player) {
            this.cameraX += (this.player.x - this.cameraX) * this.cameraLerpFactor;
            this.cameraY += (this.player.y - this.cameraY) * this.cameraLerpFactor;

            // Snap if close enough to prevent jitter
            if (Math.abs(this.player.x - this.cameraX) < 1) this.cameraX = this.player.x;
            if (Math.abs(this.player.y - this.cameraY) < 1) this.cameraY = this.player.y;
        }
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        if (this.gameState === 'title') return;

        if (this.gameState === 'fps_combat' && this.raycaster) {
            this.raycaster.render(this.ctx);
            return;
        }

        this.worldMap.render(this.ctx, this);

        this.locations.forEach(loc => loc.render(this.ctx, this));
        this.parties.forEach(party => party.render(this.ctx, this));
        if (this.player) {
            if (this.player.path && this.player.path.length > 0) {
                const playerScreen = this.worldToScreen(this.player.x, this.player.y);
                this.ctx.beginPath();
                this.ctx.moveTo(playerScreen.x, playerScreen.y);
                for (const node of this.player.path) {
                    const nodeScreen = this.worldToScreen(node[0], node[1]);
                    this.ctx.lineTo(nodeScreen.x, nodeScreen.y);
                }
                this.ctx.strokeStyle = 'rgba(135, 206, 250, 0.6)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            this.player.render(this.ctx, this);
        }
    }

    worldToScreen(worldX, worldY) {
        const screenX = (worldX - this.cameraX) * this.cameraZoom + this.canvasWidth / 2;
        const screenY = (worldY - this.cameraY) * this.cameraZoom + this.canvasHeight / 2;
        return { x: screenX, y: screenY };
    }

    screenToWorld(screenX, screenY) {
        const worldX = (screenX - this.canvasWidth / 2) / this.cameraZoom + this.cameraX;
        const worldY = (screenY - this.canvasHeight / 2) / this.cameraZoom + this.cameraY;
        return { x: worldX, y: worldY };
    }

    resizeCanvas() {
        this.canvasWidth = this.canvas.clientWidth;
        this.canvasHeight = this.canvas.clientHeight;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
    }

    pauseGame() {
        this.gameSpeedMultiplier = 0;
        this.uiManager.updateTimeControlButton();
    }

    dailyUpdate() {
        this.uiManager.addMessage(`A new day has dawned. It is Day ${this.currentDay}.`, 'text-yellow-300');
        this.locations.forEach(loc => loc.dailyUpdate(this));
        this.diplomacyManager.dailyUpdate(this);
    }

    checkPartyArrivals() {
        this.parties = this.parties.filter(party => {
            if (party.partyType === 'caravan' && (!party.path || party.path.length === 0)) {
                const destination = this.locations.find(l => l.id === party.destinationId);
                const origin = this.locations.find(l => l.id === party.originId);

                if (!destination || !origin) {
                    return false;
                }

                if (destination.id !== origin.id && this.diplomacyManager.areFactionsAtWar(party.factionId, destination.factionId)) {
                    this.uiManager.addMessage(`${party.name} is returning to ${origin.name} due to war.`, 'text-orange-300');
                    party.destinationId = origin.id;
                    party.targetX = origin.x;
                    party.targetY = origin.y;
                    party.path = Pathfinder.findPathAStar(party.x, party.y, party.targetX, party.targetY, this.worldMap);
                    return true;
                }

                if (destination.id !== origin.id) {
                    if (party.aiState === 'delivering') {
                        for (const goodKey in party.inventory) {
                            const amount = party.inventory[goodKey];
                            destination.inventory[goodKey] = (destination.inventory[goodKey] || 0) + amount;
                            const value = destination.calculatePrice(goodKey, this) * amount * 0.8;
                            party.gold = (party.gold || 0) + value;
                            destination.treasury = Math.max(0, destination.treasury - value);
                        }
                    } else if (party.aiState === 'town_selling') {
                        let earnedGold = 0;
                        for (const goodKey in party.inventory) {
                            const amount = party.inventory[goodKey];
                            const value = destination.calculatePrice(goodKey, this) * amount;
                            if (destination.treasury >= value) {
                                destination.treasury -= value;
                                destination.inventory[goodKey] = (destination.inventory[goodKey] || 0) + amount;
                                earnedGold += value;
                            }
                        }
                        party.gold = (party.gold || 0) + earnedGold;
                        for (const neededGood of (party.shoppingList || [])) {
                            const price = destination.calculatePrice(neededGood, this);
                            if (price > 0 && party.gold > price) {
                                const toBuy = Math.min(destination.inventory[neededGood] || 0, Math.floor(party.gold / price), 20);
                                if (toBuy > 0) {
                                    const cost = toBuy * price;
                                    party.gold -= cost; destination.inventory[neededGood] -= toBuy; destination.treasury += cost;
                                    party.inventory[neededGood] = (party.inventory[neededGood] || 0) + toBuy;
                                }
                            }
                        }
                    }
                    party.inventory = {};

                    if (party.factionId !== destination.factionId) {
                        this.diplomacyManager.modifyRelation(party.factionId, destination.factionId, 0.5, this);
                    }

                    party.destinationId = origin.id;
                    party.targetX = origin.x;
                    party.targetY = origin.y;
                    party.path = Pathfinder.findPathAStar(party.x, party.y, party.targetX, party.targetY, this.worldMap);
                    return true;
                } else {
                    if (origin.type === 'village') {
                        origin.gold += party.gold || 0;
                    } else if (origin.type === 'town') {
                        origin.treasury += party.gold || 0;
                        for (const goodKey in party.inventory) {
                            origin.inventory[goodKey] = (origin.inventory[goodKey] || 0) + party.inventory[goodKey];
                        }
                    }
                    return false;
                }
            }
            return true;
        });
    }

    isHostile(p1, p2) {
        if (!p1 || !p2) return false;
        const type1 = p1.partyType, faction1 = p1.factionId;
        const type2 = p2.partyType, faction2 = p2.factionId;

        if (faction1 === faction2) return false;

        if (faction1 === 'beast' && faction2 !== 'beast') return true;
        if (faction2 === 'beast' && faction1 !== 'beast') return true;

        const isCivilianOrLord1 = ['player', 'caravan', 'lord'].includes(type1);
        const isCivilianOrLord2 = ['player', 'caravan', 'lord'].includes(type2);
        if (faction1 === 'bandit' && isCivilianOrLord2) return true;
        if (faction2 === 'bandit' && isCivilianOrLord1) return true;

        const majorFactions = this.diplomacyManager.factionIds || [];
        if (majorFactions.includes(faction1) && majorFactions.includes(faction2)) {
            return this.diplomacyManager.areFactionsAtWar(faction1, faction2);
        }

        return false;
    }

    checkInteractions(recursionDepth = 0) {
        if (recursionDepth > 10) {
            console.error('🚨 RECURSION LIMIT HIT in checkInteractions!');
            console.log('Player:', this.player.x, this.player.y);
            console.log('Parties:', this.parties.map(p => ({ name: p.name, x: p.x, y: p.y, type: p.partyType })));
            return; // Prevent infinite recursion
        }

        if (this.gameState !== 'map') return;

        for (const loc of this.locations) {
            const dist = Pathfinder.getDistance(this.player.x, this.player.y, loc.x, loc.y);
            const distToTarget = Pathfinder.getDistance(this.player.targetX, this.player.targetY, loc.x, loc.y);

            // If we have moved far enough away from the location we just left, clear the flag
            if (this.justLeftLocation === loc.id && dist > 1200) {
                this.justLeftLocation = null;
            }

            // Enter location if close enough and we didn't just leave it
            // AND if the location is our actual destination (target is close to location)
            // We use 3500 as threshold because towns are large (4500 width)
            if (dist < 1000 && this.justLeftLocation !== loc.id && distToTarget < 3500) {
                this.player.path = [];
                if (loc.type === 'town') { this.uiManager.openTownModal(loc); return; }
                if (loc.type === 'village') { this.uiManager.openVillageModal(loc); return; }
            }
        }

        for (const lord of this.parties.filter(p => p.partyType === 'lord' && p.path.length === 0)) {
            const target = this.locations.find(l => l.id === lord.aiDirective?.targetId);
            if (!target) continue;

            if (lord.aiDirective.type === 'siege' && target.type === 'town' && !target.isUnderSiege) {
                target.isUnderSiege = true;
                target.siegeProgress = 0;
                target.siegeAttackerId = lord.id;
                this.uiManager.addMessage(`${lord.name} is besieging ${target.name}!`, 'text-orange-500');
            } else if (lord.aiDirective.type === 'raid' && target.type === 'village' && !target.isRaided) {
                target.isRaided = true;
                target.raidCooldown = 5;
                const goldStolen = Math.min(target.gold, Math.floor(Math.random() * 500) + 200);
                target.gold -= goldStolen;
                lord.gold += goldStolen;
                this.uiManager.addMessage(`${lord.name} has raided ${target.name}!`, 'text-orange-500');
                lord.aiDirective = { type: 'patrol' };
            }
        }

        const allParties = [this.player, ...this.parties];


        for (let i = 0; i < allParties.length; i++) {
            for (let j = i + 1; j < allParties.length; j++) {
                const p1 = allParties[i];
                const p2 = allParties[j];
                if (!p1 || !p2) continue;

                const distance = Pathfinder.getDistance(p1.x, p1.y, p2.x, p2.y);
                if (distance < 150) {
                    const hostile = this.isHostile(p1, p2);


                    if (hostile) {

                        Combat.initiate(p1, p2, this);

                        this.checkInteractions(recursionDepth + 1);
                        return;
                    }
                }
            }
        }
    }

    generateLocations() {
        this.factions = {};
        const townData = [
            { name: 'Vikingr', factionId: 'vikingr', villages: [{ name: 'Vikingr Fields', p: 'grain' }, { name: 'Vikingr Woods', p: 'wood' }], needs: ['meat', 'tools', 'armor'], workshops: [{ output: 'bread', input: { 'grain': 2 }, rate: 10 }] },
            { name: 'Sarran', factionId: 'sarran', villages: [{ name: 'Sarran Dairies', p: 'butter' }, { name: 'Sarran Tanners', p: 'leather' }], needs: ['grain', 'wood', 'tools'], workshops: [{ output: 'armor', input: { 'leather': 2, 'ore': 1 }, rate: 2 }] },
            { name: 'Vaegir', factionId: 'vaegir', villages: [{ name: 'Vaegir Stables', p: 'horses' }, { name: 'Vaegir Farms', p: 'cheese' }], needs: ['grain', 'bread', 'leather', 'armor'] },
            { name: 'Rhodok', factionId: 'rhodok', villages: [{ name: 'Rhodok Mines', p: 'ore' }, { name: 'Rhodok Hunters', p: 'meat' }], needs: ['butter', 'horses', 'bread'], workshops: [{ output: 'tools', input: { 'ore': 2, 'wood': 1 }, rate: 3 }] }
        ];
        const newLocations = [];
        const MIN_TOWN_DISTANCE = 20000, MIN_VILLAGE_DISTANCE = 4000, MAX_VILLAGE_DISTANCE = 6000, MIN_VILLAGE_TO_VILLAGE_DISTANCE = 2000, EDGE_MARGIN = 5000, MAX_TOWN_ATTEMPTS = 100;
        const spawnedTowns = [];
        const findValidPoint = (minX, maxX, minY, maxY, maxTries = 20) => {
            for (let i = 0; i < maxTries; i++) {
                const x = Math.random() * (maxX - minX) + minX, y = Math.random() * (maxY - minY) + minY;
                if (!this.worldMap.isImpassable(this.worldMap.getTerrainAt(x, y))) return { x, y };
            } return null;
        };

        this.factions['player'] = { ...FACTIONS['player'], id: 'player', capitalTownId: null, treasury: 0 };

        const mapW = this.worldMap.mapWidth;
        const mapH = this.worldMap.mapHeight;
        const midX = mapW / 2;
        const midY = mapH / 2;
        // Padding from center to ensure they are pushed towards corners, but not strictly in the corner
        const centerPadding = 15000;

        // Define 4 quadrants
        const quadrants = [
            { minX: EDGE_MARGIN, maxX: midX - centerPadding, minY: EDGE_MARGIN, maxY: midY - centerPadding }, // Top-Left
            { minX: midX + centerPadding, maxX: mapW - EDGE_MARGIN, minY: EDGE_MARGIN, maxY: midY - centerPadding }, // Top-Right
            { minX: EDGE_MARGIN, maxX: midX - centerPadding, minY: midY + centerPadding, maxY: mapH - EDGE_MARGIN }, // Bottom-Left
            { minX: midX + centerPadding, maxX: mapW - EDGE_MARGIN, minY: midY + centerPadding, maxY: mapH - EDGE_MARGIN } // Bottom-Right
        ];

        // Shuffle quadrants
        for (let i = quadrants.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [quadrants[i], quadrants[j]] = [quadrants[j], quadrants[i]];
        }

        townData.forEach((data, index) => {
            let townPos = null;
            // Use assigned quadrant if available (we have 4 towns and 4 quadrants)
            const quad = quadrants[index] || { minX: EDGE_MARGIN, maxX: mapW - EDGE_MARGIN, minY: EDGE_MARGIN, maxY: mapH - EDGE_MARGIN };

            // Try to find a valid spot in the quadrant
            townPos = findValidPoint(quad.minX, quad.maxX, quad.minY, quad.maxY, MAX_TOWN_ATTEMPTS);

            // Fallback: if quadrant is bad (e.g. all water), try the whole map
            if (!townPos) {
                console.warn(`Could not place ${data.name} in quadrant, falling back to global search.`);
                townPos = findValidPoint(EDGE_MARGIN, mapW - EDGE_MARGIN, EDGE_MARGIN, mapH - EDGE_MARGIN, MAX_TOWN_ATTEMPTS);
            }

            if (townPos) {
                const townId = ++this.locationIdCounter;
                const faction = FACTIONS[data.factionId];
                if (faction && !this.factions[data.factionId]) {
                    this.factions[data.factionId] = { ...faction, id: data.factionId, capitalTownId: townId, treasury: 50000 };
                }
                const townObject = new Town(townId, data.name, townPos.x, townPos.y, data.factionId, 1, data);
                spawnedTowns.push({ ...townPos });
                const spawnedVillagesForTown = [];
                for (const villageData of data.villages) {
                    let villagePos = null;
                    for (let i = 0; i < 250; i++) {
                        const angle = Math.random() * 2 * Math.PI, distance = Math.random() * (MAX_VILLAGE_DISTANCE - MIN_VILLAGE_DISTANCE) + MIN_VILLAGE_DISTANCE;
                        const vx = townPos.x + Math.cos(angle) * distance, vy = townPos.y + Math.sin(angle) * distance;
                        if (vx > EDGE_MARGIN && vx < this.worldMap.mapWidth - EDGE_MARGIN && vy > EDGE_MARGIN && vy < this.worldMap.mapHeight - EDGE_MARGIN && !this.worldMap.isImpassable(this.worldMap.getTerrainAt(vx, vy))) {
                            if (spawnedVillagesForTown.every(v => Pathfinder.getDistance(vx, vy, v.x, v.y) > MIN_VILLAGE_TO_VILLAGE_DISTANCE)) { villagePos = { x: vx, y: vy }; break; }
                        }
                    }
                    if (villagePos) {
                        const villageId = ++this.locationIdCounter;
                        townObject.villageIds.push(villageId);
                        spawnedVillagesForTown.push({ ...villagePos });
                        newLocations.push(new Village(villageId, villageData.name, villagePos.x, villagePos.y, data.factionId, 1, villageData.p, townId));
                    }
                }
                newLocations.push(townObject);
            }
        });

        const NUM_DENS = 5, MIN_DIST_FROM_TOWN = 5000;
        for (let i = 0; i < NUM_DENS; i++) {
            let denPos = null;
            for (let attempt = 0; attempt < 100; attempt++) {
                const candidatePos = findValidPoint(EDGE_MARGIN, this.worldMap.mapWidth - EDGE_MARGIN, EDGE_MARGIN, this.worldMap.mapHeight - EDGE_MARGIN, 100);
                if (candidatePos && newLocations.filter(l => l.type === 'town').every(town => Pathfinder.getDistance(candidatePos.x, candidatePos.y, town.x, town.y) >= MIN_DIST_FROM_TOWN)) {
                    denPos = candidatePos; break;
                }
            }
            if (denPos) {
                const denId = ++this.locationIdCounter;
                newLocations.push(new BeastDen(denId, 'Beast Den', denPos.x, denPos.y, 'beast', 10));
            }
        }
        this.locations = newLocations;
        this.worldMap.generateRoads(this.locations);
    }

    start3DCombat(enemyParty) {
        this.currentEnemyParty = enemyParty;
        this.gameState = 'fps_combat';
        this.raycaster = new Raycaster(this, enemyParty);
        this.uiManager.elements.uiOverlay.classList.add('hidden');
        setTimeout(() => {
            this.canvas.requestPointerLock();
        }, 100);
    }

    finish3DCombat(result) {
        console.log('🎮 finish3DCombat called, result:', result);
        if (this.raycaster) {
            console.log('🧹 Cleaning up raycaster...');
            this.raycaster.cleanup();
            this.raycaster = null;
            this.lastHeartbeat = Date.now();
        }
        document.exitPointerLock();
        this.uiManager.elements.uiOverlay.classList.remove('hidden');

        if (result.result === 'win') {
            console.log('🎉 Victory! Generating loot...');
            this.gameState = 'loot';

            const hpRatio = result.hpRemaining / 100;
            const losses = Math.floor(this.player.getPartySize() * (1 - hpRatio) * 0.5);

            if (losses > 0) {
                this.player.party = Party.removeTroops(this.player.party, losses);
                this.uiManager.addMessage(`You lost ${losses} troops in the battle.`, "text-red-400");
            }

            const renownGain = 10;
            this.player.renown += renownGain;
            this.uiManager.addMessage(`Gained ${renownGain} Renown.`, "text-yellow-400");

            // Generate and Award Loot
            const loot = this.generateBattleLoot(this.currentEnemyParty);
            this.player.gold += loot.gold;
            for (const [item, count] of Object.entries(loot.inventory)) {
                this.player.inventory[item] = (this.player.inventory[item] || 0) + count;
            }

            this.uiManager.showLootModal(loot);

            if (this.currentEnemyParty) {
                this.parties = this.parties.filter(p => p !== this.currentEnemyParty);
                this.currentEnemyParty = null;
            }
        } else {
            console.log('💀 Defeat. Retreating...');
            this.gameState = 'map';

            this.uiManager.addMessage("Defeated in 3D Combat...", "text-red-600");
            const losses = Math.floor(this.player.getPartySize() * 0.5);
            this.player.party = Party.removeTroops(this.player.party, losses);
            this.uiManager.addMessage(`You lost ${losses} troops and retreated.`, "text-red-400");
            this.player.x += (Math.random() - 0.5) * 2000;
            this.player.y += (Math.random() - 0.5) * 2000;
        }

        this.uiManager.updatePlayerStats(this.player, this.currentDay);
    }

    generateBattleLoot(defeatedParty) {
        let totalGold = 0;
        const inventory = {};

        if (!defeatedParty || !defeatedParty.party) return { gold: 0, inventory: {} };

        // Loot from troops
        defeatedParty.party.forEach(troop => {
            const count = troop.count;
            const type = troop.type;

            if (type === 'wild_beast') {
                // Beasts drop resources
                const goods = ['meat', 'leather'];
                const dropChance = 0.5;
                for (let i = 0; i < count; i++) {
                    if (Math.random() < dropChance) {
                        const good = goods[Math.floor(Math.random() * goods.length)];
                        inventory[good] = (inventory[good] || 0) + 1;
                    }
                }
            } else {
                // Humans drop gold
                const goldPerUnit = 5 + Math.floor(Math.random() * 10); // 5-15 gold
                totalGold += goldPerUnit * count;

                // Small chance for random supplies
                if (Math.random() < 0.2) {
                    const goods = ['grain', 'tools', 'wood', 'bread'];
                    const good = goods[Math.floor(Math.random() * goods.length)];
                    inventory[good] = (inventory[good] || 0) + Math.floor(Math.random() * 2) + 1;
                }
            }
        });

        // Loot party treasury
        if (defeatedParty.gold > 0) {
            totalGold += defeatedParty.gold;
        }

        // Loot party inventory (if any)
        if (defeatedParty.inventory) {
            for (const [item, count] of Object.entries(defeatedParty.inventory)) {
                inventory[item] = (inventory[item] || 0) + count;
            }
        }

        return { gold: totalGold, inventory };
    }

    createAIParty(partyType, name, x, y, factionId) {
        let party, speed, radius = 6, gold = 0;

        switch (partyType) {
            case 'bandit': party = [{ type: 'looter', count: 10 + Math.floor(Math.random() * 10) }]; speed = 15000; break;
            case 'caravan': party = [{ type: 'spearman', count: 5 }]; speed = 13000; radius = 4; break;
            case 'beast': party = []; speed = 17000; radius = 7; break;
            case 'lord': party = [{ type: 'spearman', count: 20 }, { type: 'swordsman', count: 5 }]; speed = 16000; gold = 5000; break;
            default: party = []; speed = 15000;
        }

        let locX = x, locY = y, attempts = 0;
        while (this.worldMap.isImpassable(this.worldMap.getTerrainAt(locX, locY)) && attempts < 50) {
            locX = x + (Math.random() - 0.5) * 4000; locY = y + (Math.random() - 0.5) * 4000; attempts++;
        }
        const newParty = new Party(name, locX, locY, partyType, factionId, speed, party, gold, radius);
        newParty.id = ++this.partyIdCounter;
        return newParty;
    }

    saveGame() {
        try {
            const saveData = {
                player: this.player,
                locations: this.locations,
                parties: this.parties,
                factions: this.factions,
                gameTime: this.gameTime,
                currentDay: this.currentDay,
                cameraX: this.cameraX,
                cameraY: this.cameraY,
                cameraZoom: this.cameraZoom,
                locationIdCounter: this.locationIdCounter,
                partyIdCounter: this.partyIdCounter,
                terrainGrid: this.worldMap.terrainGrid,
                diplomacy: {
                    relations: this.diplomacyManager.relations,
                    states: this.diplomacyManager.states,
                    warExhaustion: this.diplomacyManager.warExhaustion,
                    factionIds: this.diplomacyManager.factionIds,
                }
            };
            localStorage.setItem('bannerlord2d_save', JSON.stringify(saveData));
            this.uiManager.addMessage("Game Saved Successfully!", 'text-green-400');
            if (this.gameState === 'paused') this.uiManager.closeStats();
        } catch (error) {
            console.error("Error saving game:", error);
            this.uiManager.addMessage("Failed to save game. Storage might be full.", 'text-red-500');
        }
    }

    async loadGame() {
        this.uiManager.showLoadingScreen();
        this.uiManager.updateLoadingProgress('Reading save file...', 10);
        await new Promise(r => setTimeout(r, 100));

        const savedDataString = localStorage.getItem('bannerlord2d_save');
        if (!savedDataString) {
            this.uiManager.addMessage("No save game found.", 'text-red-400');
            this.uiManager.hideLoadingScreen();
            return false;
        }
        try {
            const saveData = JSON.parse(savedDataString);

            this.uiManager.updateLoadingProgress('Restoring world map...', 30);
            await new Promise(r => setTimeout(r, 50));
            this.worldMap.terrainGrid = saveData.terrainGrid;

            this.uiManager.updateLoadingProgress('Rebuilding locations...', 50);
            await new Promise(r => setTimeout(r, 50));
            this.locations = saveData.locations.map(locData => {
                if (locData.type === 'town') return Object.assign(new Town(0, '', 0, 0, '', 0, {}), locData);
                if (locData.type === 'village') return Object.assign(new Village(0, '', 0, 0, '', 0, '', 0, ''), locData);
                if (locData.type === 'beast_den') return Object.assign(new BeastDen(0, '', 0, 0, '', 0), locData);
                return Object.assign(new Location(0, '', 0, 0, ''), locData);
            });

            this.uiManager.updateLoadingProgress('Mustering parties...', 70);
            await new Promise(r => setTimeout(r, 50));
            this.parties = saveData.parties.map(pData => {
                const p = Object.assign(new Party('', 0, 0, '', '', 0, []), pData);
                p.path = p.path || [];
                return p;
            });
            this.player = Object.assign(new Party('', 0, 0, '', '', 0, []), saveData.player);
            this.player.path = this.player.path || [];

            this.factions = saveData.factions;

            this.uiManager.updateLoadingProgress('Restoring diplomacy...', 85);
            await new Promise(r => setTimeout(r, 50));
            this.diplomacyManager.initialize(this.factions);
            if (saveData.diplomacy) {
                this.diplomacyManager.relations = saveData.diplomacy.relations;
                this.diplomacyManager.states = saveData.diplomacy.states;
                this.diplomacyManager.warExhaustion = saveData.diplomacy.warExhaustion || {};
                this.diplomacyManager.factionIds = saveData.diplomacy.factionIds;
            }

            this.gameTime = saveData.gameTime; this.currentDay = saveData.currentDay;
            this.cameraX = saveData.cameraX; this.cameraY = saveData.cameraY;
            this.cameraZoom = saveData.cameraZoom;
            this.locationIdCounter = saveData.locationIdCounter;
            this.partyIdCounter = saveData.partyIdCounter || 0;

            this.uiManager.elements.titleScreen.classList.add('hidden');
            this.uiManager.elements.uiOverlay.classList.remove('hidden');
            this.uiManager.closeStats();
            this.gameState = 'map';

            this.uiManager.updatePlayerStats(this.player, this.currentDay);
            this.uiManager.updateTimeUI(this.currentDay, this.gameTime);
            this.uiManager.updateTimeControlButton();
            this.uiManager.elements.messageLog.innerHTML = '';
            this.uiManager.addMessage("Game Loaded Successfully!", 'text-green-400');

            this.uiManager.updateLoadingProgress('Ready!', 100);
            this.uiManager.hideLoadingScreen();
            return true;
        } catch (error) {
            console.error("Error loading game:", error);
            this.uiManager.addMessage("Failed to load save data. It may be corrupted.", 'text-red-500');
            localStorage.removeItem('bannerlord2d_save');
            this.uiManager.hideLoadingScreen();
            return false;
        }
    }

    onWheelZoom(e) {
        e.preventDefault(); if (this.gameState !== 'map') return;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPosBeforeZoom = this.screenToWorld(mouseX, mouseY);
        const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
        this.cameraZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.cameraZoom * zoomAmount));
        const worldPosAfterZoom = this.screenToWorld(mouseX, mouseY);
        this.cameraX += worldPosBeforeZoom.x - worldPosAfterZoom.x;
        this.cameraY += worldPosBeforeZoom.y - worldPosAfterZoom.y;
    }

    onPointerDown(e) {
        if (e.type === 'mousedown' && e.button !== 0) return; if (this.gameState !== 'map') return;
        const pos = e.touches ? getTouchPos(e.touches[0], this.canvas) : { x: e.clientX, y: e.clientY };
        this.isDragging = true; this.lastPanX = pos.x; this.lastPanY = pos.y; this.dragStarted = false;
        // Unlock camera when user starts interacting/dragging
        this.isCameraLocked = false;
        if (e.touches) {
            if (e.touches.length === 1) {
                this.isTapPending = true; this.touchStartTime = Date.now();
                this.touchStartPos = getTouchPos(e.touches[0], this.canvas);
            } else if (e.touches.length === 2) {
                this.isTapPending = false;
                const pos0 = getTouchPos(e.touches[0], this.canvas), pos1 = getTouchPos(e.touches[1], this.canvas);
                this.initialPinchDistance = Pathfinder.getDistance(pos0.x, pos0.y, pos1.x, pos1.y);
            }
        }
    }

    onPointerMove(e) {
        if (!this.isDragging) return;
        if (e.touches && e.touches.length === 2) {
            if (this.initialPinchDistance <= 0) return;
            const pos0 = getTouchPos(e.touches[0], this.canvas), pos1 = getTouchPos(e.touches[1], this.canvas);
            const newPinchDistance = Pathfinder.getDistance(pos0.x, pos0.y, pos1.x, pos1.y);
            const zoomAmount = newPinchDistance / this.initialPinchDistance;
            const pinchCenter = { x: (pos0.x + pos1.x) / 2, y: (pos0.y + pos1.y) / 2 };
            const worldPosBeforeZoom = this.screenToWorld(pinchCenter.x, pinchCenter.y);
            this.cameraZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.cameraZoom * zoomAmount));
            const worldPosAfterZoom = this.screenToWorld(pinchCenter.x, pinchCenter.y);
            this.cameraX += worldPosBeforeZoom.x - worldPosAfterZoom.x;
            this.cameraY += worldPosBeforeZoom.y - worldPosAfterZoom.y;
            this.initialPinchDistance = newPinchDistance;
            return;
        }
        const pos = e.touches ? getTouchPos(e.touches[0], this.canvas) : { x: e.clientX, y: e.clientY };
        if (!this.dragStarted) {
            if (Pathfinder.getDistance(this.lastPanX, this.lastPanY, pos.x, pos.y) > this.dragThreshold) {
                this.dragStarted = true; this.isTapPending = false;
            }
        }
        if (this.dragStarted) {
            const dx = pos.x - this.lastPanX; const dy = pos.y - this.lastPanY;
            this.cameraX -= dx / this.cameraZoom; this.cameraY -= dy / this.cameraZoom;
        }
        this.lastPanX = pos.x; this.lastPanY = pos.y;
    }

    onPointerUp(e) {
        if (this.isTapPending && !this.dragStarted) {
            if (Date.now() - this.touchStartTime < 250) {
                this.setPlayerTargetFromScreen(this.touchStartPos.x, this.touchStartPos.y);
            }
        }
        this.isDragging = false; this.dragStarted = false; this.isTapPending = false; this.initialPinchDistance = 0;
    }

    onRightClickMove(e) {
        e.preventDefault();
        this.setPlayerTargetFromScreen(e.offsetX, e.offsetY);
    }

    setPlayerTargetFromScreen(screenX, screenY) {
        if (this.gameState !== 'map') return;
        const worldCoords = this.screenToWorld(screenX, screenY);
        const terrainType = this.worldMap.getTerrainAt(worldCoords.x, worldCoords.y);
        if (this.worldMap.isImpassable(terrainType)) {
            this.uiManager.addMessage(`You cannot travel on ${TERRAIN_TYPES[terrainType].name}.`, 'text-red-400');
            return;
        }
        if (Pathfinder.getDistance(this.player.x, this.player.y, worldCoords.x, worldCoords.y) > this.player.radius * 2) {
            this.gameSpeedMultiplier = 1;
        }
        this.player.targetX = worldCoords.x;
        this.player.targetY = worldCoords.y;
        this.player.path = Pathfinder.findPathAStar(this.player.x, this.player.y, this.player.targetX, this.player.targetY, this.worldMap);
        this.player.path = Pathfinder.findPathAStar(this.player.x, this.player.y, this.player.targetX, this.player.targetY, this.worldMap);
        this.uiManager.updateTimeControlButton();
        // Lock camera when player is given a move command
        this.isCameraLocked = true;
    }
}
const getTouchPos = (touch, canvas) => {
    const rect = canvas.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
};
