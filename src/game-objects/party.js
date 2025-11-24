class Party {
    constructor(name, x, y, partyType, factionId, speed, party, gold = 0, radius = 8) {
        this.name = name;
        this.x = x; this.y = y;
        this.targetX = x; this.targetY = y;
        this.partyType = partyType;
        this.factionId = factionId;
        this.color = FACTIONS[this.factionId]?.color || '#ffffff';
        this.speed = speed;
        this.party = party;
        this.gold = gold;
        this.inventory = {};
        this.radius = radius;
        this.path = [];
        this.aiState = 'patrolling';
        this.aiDirective = { type: 'patrol' };
        this.renown = 0;
        this.influence = 0;
        this.armyLeaderId = null;
        this.allegianceType = 'none';
        this.mercenaryFactionId = null;
        this.updateSpeed();
    }

    getClanTier() {
        return Math.floor(this.renown / 50);
    }

    getMaxPartySize() {
        return 20 + (this.getClanTier() * 15);
    }

    getPartySize() {
        return Party.getPartySize(this.party);
    }
    static getPartySize(party) {
        if (!party) return 0;
        return party.reduce((sum, troop) => sum + troop.count, 0);
    }

    getPartyAttack() {
        return Party.getPartyAttack(this.party);
    }
    static getPartyAttack(party) {
        if (!party) return 0;
        return party.reduce((sum, troop) => sum + (troop.count * (TROOP_TYPES[troop.type]?.atk || 0)), 0);
    }

    getPartyDefense() {
        return Party.getPartyDefense(this.party);
    }
    static getPartyDefense(party) {
        if (!party) return 0;
        return party.reduce((sum, troop) => sum + (troop.count * (TROOP_TYPES[troop.type]?.def || 0)), 0);
    }

    getPartyPower() {
        return Party.getPartyPower(this.party);
    }
    static getPartyPower(party) {
        if (!party) return 0;
        return party.reduce((sum, troop) => sum + (troop.count * (TROOP_TYPES[troop.type]?.power || 0)), 0);
    }

    addTroops(type, count) {
        const existingTroop = this.party.find(t => t.type === type);
        if (existingTroop) {
            existingTroop.count += count;
        } else {
            this.party.push({ type, count });
        }
        this.updateSpeed();
    }

    static removeTroops(party, losses) {
        let totalLosses = Math.round(losses);
        if (!party) return [];

        const sortedTroopIndices = party.map((t, i) => ({ ...t, originalIndex: i }))
            .sort((a, b) => (TROOP_TYPES[a.type]?.cost || 0) - (TROOP_TYPES[b.type]?.cost || 0));

        for (let troopInfo of sortedTroopIndices) {
            if (totalLosses <= 0) break;
            const originalTroop = party[troopInfo.originalIndex];
            const lost = Math.min(originalTroop.count, totalLosses);
            originalTroop.count -= lost;
            totalLosses -= lost;
        }
        return party.filter(t => t.count > 0);
    }

    updateSpeed() {
        if (this.partyType !== 'player') return;
        const speedMod = Math.max(0.5, 1 - (this.getPartySize() / 200));
        this.speed = BASE_PLAYER_SPEED * speedMod;
    }

    move(hoursPassed, worldMap) {
        if (!this.path || this.path.length === 0) return;

        let speedMod = 1.0;
        if (worldMap) {
            const terrain = worldMap.getTerrainAt(this.x, this.y);
            speedMod = TERRAIN_TYPES[terrain]?.speedModifier || 1.0;
            if (worldMap.isRoadAt(this.x, this.y)) speedMod = TERRAIN_TYPES['road'].speedModifier;
        }

        let distanceToTravel = this.speed * speedMod * hoursPassed;
        while (distanceToTravel > 0 && this.path.length > 0) {
            const nextNode = this.path[0];
            const distToNextNode = Pathfinder.getDistance(this.x, this.y, nextNode[0], nextNode[1]);
            if (distanceToTravel >= distToNextNode) {
                this.x = nextNode[0]; this.y = nextNode[1];
                distanceToTravel -= distToNextNode;
                this.path.shift();
            } else {
                const angle = Math.atan2(nextNode[1] - this.y, nextNode[0] - this.x);
                this.x += Math.cos(angle) * distanceToTravel;
                this.y += Math.sin(angle) * distanceToTravel;
                distanceToTravel = 0;
            }
        }
    }

    updateAI(game) {
        if (this.partyType === 'player' || this.partyType === 'caravan') return;

        // Early aggressive override for forced chase parties (e.g., ambush)
        if (this.forceAggressive) {
            this.aiState = 'chasing';
            this.targetX = game.player.x;
            this.targetY = game.player.y;
            this.path = Pathfinder.findPathAStar(this.x, this.y, this.targetX, this.targetY, game.worldMap);
            return;
        }
        if (this.armyLeaderId) {
            const leader = game.player.id === this.armyLeaderId ? game.player : game.parties.find(p => p.id === this.armyLeaderId);
            if (leader) {
                this.aiState = 'following_army';
                if (Pathfinder.getDistance(this.x, this.y, leader.x, leader.y) > 200) {
                    this.targetX = leader.x; this.targetY = leader.y;
                    this.path = Pathfinder.findPathAStar(this.x, this.y, this.targetX, this.targetY, game.worldMap);
                } else {
                    this.path = [];
                }
                return;
            } else {
                this.armyLeaderId = null; // Leader lost/destroyed
            }
        }

        const SIGHT_RANGE = 4000;
        const nearbyHostiles = [game.player, ...game.parties].filter(p => p !== this && game.isHostile(this, p) && Pathfinder.getDistance(this.x, this.y, p.x, p.y) < SIGHT_RANGE);

        if (nearbyHostiles.length > 0) {
            const myPower = this.getPartyPower();
            const strongestEnemy = nearbyHostiles.reduce((strongest, current) => current.getPartyPower() > strongest.getPartyPower() ? current : strongest, nearbyHostiles[0]);

            if (myPower > strongestEnemy.getPartyPower() * 1.2) {
                this.aiState = 'chasing'; this.targetX = strongestEnemy.x; this.targetY = strongestEnemy.y;
                this.path = Pathfinder.findPathAStar(this.x, this.y, this.targetX, this.targetY, game.worldMap); return;
            } else {
                this.aiState = 'fleeing';
                const angle = Math.atan2(this.y - strongestEnemy.y, this.x - strongestEnemy.x);
                this.targetX = this.x + Math.cos(angle) * 5000; this.targetY = this.y + Math.sin(angle) * 5000;
                this.path = Pathfinder.findPathAStar(this.x, this.y, this.targetX, this.targetY, game.worldMap); return;
            }
        }

        if (this.partyType === 'lord') {
            if (this.path.length === 0 || this.aiState !== `executing_${this.aiDirective.type}`) {
                this.aiState = `executing_${this.aiDirective.type}`;

                let foundNewTask = false;
                switch (this.aiDirective.type) {
                    case 'siege':
                    case 'raid':
                    case 'defend':
                        const targetLocation = game.locations.find(l => l.id === this.aiDirective.targetId);
                        if (targetLocation) {
                            let destX = targetLocation.x, destY = targetLocation.y;
                            if (this.aiDirective.type === 'defend') {
                                const angle = Math.random() * 2 * Math.PI;
                                const distance = 2000 + Math.random() * 3000;
                                destX += Math.cos(angle) * distance;
                                destY += Math.sin(angle) * distance;
                            }
                            this.targetX = destX; this.targetY = destY;
                            this.path = Pathfinder.findPathAStar(this.x, this.y, this.targetX, this.targetY, game.worldMap);
                            foundNewTask = true;
                        }
                        break;

                    case 'hunt':
                        const targets = game.parties.filter(p =>
                            p.partyType === this.aiDirective.targetType &&
                            game.isHostile(this, p)
                        );
                        if (targets.length > 0) {
                            let closestTarget = targets[0];
                            let minDistance = Pathfinder.getDistance(this.x, this.y, closestTarget.x, closestTarget.y);
                            for (let i = 1; i < targets.length; i++) {
                                const dist = Pathfinder.getDistance(this.x, this.y, targets[i].x, targets[i].y);
                                if (dist < minDistance) {
                                    minDistance = dist;
                                    closestTarget = targets[i];
                                }
                            }
                            this.targetX = closestTarget.x; this.targetY = closestTarget.y;
                            this.path = Pathfinder.findPathAStar(this.x, this.y, this.targetX, this.targetY, game.worldMap);
                            foundNewTask = true;
                        }
                        break;
                }
                if (foundNewTask) return;
            } else {
                if (this.aiDirective.type !== 'patrol') return;
            }
        }

        if ((this.path.length === 0 || this.aiState === 'fleeing' || this.aiState === 'chasing')) {
            this.aiState = 'patrolling';
            let targetX, targetY, attempts = 0;
            do {
                const angle = Math.random() * 2 * Math.PI;
                const distance = 5000 + Math.random() * 10000;
                targetX = this.x + Math.cos(angle) * distance;
                targetY = this.y + Math.sin(angle) * distance;
                attempts++;
            } while (game.worldMap.isImpassable(game.worldMap.getTerrainAt(targetX, targetY)) && attempts < 10);
            this.targetX = targetX; this.targetY = targetY;
            this.path = Pathfinder.findPathAStar(this.x, this.y, this.targetX, this.targetY, game.worldMap);
        }
    }

    render(ctx, game) {
        const screenPos = game.worldToScreen(this.x, this.y);
        const screenRadius = this.radius * game.cameraZoom;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        if (this === game.player) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
}
