import { FACTIONS, GOODS, TROOP_TYPES } from '../config.js';
import { Party } from '../game-objects/party.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {
            dayStat: document.getElementById('day-stat'),
            goldStat: document.getElementById('gold-stat'),
            armyStat: document.getElementById('army-stat'),
            attackStat: document.getElementById('attack-stat'),
            defenseStat: document.getElementById('defense-stat'),
            speedStat: document.getElementById('speed-stat'),
            inventoryStat: document.getElementById('inventory-stat'),
            messageLog: document.getElementById('messageLog'),
            timeDisplayDay: document.getElementById('time-day'),
            timeDisplayClock: document.getElementById('time-clock'),
            timeControlButton: document.getElementById('time-control-button'),
            townModal: document.getElementById('town-modal'),
            townNameEl: document.getElementById('town-name'),
            townFactionEl: document.getElementById('town-faction'),
            townLevelEl: document.getElementById('town-level'),
            townTreasuryEl: document.getElementById('town-treasury'),
            townGarrisonSizeEl: document.getElementById('town-garrison-size'),
            townRelationsListEl: document.getElementById('town-relations-list'),
            townGossipListEl: document.getElementById('town-gossip-list'),
            townBuyListEl: document.getElementById('town-buy-list'),
            townSellListEl: document.getElementById('town-sell-list'),
            townRecruitmentOptionsEl: document.getElementById('town-recruitment-options'),
            leaveTownButton: document.getElementById('leave-town-button'),
            townTabs: document.getElementById('town-tabs'),
            villageModal: document.getElementById('village-modal'),
            villageNameEl: document.getElementById('village-name'),
            villageLevelEl: document.getElementById('village-level'),
            villageFactionEl: document.getElementById('village-faction'),
            villageProductionTextEl: document.getElementById('village-production-text'),
            villageBuyOptionsEl: document.getElementById('village-buy-options'),
            leaveVillageButton: document.getElementById('leave-village-button'),
            combatModal: document.getElementById('combat-modal'),
            combatTitle: document.getElementById('combat-title'),
            combatResult: document.getElementById('combat-result'),
            combatPlayerParty: document.getElementById('combat-player-party'),
            combatEnemyParty: document.getElementById('combat-enemy-party'),
            combatLog: document.getElementById('combat-log'),
            combatPlayerLosses: document.getElementById('combat-player-losses'),
            combatEnemyLosses: document.getElementById('combat-enemy-losses'),
            combatCloseButton: document.getElementById('combat-close-button'),
            statsModal: document.getElementById('stats-modal'),
            statsButton: document.getElementById('stats-button'),
            statsCloseButton: document.getElementById('stats-close-button'),
            logModal: document.getElementById('log-modal'),
            logButton: document.getElementById('log-button'),
            logCloseButton: document.getElementById('log-close-button'),
            kingdomsModal: document.getElementById('kingdoms-modal'),
            kingdomsButton: document.getElementById('kingdoms-button'),
            kingdomsCloseButton: document.getElementById('kingdoms-close-button'),
            kingdomsContentEl: document.getElementById('kingdoms-content'),
            titleScreen: document.getElementById('title-screen'),
            uiOverlay: document.getElementById('ui-overlay'),
            newGameButton: document.getElementById('new-game-button'),
            loadGameButton: document.getElementById('load-game-button'),
            saveGameModalButton: document.getElementById('save-game-button'),
            loadGameModalButton: document.getElementById('load-game-button-modal'),
        };
        this.bindEvents();
    }

    bindEvents() {
        this.elements.newGameButton.addEventListener('click', () => this.game.startNewGame());
        this.elements.loadGameButton.addEventListener('click', () => this.game.loadGame());
        this.elements.saveGameModalButton.addEventListener('click', () => this.game.saveGame());
        this.elements.loadGameModalButton.addEventListener('click', () => this.game.loadGame());

        this.elements.timeControlButton.addEventListener('click', () => {
            if (this.game.gameState === 'map') {
                this.game.gameSpeedMultiplier = (this.game.gameSpeedMultiplier + 1) % 3;
                this.updateTimeControlButton();
            }
        });

        this.elements.statsButton.addEventListener('click', () => this.openStats());
        this.elements.statsCloseButton.addEventListener('click', () => this.closeStats());
        this.elements.statsModal.addEventListener('click', (e) => { if (e.target === this.elements.statsModal) this.closeStats(); });

        this.elements.logButton.addEventListener('click', () => this.openLog());
        this.elements.logCloseButton.addEventListener('click', () => this.closeLog());
        this.elements.logModal.addEventListener('click', (e) => { if (e.target === this.elements.logModal) this.closeLog(); });

        this.elements.kingdomsButton.addEventListener('click', () => this.openKingdoms());
        this.elements.kingdomsCloseButton.addEventListener('click', () => this.closeKingdoms());
        this.elements.kingdomsModal.addEventListener('click', (e) => { if (e.target === this.elements.kingdomsModal) this.closeKingdoms(); });

        this.elements.leaveTownButton.addEventListener('click', () => this.leaveTown());
        this.elements.leaveVillageButton.addEventListener('click', () => this.leaveVillage());
        this.elements.combatCloseButton.addEventListener('click', () => this.closeCombatReport());

        this.elements.townTabs.addEventListener('click', (e) => {
            const target = e.target;
            if (target instanceof HTMLElement && target.classList.contains('town-tab-button')) {
                const tabName = target.dataset.tab;
                document.querySelectorAll('.town-tab-content').forEach(el => el.classList.add('hidden'));
                document.getElementById(`town-${tabName}-tab`).classList.remove('hidden');
                document.querySelectorAll('.town-tab-button').forEach(btn => {
                    btn.classList.remove('bg-zinc-700', 'text-white');
                    btn.classList.add('text-zinc-400');
                });
                target.classList.add('bg-zinc-700', 'text-white');
                target.classList.remove('text-zinc-400');
            }
        });
    }

    checkSaveGameExists() {
         if (!localStorage.getItem('bannerlord2d_save')) {
            this.elements.loadGameButton.disabled = true;
            this.elements.loadGameModalButton.disabled = true;
        } else {
            this.elements.loadGameButton.disabled = false;
            this.elements.loadGameModalButton.disabled = false;
        }
    }

    addMessage(message, color = 'text-zinc-300') {
        const msgEl = document.createElement('div');
        msgEl.className = color;
        msgEl.textContent = message;
        if (this.elements.messageLog.children.length > 200) {
            this.elements.messageLog.removeChild(this.elements.messageLog.firstChild);
        }
        this.elements.messageLog.appendChild(msgEl);
        this.elements.messageLog.scrollTop = this.elements.messageLog.scrollHeight;
    }

    updateTimeUI(day, gameTime) {
        const currentHour = Math.floor(gameTime % 24);
        const currentMinute = Math.floor((gameTime * 60) % 60);
        this.elements.timeDisplayDay.textContent = `Day ${day}`;
        this.elements.timeDisplayClock.textContent = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    }

    updateTimeControlButton() {
        const btn = this.elements.timeControlButton;
        if (this.game.gameSpeedMultiplier === 0) {
            btn.textContent = '▶';
            btn.classList.remove('bg-green-600', 'hover:bg-green-700');
            btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        } else if (this.game.gameSpeedMultiplier === 1) {
            btn.textContent = '❚❚';
            btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            btn.classList.add('bg-green-600', 'hover:bg-green-700');
        } else {
            btn.textContent = '▶▶';
            btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            btn.classList.add('bg-green-600', 'hover:bg-green-700');
        }
    }

    updatePlayerStats(player, day) {
        if (!player) return;
        player.updateSpeed();
        this.elements.dayStat.textContent = day;
        this.elements.goldStat.textContent = `${player.gold} G`;
        this.elements.armyStat.textContent = player.getPartySize();
        this.elements.attackStat.textContent = player.getPartyAttack();
        this.elements.defenseStat.textContent = player.getPartyDefense();
        this.elements.speedStat.textContent = player.speed.toFixed(0);

        const inventoryEl = this.elements.inventoryStat;
        inventoryEl.innerHTML = '';
        const goods = player.inventory ? Object.keys(player.inventory) : [];
        if (goods.length === 0 || goods.every(key => player.inventory[key] <= 0)) {
            inventoryEl.innerHTML = '<p class="text-zinc-500">No goods.</p>';
        } else {
            goods.sort((a,b) => GOODS[a].name.localeCompare(GOODS[b].name)).forEach(key => {
                const amount = player.inventory[key];
                if (amount > 0) {
                    const good = GOODS[key];
                    const el = document.createElement('div');
                    el.className = 'flex justify-between';
                    el.innerHTML = `<span>${good.name}:</span><span class="font-semibold">${amount}</span>`;
                    inventoryEl.appendChild(el);
                }
            });
        }
    }

    openStats() {
        if (this.game.gameState === 'map') {
            this.game.pauseGame();
            this.game.gameState = 'paused';
            this.updatePlayerStats(this.game.player, this.game.currentDay);
            this.elements.statsModal.classList.remove('hidden');
        }
    }
    closeStats() {
        this.elements.statsModal.classList.add('hidden');
        if (this.game.gameState === 'paused') {
            this.game.gameState = 'map';
        }
    }

    openLog() {
        if (this.game.gameState === 'map') {
            this.game.pauseGame();
            this.game.gameState = 'paused';
            this.elements.logModal.classList.remove('hidden');
        }
    }
    closeLog() {
        this.elements.logModal.classList.add('hidden');
        if (this.game.gameState === 'paused') {
            this.game.gameState = 'map';
        }
    }

    openKingdoms() {
        if (this.game.gameState === 'map') {
            this.game.pauseGame();
            this.game.gameState = 'paused';
            this.updateKingdomsUI();
            this.elements.kingdomsModal.classList.remove('hidden');
        }
    }
    closeKingdoms() {
        this.elements.kingdomsModal.classList.add('hidden');
        if (this.game.gameState === 'paused') {
            this.game.gameState = 'map';
        }
    }

    updateKingdomsUI() {
        const contentEl = this.elements.kingdomsContentEl;
        contentEl.innerHTML = '';
        const factionIds = this.game.diplomacyManager.factionIds.filter(id => id !== 'player');

        let tableHtml = `<h3 class="font-medieval text-xl text-blue-400 mb-2">Diplomatic Relations</h3><table class="w-full text-sm text-left text-zinc-300 mb-6">`;
        tableHtml += `<thead class="text-xs text-zinc-400 uppercase bg-zinc-700"><tr><th scope="col" class="px-3 py-2"></th>`;
        factionIds.forEach(fid => {
            const faction = this.game.factions[fid];
            tableHtml += `<th scope="col" class="px-3 py-2 text-center" style="color:${faction.color};">${faction.name}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        factionIds.forEach(fid1 => {
            const faction1 = this.game.factions[fid1];
            tableHtml += `<tr class="border-b border-zinc-700"><td class="px-3 py-2 font-semibold" style="color:${faction1.color};">${faction1.name}</td>`;
            factionIds.forEach(fid2 => {
                if (fid1 === fid2) {
                    tableHtml += `<td class="px-3 py-2 bg-zinc-800"></td>`;
                } else {
                    const state = this.game.diplomacyManager.getDiplomaticState(fid1, fid2);
                    const relation = this.game.diplomacyManager.getRelation(fid1, fid2);
                    let stateColor = 'text-green-400';
                    if (state === 'war') stateColor = 'text-red-500 font-bold';
                    tableHtml += `<td class="px-3 py-2 text-center ${stateColor}">${state.charAt(0).toUpperCase() + state.slice(1)} (${relation.toFixed(0)})</td>`;
                }
            });
            tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table>`;
        contentEl.innerHTML += tableHtml;

        factionIds.forEach(fid => {
            const faction = this.game.factions[fid];
            const strength = this.game.diplomacyManager.calculateFactionStrength(fid, this.game);
            const towns = this.game.locations.filter(l => l.factionId === fid && l.type === 'town');
            const villages = this.game.locations.filter(l => l.factionId === fid && l.type === 'village');

            let factionHtml = `<div class="bg-zinc-900 p-4 rounded-lg mb-4"><h4 class="font-medieval text-lg mb-2" style="color:${faction.color};">${faction.name}</h4>`;
            factionHtml += `<div class="grid grid-cols-2 gap-2 text-sm">`;
            factionHtml += `<div><strong>Strength:</strong> ${strength.toFixed(0)}</div>`;
            factionHtml += `<div><strong>Treasury:</strong> ${faction.treasury} G</div>`;
            factionHtml += `<div class="col-span-2"><strong>Towns:</strong> ${towns.length > 0 ? towns.map(t=>t.name).join(', ') : 'None'}</div>`;
            factionHtml += `<div class="col-span-2"><strong>Villages:</strong> ${villages.length > 0 ? villages.map(v=>v.name).join(', ') : 'None'}</div>`;
            factionHtml += `</div></div>`;
            contentEl.innerHTML += factionHtml;
        });
    }

    leaveTown() {
        this.elements.townModal.classList.add('hidden');
        this.game.gameState = 'map';
        this.game.currentLocation = null;
        this.game.justLeftLocation = true;
        setTimeout(() => { this.game.justLeftLocation = false; }, 2000);
    }

    leaveVillage() {
        this.elements.villageModal.classList.add('hidden');
        this.game.gameState = 'map';
        this.game.currentLocation = null;
        this.game.justLeftLocation = true;
        setTimeout(() => { this.game.justLeftLocation = false; }, 2000);
    }

    showCombatReport(data) {
        this.elements.combatTitle.textContent = data.title;
        this.elements.combatResult.textContent = data.result;
        this.elements.combatResult.className = `text-2xl font-bold text-center mb-4 ${data.result === 'Victory!' ? 'text-green-400' : 'text-red-400'}`;
        this.elements.combatPlayerParty.textContent = data.playerPartyDesc;
        this.elements.combatEnemyParty.textContent = data.enemyPartyDesc;
        this.elements.combatLog.innerHTML = data.log;
        this.elements.combatPlayerLosses.textContent = data.playerLosses;
        this.elements.combatEnemyLosses.textContent = data.enemyLosses;
        this.elements.combatModal.classList.remove('hidden');
    }

    closeCombatReport() {
        this.elements.combatModal.classList.add('hidden');
        this.game.gameState = 'map';
    }

    openTownModal(town) {
        this.game.pauseGame();
        this.game.gameState = 'town';
        this.game.currentLocation = town;
        this.elements.townNameEl.textContent = town.name;

        const faction = FACTIONS[town.factionId];
        if (faction) {
            this.elements.townFactionEl.textContent = faction.name;
            this.elements.townFactionEl.style.color = faction.color;
        } else {
            this.elements.townFactionEl.textContent = '';
        }

        this.elements.townLevelEl.textContent = town.level;
        this.elements.townTreasuryEl.textContent = `${town.treasury} G`;
        this.elements.townGarrisonSizeEl.textContent = Party.getPartySize(town.garrison);

        this.updateTownMarketUI(town);
        this.updateRecruitmentUI(town);
        this.updateTownPoliticsUI(town);

        document.querySelectorAll('.town-tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById('town-market-tab').classList.remove('hidden');
        document.querySelectorAll('.town-tab-button').forEach(btn => {
            btn.classList.remove('bg-zinc-700', 'text-white');
            btn.classList.add('text-zinc-400');
        });
        document.querySelector('.town-tab-button[data-tab="market"]').classList.add('bg-zinc-700', 'text-white');
        this.elements.townModal.classList.remove('hidden');
    }

    updateTownMarketUI(town) {
        this.elements.townBuyListEl.innerHTML = '';
        this.elements.townSellListEl.innerHTML = '';
        const townGoods = Object.keys(town.inventory).sort((a,b) => GOODS[a].name.localeCompare(GOODS[b].name));
        if (townGoods.length === 0 || townGoods.every(key => town.inventory[key] <= 0)) {
            this.elements.townBuyListEl.innerHTML = '<p class="text-zinc-500">Nothing for sale.</p>';
        }
        for (const goodKey of townGoods) {
            const stock = town.inventory[goodKey] || 0;
            if (stock <= 0) continue;
            const price = town.calculatePrice(goodKey, this.game);
            const itemEl = this._createMarketItem(GOODS[goodKey].name, stock, price, "Buy", "blue");
            itemEl.querySelector('button').addEventListener('click', () => {
                const quantity = parseInt(itemEl.querySelector('input').value, 10);
                if (quantity > 0 && quantity <= stock) {
                    const cost = quantity * price;
                    if (this.game.player.gold >= cost) {
                        this.game.player.gold -= cost; town.treasury += cost;
                        this.game.player.inventory[goodKey] = (this.game.player.inventory[goodKey] || 0) + quantity;
                        town.inventory[goodKey] -= quantity;
                        this.updatePlayerStats(this.game.player, this.game.currentDay);
                        this.updateTownMarketUI(town);
                    }
                }
            });
            this.elements.townBuyListEl.appendChild(itemEl);
        }

        const playerGoods = Object.keys(this.game.player.inventory).sort((a,b) => GOODS[a].name.localeCompare(GOODS[b].name));
        if (playerGoods.length === 0 || playerGoods.every(key => this.game.player.inventory[key] <= 0)) {
            this.elements.townSellListEl.innerHTML = '<p class="text-zinc-500">You have no goods.</p>';
        }
        for (const goodKey of playerGoods) {
            const stock = this.game.player.inventory[goodKey] || 0;
            if (stock <= 0) continue;
            const price = town.calculatePrice(goodKey, this.game);
            const itemEl = this._createMarketItem(GOODS[goodKey].name, stock, price, "Sell", "green");
            itemEl.querySelector('button').addEventListener('click', () => {
                const quantity = parseInt(itemEl.querySelector('input').value, 10);
                if (quantity > 0 && quantity <= stock) {
                    const revenue = quantity * price;
                    if (town.treasury >= revenue) {
                        this.game.player.gold += revenue; town.treasury -= revenue;
                        this.game.player.inventory[goodKey] -= quantity;
                        town.inventory[goodKey] = (town.inventory[goodKey] || 0) + quantity;
                        this.updatePlayerStats(this.game.player, this.game.currentDay);
                        this.updateTownMarketUI(town);
                    }
                }
            });
            this.elements.townSellListEl.appendChild(itemEl);
        }
    }

    updateRecruitmentUI(town) {
        this.elements.townRecruitmentOptionsEl.innerHTML = '';
        for(const troopType in town.barracks) {
            const count = town.barracks[troopType];
            if(count > 0) {
                const troopData = TROOP_TYPES[troopType];
                const itemEl = document.createElement('div');
                itemEl.className = 'flex items-center justify-between bg-zinc-900 p-2 rounded';
                itemEl.innerHTML = `
                    <span>${troopData.name} (${count})</span>
                    <div class="flex items-center gap-2">
                        <span class="text-yellow-500 w-20 text-right">${troopData.cost} G</span>
                        <input type="number" class="w-12 bg-zinc-700 text-white p-1 rounded text-center" value="1" min="1" max="${count}">
                        <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Recruit</button>
                    </div>`;
                itemEl.querySelector('button').addEventListener('click', () => {
                    const quantity = parseInt(itemEl.querySelector('input').value, 10);
                    if(quantity > 0 && quantity <= count) {
                        const cost = quantity * troopData.cost;
                        if(this.game.player.gold >= cost) {
                            this.game.player.gold -= cost;
                            town.treasury += cost;
                            town.barracks[troopType] -= quantity;
                            this.game.player.addTroops(troopType, quantity);
                            this.updatePlayerStats(this.game.player, this.game.currentDay);
                            this.updateRecruitmentUI(town);
                        }
                    }
                });
                this.elements.townRecruitmentOptionsEl.appendChild(itemEl);
            }
        }
        if (this.elements.townRecruitmentOptionsEl.innerHTML === '') {
            this.elements.townRecruitmentOptionsEl.innerHTML = '<p class="text-zinc-500">No troops available for recruitment.</p>';
        }
    }

     updateTownPoliticsUI(town) {
        const relationsEl = this.elements.townRelationsListEl;
        const gossipEl = this.elements.townGossipListEl;
        relationsEl.innerHTML = '';
        gossipEl.innerHTML = '';

        let hasWar = false;
        this.game.diplomacyManager.factionIds.forEach(otherFid => {
            if (town.factionId === otherFid || otherFid === 'player') return;
            const state = this.game.diplomacyManager.getDiplomaticState(town.factionId, otherFid);
            if (state === 'war') {
                hasWar = true;
                const otherFaction = this.game.factions[otherFid];
                relationsEl.innerHTML += `<div class="flex justify-between items-center"><span style="color:${otherFaction.color};">${otherFaction.name}</span> <span class="text-red-500 font-bold">At War</span></div>`;
            }
        });

        if (!hasWar) {
            relationsEl.innerHTML = '<p class="text-zinc-500">At peace with all major factions.</p>';
        }

        if (hasWar) {
            gossipEl.innerHTML += `<p>"Times are tense. The call for soldiers might come any day now."</p>`;
        } else {
             gossipEl.innerHTML += `<p>"It's been quiet lately. Good for business, I say."</p>`;
        }
        if(town.hadShortageRecently) {
            gossipEl.innerHTML += `<p>"The caravans haven't been coming through. I hope we get a shipment of goods soon."</p>`;
        } else {
             gossipEl.innerHTML += `<p>"The markets are well-stocked. Trade is flowing."</p>`;
        }
    }

    openVillageModal(village) {
        this.game.pauseGame();
        this.game.gameState = 'village';
        this.game.currentLocation = village;
        this.elements.villageNameEl.textContent = village.name;
        this.elements.villageLevelEl.textContent = village.level;
        const faction = FACTIONS[village.factionId];
        if (faction) {
            this.elements.villageFactionEl.textContent = faction.name;
            this.elements.villageFactionEl.style.color = faction.color;
        }
        this.elements.villageProductionTextEl.textContent = `This village produces ${GOODS[village.production].name}.`;

        this.elements.villageBuyOptionsEl.innerHTML = '';
        const stock = village.inventory[village.production] || 0;
        if (stock > 0) {
            const price = village.calculatePrice(village.production, this.game);
            const itemEl = this._createMarketItem(GOODS[village.production].name, stock, price, "Buy", "blue", true);
            itemEl.querySelector('button').addEventListener('click', () => {
                const quantity = parseInt(itemEl.querySelector('input').value, 10);
                if(quantity > 0 && quantity <= stock) {
                    const cost = quantity * price;
                    if(this.game.player.gold >= cost) {
                        this.game.player.gold -= cost;
                        village.gold += cost;
                        village.inventory[village.production] -= quantity;
                        this.game.player.inventory[village.production] = (this.game.player.inventory[village.production] || 0) + quantity;
                        this.updatePlayerStats(this.game.player, this.game.currentDay);
                        this.openVillageModal(village);
                    }
                }
            });
            this.elements.villageBuyOptionsEl.appendChild(itemEl);
        } else {
            this.elements.villageBuyOptionsEl.innerHTML = '<p class="text-zinc-500">Out of stock.</p>';
        }
        this.elements.villageModal.classList.remove('hidden');
    }

    _createMarketItem(name, stock, price, action, color, isVillage = false) {
         const itemEl = document.createElement('div');
         const className = isVillage ? 'flex items-center justify-between bg-zinc-900 p-2 rounded' : 'flex items-center justify-between text-sm';
         itemEl.className = className;
         itemEl.innerHTML = `
            <span>${name} (${stock})</span>
            <div class="flex items-center gap-1">
                <span class="text-yellow-500 w-16 text-right">${price} G</span>
                <input type="number" class="w-12 bg-zinc-700 text-white p-1 rounded text-center" value="1" min="1" max="${stock}">
                <button class="bg-${color}-600 hover:bg-${color}-700 text-white px-2 py-1 rounded">${action}</button>
            </div>`;
        return itemEl;
    }
}
