class Location {
    constructor(id, name, x, y, factionId) {
        this.id = id;
        this.name = name;
        this.x = x; this.y = y;
        this.factionId = factionId;
        this.type = 'location';
    }

    calculatePrice(goodKey, game) {
        const good = GOODS[goodKey];
        if (!good) return 9999;
        let stock = (this.inventory && this.inventory[goodKey]) ? this.inventory[goodKey] : 1;
        let priceModifier = Math.max(0.2, Math.min(5, good.idealStock / Math.max(1, stock)));

        if (good.type === 'military' && game.diplomacyManager.isFactionAtWarWithAnyone(this.factionId)) {
            priceModifier *= 1.5;
        }

        return Math.round(good.basePrice * priceModifier);
    }
}

class Town extends Location {
    constructor(id, name, x, y, factionId, level, data) {
        super(id, name, x, y, factionId);
        this.type = 'town';
        this.inventory = { grain: 100, wood: 100, ore: 50, leather: 50, bread: 30, tools: 10, armor: 5 };
        this.barracks = { spearman: 20, swordsman: 10 };
        this.garrison = [{ type: 'spearman', count: 50 }];
        this.treasury = 10000;
        this.level = level;
        this.workshops = data.workshops || [];
        this.needs = data.needs || [];
        this.consumptionRate = 2;
        this.villageIds = [];
        this.isUnderSiege = false;
        this.siegeProgress = 0;
        this.siegeAttackerId = null;
        this.hadShortageRecently = false;
    }

    dailyUpdate(game) {
        this.hadShortageRecently = false;
        if (this.isUnderSiege) {
            this.siegeProgress++;
            if (this.siegeProgress >= 3) {
                const attacker = game.parties.find(p => p.id === this.siegeAttackerId);
                if(attacker) {
                     Combat.resolveSiege(attacker, this, game);
                } else {
                     this.isUnderSiege = false; this.siegeProgress = 0; this.siegeAttackerId = null;
                }
            }
            return;
        }

        if (Party.getPartySize(this.garrison) < this.level * 50 && this.treasury > 500) {
            const spearmanTroop = this.garrison.find(t => t.type === 'spearman');
            if (spearmanTroop) {
                spearmanTroop.count += 1;
            } else {
                this.garrison.push({ type: 'spearman', count: 1 });
            }
            this.treasury -= 5;
        }

        for (const need of this.needs) {
            const neededAmount = this.consumptionRate * this.level;
            const currentStock = this.inventory[need] || 0;
            if (currentStock >= neededAmount) {
                this.inventory[need] -= neededAmount;
            } else {
                this.inventory[need] = 0;
                this.hadShortageRecently = true;
            }
        }
        if (this.hadShortageRecently) game.uiManager.addMessage(`${this.name} is experiencing shortages!`, 'text-orange-400');

        for (const workshop of this.workshops) {
            const productionCycles = workshop.rate * this.level;
            let canProduce = true;
            for (const inputKey in workshop.input) {
                if ((this.inventory[inputKey] || 0) < workshop.input[inputKey] * productionCycles) { canProduce = false; break; }
            }
            if (canProduce) {
                for (const inputKey in workshop.input) this.inventory[inputKey] -= workshop.input[inputKey] * productionCycles;
                this.inventory[workshop.output] = (this.inventory[workshop.output] || 0) + productionCycles;
            }
        }

        const goods = Object.keys(this.inventory);
        for (const good of goods) {
            if (this.inventory[good] > 80 + GOODS[good].idealStock * 0.5) {
                if (!game.parties.some(p => p.originId === this.id && p.partyType === 'caravan' && p.aiState.startsWith('town_'))) {
                    this.spawnTownCaravan(game, good);
                    break;
                }
            }
        }
    }

    changeOwner(newFactionId, game) {
        this.factionId = newFactionId;
        this.villageIds.forEach(vid => {
            const village = game.locations.find(l => l.id === vid);
            if(village) village.factionId = newFactionId;
        });
    }

    spawnTownCaravan(game, goodToSell) {
        const amount = Math.min(this.inventory[goodToSell], 20);
        if (amount <= 0) return;
        const otherTowns = game.locations.filter(l => l.type === 'town' && l.id !== this.id && !game.diplomacyManager.areFactionsAtWar(this.factionId, l.factionId));
        if (otherTowns.length === 0) return;
        const destination = otherTowns[Math.floor(Math.random() * otherTowns.length)];

        const caravan = game.createAIParty('caravan', `${this.name} Caravan`, this.x, this.y, this.factionId);
        caravan.inventory[goodToSell] = amount;
        this.inventory[goodToSell] -= amount;

        caravan.destinationId = destination.id;
        caravan.originId = this.id;
        caravan.aiState = 'town_selling';
        caravan.shoppingList = this.needs;
        caravan.targetX = destination.x;
        caravan.targetY = destination.y;
        caravan.path = Pathfinder.findPathAStar(caravan.x, caravan.y, caravan.targetX, caravan.targetY, game.worldMap);
        game.parties.push(caravan);
    }

    render(ctx, game) {
        const screenPos = game.worldToScreen(this.x, this.y);
        const screenSize = 4500 * game.cameraZoom;

        const factionColor = FACTIONS[this.factionId]?.color;
        if (factionColor) {
            const borderSize = 250 * game.cameraZoom;
            ctx.fillStyle = factionColor;
            ctx.fillRect(screenPos.x - screenSize / 2 - borderSize, screenPos.y - screenSize / 2 - borderSize, screenSize + borderSize * 2, screenSize + borderSize * 2);
        }

        ctx.fillStyle = this.isUnderSiege ? '#b91c1c' : '#71717a';
        ctx.fillRect(screenPos.x - screenSize / 2, screenPos.y - screenSize / 2, screenSize, screenSize);

        if (game.cameraZoom > 0.4) {
            ctx.fillStyle = 'white'; ctx.font = `14px Inter`; ctx.textAlign = 'center'; ctx.shadowColor = 'black'; ctx.shadowBlur = 4;
            let label = this.isUnderSiege ? `SIEGE!` : `${this.name} (Lvl ${this.level})`;
            ctx.fillText(label, screenPos.x, screenPos.y - (screenSize / 2) - 5);
            ctx.shadowBlur = 0;
        }
    }
}

class Village extends Location {
    constructor(id, name, x, y, factionId, level, production, townId) {
        super(id, name, x, y, factionId);
        this.type = 'village';
        this.level = level;
        this.production = production;
        this.townId = townId;
        this.inventory = { [production]: 100 };
        this.gold = 500;
        this.isRaided = false;
        this.raidCooldown = 0;
    }

    dailyUpdate(game) {
        if (this.isRaided) {
            this.raidCooldown--;
            if (this.raidCooldown <= 0) {
                this.isRaided = false;
                game.uiManager.addMessage(`${this.name} has recovered from a raid.`, 'text-green-300');
            }
            return;
        }
        const producedAmount = (15 + Math.floor(Math.random() * 11)) * this.level;
        this.inventory[this.production] = (this.inventory[this.production] || 0) + producedAmount;
        if (this.inventory[this.production] >= 30 && !game.parties.some(p => p.originId === this.id && p.partyType === 'caravan')) {
            this.spawnVillageCaravan(game);
        }
    }

    spawnVillageCaravan(game) {
        const town = game.locations.find(l => l.id === this.townId);
        if (!town || game.diplomacyManager.areFactionsAtWar(this.factionId, town.factionId)) return;

        const goodsToTransport = this.production;
        const amount = Math.min(this.inventory[goodsToTransport], 30);
        if (amount <= 0) return;

        const caravan = game.createAIParty('caravan', `${this.name} Caravan`, this.x, this.y, this.factionId);
        caravan.inventory[goodsToTransport] = amount;
        this.inventory[goodsToTransport] -= amount;

        caravan.destinationId = town.id;
        caravan.originId = this.id;
        caravan.aiState = 'delivering';
        caravan.targetX = town.x;
        caravan.targetY = town.y;
        caravan.path = Pathfinder.findPathAStar(caravan.x, caravan.y, caravan.targetX, caravan.targetY, game.worldMap);
        game.parties.push(caravan);
    }

    render(ctx, game) {
        const screenPos = game.worldToScreen(this.x, this.y);
        const screenSize = 1000 * game.cameraZoom;

        const factionColor = FACTIONS[this.factionId]?.color;
        if (factionColor) {
            const borderSize = 150 * game.cameraZoom;
            ctx.fillStyle = factionColor;
            ctx.fillRect(screenPos.x - screenSize / 2 - borderSize, screenPos.y - screenSize / 2 - borderSize, screenSize + borderSize * 2, screenSize + borderSize * 2);
        }

        ctx.fillStyle = this.isRaided ? '#7f1d1d' : '#a16207';
        ctx.fillRect(screenPos.x - screenSize / 2, screenPos.y - screenSize / 2, screenSize, screenSize);
        if (game.cameraZoom > 0.4) {
            ctx.fillStyle = 'white'; ctx.font = `14px Inter`; ctx.textAlign = 'center'; ctx.shadowColor = 'black'; ctx.shadowBlur = 4;
            let label = this.isRaided ? `Raided` : `${this.name} (Lvl ${this.level})`;
            ctx.fillText(label, screenPos.x, screenPos.y - (screenSize / 2) - 5);
            ctx.shadowBlur = 0;
        }
    }
}

class BeastDen extends Location {
    constructor(id, name, x, y, factionId, power) {
        super(id, name, x, y, factionId);
        this.type = 'beast_den';
        this.power = power;
    }

    dailyUpdate(game) {
        if (Math.random() < 0.3 + (this.power / 100)) {
            this.spawnBeastParty(game);
        }
    }

    spawnBeastParty(game) {
        const partySize = 5 + Math.floor(this.power / 5);
        const party = game.createAIParty('beast', 'Wild Beasts', this.x, this.y, 'beast');
        party.party.push({ type: 'wild_beast', count: partySize });
        party.homeDenId = this.id;
        game.parties.push(party);
    }

    render(ctx, game) {
        const screenPos = game.worldToScreen(this.x, this.y);
        const screenSize = 1200 * game.cameraZoom;
        ctx.fillStyle = '#581c87';
        ctx.fillRect(screenPos.x - screenSize / 2, screenPos.y - screenSize / 2, screenSize, screenSize);
        if (game.cameraZoom > 0.4) {
            ctx.fillStyle = 'white'; ctx.font = `14px Inter`; ctx.textAlign = 'center'; ctx.shadowColor = 'black'; ctx.shadowBlur = 4;
            let label = `${this.name} (Pwr ${this.power})`;
            ctx.fillText(label, screenPos.x, screenPos.y - (screenSize / 2) - 5);
            ctx.shadowBlur = 0;
        }
    }
}
