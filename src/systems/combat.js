class Combat {
    static initiate(partyA, partyB, game) {
        if (partyA.partyType === 'player' || partyB.partyType === 'player') {
            game.uiManager.showCombatOptions(partyA, partyB);
        } else {
            this.autoResolve(partyA, partyB, game);
        }
    }

    static autoResolve(partyA, partyB, game) {
        const isPlayerInvolved = partyA === game.player || partyB === game.player;
        const playerParty = isPlayerInvolved ? (partyA === game.player ? partyA : partyB) : null;
        const enemyParty = isPlayerInvolved ? (partyA === game.player ? partyB : partyA) : partyB;

        if (isPlayerInvolved) {
            game.gameState = 'combat';
            game.player.targetX = game.player.x;
            game.player.targetY = game.player.y;
            game.player.path = [];
        }

        const initialPartyA = JSON.parse(JSON.stringify(partyA.party));
        const initialPartyB = JSON.parse(JSON.stringify(partyB.party));
        const initialSizeA = Party.getPartySize(initialPartyA), initialSizeB = Party.getPartySize(initialPartyB);
        const initialAtkA = Party.getPartyAttack(initialPartyA), initialDefA = Party.getPartyDefense(initialPartyA);
        const initialAtkB = Party.getPartyAttack(initialPartyB), initialDefB = Party.getPartyDefense(initialPartyB);

        let currentPartyA = JSON.parse(JSON.stringify(partyA.party));
        let currentPartyB = JSON.parse(JSON.stringify(partyB.party));
        const battleLog = [];
        let round = 0;

        while (Party.getPartySize(currentPartyA) > 0 && Party.getPartySize(currentPartyB) > 0 && round < 20) {
            round++;
            const roundLog = { round };
            const sizeA = Party.getPartySize(currentPartyA), atkA = Party.getPartyAttack(currentPartyA), defA = Party.getPartyDefense(currentPartyA);
            const sizeB = Party.getPartySize(currentPartyB), atkB = Party.getPartyAttack(currentPartyB), defB = Party.getPartyDefense(currentPartyB);
            const damageToB = Math.max(1, Math.round(atkA * (0.8 + Math.random() * 0.4) - defB * (0.8 + Math.random() * 0.2)));
            const lossesB = Math.min(sizeB, Math.floor(damageToB / TROOP_HP));
            currentPartyB = Party.removeTroops(currentPartyB, lossesB);
            roundLog.damageToB = damageToB;
            roundLog.lossesB = lossesB;
            const damageToA = Math.max(1, Math.round(atkB * (0.8 + Math.random() * 0.4) - defA * (0.8 + Math.random() * 0.2)));
            const lossesA = Math.min(sizeA, Math.floor(damageToA / TROOP_HP));
            currentPartyA = Party.removeTroops(currentPartyA, lossesA);
            roundLog.damageToA = damageToA;
            roundLog.lossesA = lossesA;
            roundLog.partyASize = Party.getPartySize(currentPartyA);
            roundLog.partyBSize = Party.getPartySize(currentPartyB);
            battleLog.push(roundLog);
        }

        const finalSizeA = Party.getPartySize(currentPartyA);
        const finalSizeB = Party.getPartySize(currentPartyB);
        const totalLossesA = initialSizeA - finalSizeA;
        const totalLossesB = initialSizeB - finalSizeB;

        if (game.diplomacyManager.areFactionsAtWar(partyA.factionId, partyB.factionId)) {
            const totalCasualties = totalLossesA + totalLossesB;
            game.diplomacyManager.addWarExhaustion(partyA.factionId, partyB.factionId, totalCasualties * 0.1);
        }

        let winner, loser, resultText;
        if (finalSizeA > finalSizeB) { winner = partyA; loser = partyB; resultText = `${partyA.name} Wins!`; }
        else if (finalSizeB > finalSizeA) { winner = partyB; loser = partyA; resultText = `${partyB.name} Wins!`; }
        else { winner = null; loser = null; resultText = 'Mutual Annihilation!'; }

        partyA.party = Party.removeTroops(JSON.parse(JSON.stringify(initialPartyA)), totalLossesA);
        partyB.party = Party.removeTroops(JSON.parse(JSON.stringify(initialPartyB)), totalLossesB);

        if (isPlayerInvolved) {
            game.pauseGame();
            const playerIsWinner = winner === playerParty;
            const result = playerIsWinner ? 'Victory!' : (winner === null ? 'Draw!' : 'Defeat!');
            const playerPartyIsA = partyA === playerParty;

            const combatReportData = {
                title: `Battle against ${enemyParty.name}`,
                result: result,
                playerPartyDesc: `${playerPartyIsA ? initialSizeA : initialSizeB} troops (Atk: ${playerPartyIsA ? initialAtkA : initialAtkB}, Def: ${playerPartyIsA ? initialDefA : initialDefB})`,
                enemyPartyDesc: `${!playerPartyIsA ? initialSizeA : initialSizeB} troops (Atk: ${!playerPartyIsA ? initialAtkA : initialAtkB}, Def: ${!playerPartyIsA ? initialDefA : initialDefB})`,
                log: battleLog.map(r => {
                    const pDamage = playerPartyIsA ? r.damageToB : r.damageToA, pLosses = playerPartyIsA ? r.lossesA : r.lossesB;
                    const eDamage = playerPartyIsA ? r.damageToA : r.damageToB, eLosses = playerPartyIsA ? r.lossesB : r.lossesA;
                    const pSize = playerPartyIsA ? r.partyASize : r.partyBSize, eSize = playerPartyIsA ? r.partyBSize : r.partyASize;
                    return `<p class="border-b border-zinc-700 pb-1 mb-1 text-xs"><span class="font-bold">R${r.round}:</span> You dealt <span class="text-green-400">${pDamage}</span> causing <span class="text-red-400">${eLosses}</span>. Enemy dealt <span class="text-red-400">${eDamage}</span> causing <span class="text-red-400">${pLosses}</span>. <span class="text-zinc-400">Rem: You ${pSize}, Enemy ${eSize}</span></p>`
                }).join(''),
                playerLosses: playerPartyIsA ? totalLossesA : totalLossesB,
                enemyLosses: playerPartyIsA ? totalLossesB : totalLossesA,
            };
            game.uiManager.showCombatReport(combatReportData);
            game.uiManager.addMessage(`You fought ${enemyParty.name} and ${result === 'Victory!' ? 'won' : 'lost'}.`, result === 'Victory!' ? 'text-green-400' : 'text-red-400');

            if (playerIsWinner) {
                const goldGained = (enemyParty.gold || 0) + 10 + Math.floor(Math.random() * 50);
                game.player.gold += goldGained;
                const renownGain = Math.max(1, Math.floor(initialSizeB / 5));
                game.player.renown += renownGain;

                const xpGain = Math.floor(Party.getPartyPower(initialPartyB) * 5) + 20;
                game.player.addXp(xpGain);

                game.uiManager.addMessage(`You looted ${goldGained} G, gained ${renownGain} Renown and ${xpGain} XP.`, 'text-yellow-400');
            } else {
                const goldLost = Math.min(game.player.gold, 50 + Math.floor(Math.random() * 50));
                game.player.gold -= goldLost;
                game.uiManager.addMessage(`You lost ${goldLost} G.`, 'text-red-400');
                if (game.player.getPartySize() === 0) {
                    game.uiManager.addMessage('Your party is defeated. You find 5 Spearmen from a nearby village.', 'text-red-500');
                    game.player.party = [{ type: 'spearman', count: 5 }];
                    let spawnLoc = game.locations.find(l => l.type === 'town');
                    if (!spawnLoc) spawnLoc = { x: game.worldMap.mapWidth / 2, y: game.worldMap.mapHeight / 2 };
                    game.player.x = spawnLoc.x; game.player.y = spawnLoc.y;
                    game.player.targetX = game.player.x; game.player.targetY = game.player.y;
                    game.cameraX = game.player.x; game.cameraY = game.player.y;
                }
            }
            game.uiManager.updatePlayerStats(game.player, game.currentDay);
        } else {
            game.uiManager.addMessage(`${partyA.name} and ${partyB.name} have clashed! ${resultText}`, 'text-orange-400');
        }

        if (winner) {
            game.parties = game.parties.filter(p => p !== loser);
            if (winner.factionId === 'beast' && winner.homeDenId !== undefined) {
                const den = game.locations.find(l => l.id === winner.homeDenId);
                if (den) { den.power += 5; game.uiManager.addMessage(`A beast den grows in power!`, 'text-red-600'); }
            }
        } else {
            game.parties = game.parties.filter(p => p !== partyA && p !== partyB);
        }

        if (loser) {
            if (loser.factionId === 'beast' && loser.homeDenId !== undefined) {
                const den = game.locations.find(l => l.id === loser.homeDenId);
                if (den) { den.power = Math.max(1, den.power - 3); }
            }
        }
    }

    static resolveSiege(attacker, town, game) {
        const garrison = town.garrison;
        let currentAttackerParty = JSON.parse(JSON.stringify(attacker.party));
        let currentGarrison = JSON.parse(JSON.stringify(garrison));
        let round = 0;
        while (Party.getPartySize(currentAttackerParty) > 0 && Party.getPartySize(currentGarrison) > 0 && round < 30) {
            round++;
            const atkA = Party.getPartyAttack(currentAttackerParty), defA = Party.getPartyDefense(currentAttackerParty);
            const sizeG = Party.getPartySize(currentGarrison), atkG = Party.getPartyAttack(currentGarrison), defG = Party.getPartyDefense(currentGarrison);

            const damageToGarrison = Math.max(1, Math.round(atkA * (0.8 + Math.random() * 0.4) - (defG * 1.2) * (0.8 + Math.random() * 0.2)));
            const lossesGarrison = Math.min(sizeG, Math.floor(damageToGarrison / TROOP_HP));
            currentGarrison = Party.removeTroops(currentGarrison, lossesGarrison);

            const damageToAttacker = Math.max(1, Math.round(atkG * (0.8 + Math.random() * 0.4) - defA * (0.8 + Math.random() * 0.2)));
            const lossesAttacker = Math.min(Party.getPartySize(currentAttackerParty), Math.floor(damageToAttacker / TROOP_HP));
            currentAttackerParty = Party.removeTroops(currentAttackerParty, lossesAttacker);
        }

        const finalAttackerSize = Party.getPartySize(currentAttackerParty);
        const finalGarrisonSize = Party.getPartySize(currentGarrison);

        if (finalGarrisonSize <= 0) {
            game.uiManager.addMessage(`${attacker.name} has conquered ${town.name}!`, 'text-red-600 font-bold');
            town.changeOwner(attacker.factionId, game);
            attacker.party = currentAttackerParty;
        } else {
            game.uiManager.addMessage(`${town.name} has repelled the siege from ${attacker.name}!`, 'text-green-500 font-bold');
            town.garrison = currentGarrison;
            if (finalAttackerSize <= 0) {
                game.parties = game.parties.filter(p => p !== attacker);
            } else {
                attacker.party = currentAttackerParty;
            }
        }
        town.isUnderSiege = false;
        town.siegeProgress = 0;
        town.siegeAttackerId = null;
    }
}
