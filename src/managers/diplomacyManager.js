class DiplomacyManager {
    constructor() {
        this.relations = {}; // { factionA: { factionB: 0 } }
        this.states = {};    // { factionA: { factionB: 'neutral' } }
        this.warExhaustion = {}; // { factionA: { factionB: 0 } }
        this.factionIds = [];
    }

    initialize(factions) {
        this.factionIds = Object.keys(factions).filter(id => id !== 'bandit' && id !== 'beast' && id !== 'caravan');

        this.relations = {};
        this.states = {};
        this.warExhaustion = {};

        for (const f1 of this.factionIds) {
            for (const f2 of this.factionIds) {
                if (f1 === f2) continue;

                const [key1, key2] = this._getSortedPair(f1, f2);

                if (!this.relations[key1]) this.relations[key1] = {};
                if (!this.states[key1]) this.states[key1] = {};
                if (!this.warExhaustion[key1]) this.warExhaustion[key1] = {};

                if (this.relations[key1][key2] === undefined) {
                    this.relations[key1][key2] = 0;
                    this.states[key1][key2] = 'neutral';
                    this.warExhaustion[key1][key2] = 0;
                }
            }
        }
    }

    _getSortedPair(factionA, factionB) {
        return [factionA, factionB].sort();
    }

    getRelation(factionA, factionB) {
        const [f1, f2] = this._getSortedPair(factionA, factionB);
        return this.relations[f1]?.[f2] ?? 0;
    }

    getWarExhaustion(factionA, factionB) {
        const [f1, f2] = this._getSortedPair(factionA, factionB);
        return this.warExhaustion[f1]?.[f2] ?? 0;
    }

    modifyRelation(factionA, factionB, amount, game) {
        if (factionA === factionB || !this.factionIds.includes(factionA) || !this.factionIds.includes(factionB)) return;
        const [f1, f2] = this._getSortedPair(factionA, factionB);
        if (this.relations[f1] === undefined) this.relations[f1] = {};

        const currentRelation = this.relations[f1][f2] || 0;
        const newRelation = Math.max(-100, Math.min(100, currentRelation + amount));
        this.relations[f1][f2] = newRelation;

        const currentState = this.getDiplomaticState(f1, f2);
        if (newRelation <= -50 && currentState !== 'war') {
            this.setDiplomaticState(f1, f2, 'war', game);
        } else if (newRelation >= 0 && currentState === 'war') {
            this.setDiplomaticState(f1, f2, 'neutral', game);
        }
    }

    addWarExhaustion(factionA, factionB, amount) {
        if (factionA === factionB) return;
        const [f1, f2] = this._getSortedPair(factionA, factionB);
        if (this.warExhaustion[f1] === undefined) this.warExhaustion[f1] = {};
        this.warExhaustion[f1][f2] = (this.warExhaustion[f1][f2] || 0) + amount;
    }

    getDiplomaticState(factionA, factionB) {
        if (factionA === factionB) return 'alliance';
        const [f1, f2] = this._getSortedPair(factionA, factionB);
        return this.states[f1]?.[f2] ?? 'neutral';
    }

    setDiplomaticState(factionA, factionB, state, game) {
        if (factionA === factionB) return;
        const [f1, f2] = this._getSortedPair(factionA, factionB);
        if (this.states[f1] === undefined) this.states[f1] = {};

        const oldState = this.states[f1][f2];
        if (oldState === state) return;

        this.states[f1][f2] = state;

        if (state === 'war') {
            this.warExhaustion[f1][f2] = 0;
        }

        if (game && game.uiManager) {
            const factionName1 = game.factions[f1]?.name || f1;
            const factionName2 = game.factions[f2]?.name || f2;
            if (state === 'war') {
                game.uiManager.addMessage(`${factionName1} has declared war on ${factionName2}!`, 'text-red-500 font-bold');
            } else if (state === 'neutral') {
                 game.uiManager.addMessage(`${factionName1} and ${factionName2} have made peace.`, 'text-green-400');
            }
        }
    }

    areFactionsAtWar(factionA, factionB) {
        return this.getDiplomaticState(factionA, factionB) === 'war';
    }

    isFactionAtWarWithAnyone(factionId) {
        return this.factionIds.some(otherFaction => this.areFactionsAtWar(factionId, otherFaction));
    }

    dailyUpdate(game) {
        for (const f1 of this.factionIds) {
            for (const f2 of this.factionIds) {
                if (f1 < f2) {
                    const currentRelation = this.getRelation(f1, f2);
                    if (currentRelation !== 0) {
                        const decay = Math.sign(currentRelation) * -0.1;
                        this.modifyRelation(f1, f2, decay, game);
                    }
                    if (this.areFactionsAtWar(f1, f2)) {
                        this.addWarExhaustion(f1, f2, 1);
                    }
                }
            }
        }
        if (game.currentDay % 5 === 0) {
            this.factionIds.forEach(fid => this.factionStrategicUpdate(fid, game));
        }
    }

    calculateFactionStrength(factionId, game) {
        let totalPower = 0;
        game.parties.filter(p => p.factionId === factionId && p.partyType === 'lord').forEach(p => totalPower += p.getPartyPower());
        game.locations.filter(l => l.factionId === factionId && l.type === 'town').forEach(t => totalPower += Party.getPartyPower(t.garrison));
        totalPower += (game.factions[factionId].treasury || 0) / 1000;
        return totalPower;
    }

    factionStrategicUpdate(factionId, game) {
        const myFaction = game.factions[factionId];
        if (!myFaction) return;
        const myStrength = this.calculateFactionStrength(factionId, game);

        for(const otherFactionId of this.factionIds) {
            if (factionId === otherFactionId) continue;

            const otherStrength = this.calculateFactionStrength(otherFactionId, game);
            const relation = this.getRelation(factionId, otherFactionId);

            if (this.areFactionsAtWar(factionId, otherFactionId)) {
                const exhaustion = this.getWarExhaustion(factionId, otherFactionId);
                if (exhaustion > 50 && myStrength < otherStrength * 1.2) {
                    this.setDiplomaticState(factionId, otherFactionId, 'neutral', game);
                    const reparations = Math.min(myFaction.treasury, 1000);
                    myFaction.treasury -= reparations;
                    game.factions[otherFactionId].treasury += reparations;
                    game.uiManager.addMessage(`${myFaction.name} paid ${reparations}G to ${game.factions[otherFactionId].name} for peace.`, 'text-yellow-400');
                }
            } else {
                if (relation < -70 && myStrength > otherStrength * (1.5 - (myFaction.aggressiveness || 0.5))) {
                    this.setDiplomaticState(factionId, otherFactionId, 'war', game);
                }
            }
        }
         this.assignLordDirectives(factionId, game);
    }

    assignLordDirectives(factionId, game) {
         const lords = game.parties.filter(p => p.factionId === factionId && p.partyType === 'lord');
         const myTowns = game.locations.filter(l => l.factionId === factionId && l.type === 'town');
         const enemyTowns = game.locations.filter(l => l.type === 'town' && this.areFactionsAtWar(factionId, l.factionId));
         const enemyVillages = game.locations.filter(l => l.type === 'village' && this.areFactionsAtWar(factionId, l.factionId));
         const enemyCaravans = game.parties.filter(p => p.partyType === 'caravan' && this.areFactionsAtWar(factionId, p.factionId));

         lords.forEach(lord => {
             if (lord.aiDirective.targetId && !game.locations.find(l => l.id === lord.aiDirective.targetId)) {
                 lord.aiDirective = { type: 'patrol' };
             }

             const myStrength = lord.getPartyPower();

             const factionStrength = this.calculateFactionStrength(factionId, game);
             const totalEnemyStrength = this.factionIds
                 .filter(fid => this.areFactionsAtWar(factionId, fid))
                 .reduce((sum, fid) => sum + this.calculateFactionStrength(fid, game), 0);

             if (factionStrength < totalEnemyStrength * 0.8 && myTowns.length > 0) {
                 if (Math.random() < 0.5) {
                     const target = myTowns[Math.floor(Math.random() * myTowns.length)];
                     lord.aiDirective = { type: 'defend', targetId: target.id };
                     return;
                 }
             }

             if (enemyTowns.length > 0 && Math.random() < 0.3) {
                 const target = enemyTowns[Math.floor(Math.random() * enemyTowns.length)];
                 const garrisonPower = Party.getPartyPower(target.garrison);
                 if (myStrength > garrisonPower * 1.5) {
                      lord.aiDirective = { type: 'siege', targetId: target.id };
                      return;
                 }
             }

             if (enemyCaravans.length > 0 && Math.random() < 0.4) {
                 lord.aiDirective = { type: 'hunt', targetType: 'caravan' };
                 return;
             }

             if (enemyVillages.length > 0 && Math.random() < 0.2) {
                 const target = enemyVillages[Math.floor(Math.random() * enemyVillages.length)];
                 lord.aiDirective = { type: 'raid', targetId: target.id };
                 return;
             }

             lord.aiDirective = { type: 'patrol' };
         });
    }
}
