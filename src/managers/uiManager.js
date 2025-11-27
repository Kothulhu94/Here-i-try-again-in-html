class UIManager {
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
            lootModal: document.getElementById('loot-modal'),
            lootList: document.getElementById('loot-list'),
            lootButton: document.getElementById('loot-take-button'),
            loadingScreen: document.getElementById('loading-screen'),
            loadingBar: document.getElementById('loading-bar'),
            loadingText: document.getElementById('loading-text'),
            partyModal: document.getElementById('party-modal'),
            partyButton: document.getElementById('party-button'),
            partyCloseButton: document.getElementById('party-close-button'),
            partyList: document.getElementById('party-list'),
            partyCount: document.getElementById('party-count'),
            partyWages: document.getElementById('party-wages'),
            questsModal: document.getElementById('quests-modal'),
            questsButton: document.getElementById('quests-button'),
            questsCloseButton: document.getElementById('quests-close-button'),
            questsList: document.getElementById('quests-list'),
        };
        this.bindEvents();
    }

    bindEvents() {
        this.optimizeConsole();
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

        this.elements.questsButton.addEventListener('click', () => this.openQuests());
        this.elements.questsCloseButton.addEventListener('click', () => this.closeQuests());
        this.elements.questsModal.addEventListener('click', (e) => { if (e.target === this.elements.questsModal) this.closeQuests(); });

        this.elements.kingdomsButton.addEventListener('click', () => this.openKingdoms());
        this.elements.kingdomsCloseButton.addEventListener('click', () => this.closeKingdoms());
        this.elements.kingdomsCloseButton.addEventListener('click', () => this.closeKingdoms());
        this.elements.kingdomsModal.addEventListener('click', (e) => { if (e.target === this.elements.kingdomsModal) this.closeKingdoms(); });

        this.elements.partyButton.addEventListener('click', () => this.openParty());
        this.elements.partyCloseButton.addEventListener('click', () => this.closeParty());
        this.elements.partyModal.addEventListener('click', (e) => { if (e.target === this.elements.partyModal) this.closeParty(); });

        this.elements.leaveTownButton.addEventListener('click', () => this.leaveTown());
        this.elements.leaveVillageButton.addEventListener('click', () => this.leaveVillage());
        this.elements.combatCloseButton.addEventListener('click', () => this.closeCombatReport());
        this.elements.lootButton.addEventListener('click', () => this.closeLootModal());

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

    optimizeConsole() {
        // Store original methods if needed for debugging later
        // window.originalConsole = { log: console.log, warn: console.warn };

        // Override with empty functions to boost performance
        console.log = function () { };
        console.warn = function () { };
        // We keep console.error active for critical issues
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
        this.elements.dayStat.textContent = day;
        this.elements.goldStat.textContent = `${player.gold} G`;
        this.elements.armyStat.textContent = `${player.getPartySize()} / ${player.getMaxPartySize()}`;
        this.elements.attackStat.textContent = player.getPartyAttack();
        this.elements.defenseStat.textContent = player.getPartyDefense();
        this.elements.speedStat.textContent = player.speed.toFixed(0);

        // Add Renown/Influence/Tier display if not present (hacky injection for now)
        let riStat = document.getElementById('ri-stat');
        if (!riStat) {
            riStat = document.createElement('div');
            riStat.id = 'ri-stat';
            riStat.className = 'flex gap-4 text-sm text-zinc-400 mt-1';
            this.elements.goldStat.parentElement.parentElement.appendChild(riStat);
        }
        riStat.innerHTML = `<span>Renown: <span class="text-white">${player.renown}</span> (Tier ${player.getClanTier()})</span> <span>Influence: <span class="text-white">${player.influence}</span></span>`;

        const inventoryEl = this.elements.inventoryStat;
        inventoryEl.innerHTML = '';
        const goods = player.inventory ? Object.keys(player.inventory) : [];
        if (goods.length === 0 || goods.every(key => player.inventory[key] <= 0)) {
            inventoryEl.innerHTML = '<p class="text-zinc-500">No goods.</p>';
        } else {
            goods.sort((a, b) => GOODS[a].name.localeCompare(GOODS[b].name)).forEach(key => {
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

        // Inject Keep Tab if missing
        if (!document.getElementById('town-keep-tab-btn')) {
            const btn = document.createElement('button');
            btn.id = 'town-keep-tab-btn';
            btn.className = 'town-tab-button px-4 py-2 rounded hover:bg-zinc-700 text-zinc-400';
            btn.dataset.tab = 'keep';
            btn.textContent = 'Keep';
            this.elements.townTabs.appendChild(btn);
        }
        // Inject Keep Content if missing
        if (!document.getElementById('town-keep-tab')) {
            const content = document.createElement('div');
            content.id = 'town-keep-tab';
            content.className = 'town-tab-content hidden';
            document.getElementById('town-market-tab').parentElement.appendChild(content);
        }

        // Inject Tavern Tab if missing
        if (!document.getElementById('town-tavern-tab-btn')) {
            const btn = document.createElement('button');
            btn.id = 'town-tavern-tab-btn';
            btn.className = 'town-tab-button px-4 py-2 rounded hover:bg-zinc-700 text-zinc-400';
            btn.dataset.tab = 'tavern';
            btn.textContent = 'Tavern';
            this.elements.townTabs.appendChild(btn);
        }
        // Inject Tavern Content if missing
        if (!document.getElementById('town-tavern-tab')) {
            const content = document.createElement('div');
            content.id = 'town-tavern-tab';
            content.className = 'town-tab-content hidden';
            document.getElementById('town-market-tab').parentElement.appendChild(content);
        }

        this.updateTownMarketUI(town);
        this.updateRecruitmentUI(town);
        this.updateTownPoliticsUI(town);
        this.updateTownKeepUI(town);
        this.updateTownTavernUI(town);

        document.querySelectorAll('.town-tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById('town-market-tab').classList.remove('hidden');
        document.querySelectorAll('.town-tab-button').forEach(btn => {
            btn.classList.remove('bg-zinc-700', 'text-white');
            btn.classList.add('text-zinc-400');
        });
        document.querySelector('.town-tab-button[data-tab="market"]').classList.add('bg-zinc-700', 'text-white');
        this.elements.townModal.classList.remove('hidden');
    }

    updateTownKeepUI(town) {
        const container = document.getElementById('town-keep-tab');
        container.innerHTML = '';

        // Owner Info
        const ownerName = town.ownerId ? (this.game.parties.find(p => p.id === town.ownerId)?.name || 'Unknown Lord') : (FACTIONS[town.factionId]?.name + ' Leadership');
        container.innerHTML += `<div class="bg-zinc-900 p-4 rounded mb-4"><h3 class="font-medieval text-lg text-zinc-300">Town Status</h3><p class="text-sm text-zinc-400">Owner: <span class="text-white">${ownerName}</span></p><p class="text-sm text-zinc-400">Loyalty: <span class="${town.loyalty < 30 ? 'text-red-500' : 'text-green-400'}">${town.loyalty.toFixed(1)}</span></p><p class="text-sm text-zinc-400">Security: <span class="${town.security < 30 ? 'text-red-500' : 'text-green-400'}">${town.security.toFixed(1)}</span></p></div>`;

        // Projects (If Player Owned)
        const isPlayerOwned = town.factionId === this.game.player.factionId && (this.game.player.factionId === 'player' || town.ownerId === this.game.player.id);

        if (isPlayerOwned) {
            let projectsHtml = `<div class="bg-zinc-900 p-4 rounded mb-4"><h3 class="font-medieval text-lg text-zinc-300 mb-2">Projects</h3><div class="space-y-2">`;
            for (const key in town.projects) {
                const proj = town.projects[key];
                const isActive = town.activeProject === key;
                projectsHtml += `<div class="flex justify-between items-center bg-zinc-800 p-2 rounded">
                    <div><div class="font-bold text-sm">${proj.name} (Lvl ${proj.level})</div><div class="text-xs text-zinc-500">${proj.desc}</div></div>
                    <div class="flex items-center gap-2">
                        ${isActive ? `<span class="text-xs text-yellow-400">Building... ${proj.progress}/${proj.target}</span>` : `<button class="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 rounded" onclick="window.startProject('${town.id}', '${key}')">Build</button>`}
                    </div>
                </div>`;
            }
            projectsHtml += `</div></div>`;
            container.innerHTML += projectsHtml;

            // Hack to make the onclick work since we are in a module
            window.startProject = (townId, projectKey) => {
                const t = this.game.locations.find(l => l.id == townId);
                if (t) {
                    t.activeProject = projectKey;
                    this.updateTownKeepUI(t);
                }
            }
        }


        // Contracts (If Independent or Mercenary)
        if (this.game.player.factionId === 'player' || this.game.player.allegianceType === 'mercenary') {
            if (town.factionId !== 'player' && town.factionId !== 'bandit' && town.factionId !== 'beast') {
                const faction = FACTIONS[town.factionId];
                container.innerHTML += `<div class="bg-zinc-900 p-4 rounded"><h3 class="font-medieval text-lg text-zinc-300 mb-2">Diplomacy</h3>
                 <div class="flex gap-2">
                    ${this.game.player.allegianceType !== 'mercenary' ? `<button id="btn-merc" class="bg-yellow-700 hover:bg-yellow-600 text-white px-4 py-2 rounded w-full">Sign Mercenary Contract</button>` : ''}
                    ${this.game.player.getClanTier() >= 1 ? `<button id="btn-vassal" class="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded w-full">Swear Fealty</button>` : '<div class="text-xs text-zinc-500">Clan Tier 1 required for vassalage.</div>'}
                 </div></div>`;

                setTimeout(() => {
                    const btnMerc = document.getElementById('btn-merc');
                    if (btnMerc) btnMerc.addEventListener('click', () => {
                        this.game.diplomacyManager.setPlayerAllegiance(town.factionId, 'mercenary', this.game);
                        this.updateTownKeepUI(town);
                        this.updatePlayerStats(this.game.player, this.game.currentDay);
                    });
                    const btnVassal = document.getElementById('btn-vassal');
                    if (btnVassal) btnVassal.addEventListener('click', () => {
                        this.game.diplomacyManager.setPlayerAllegiance(town.factionId, 'vassal', this.game);
                        this.updateTownKeepUI(town);
                        this.updatePlayerStats(this.game.player, this.game.currentDay);
                    });
                }, 0);
            }
        }
    }

    updateTownTavernUI(town) {
        const container = document.getElementById('town-tavern-tab');
        container.innerHTML = '';

        container.innerHTML += `<div class="bg-zinc-900 p-4 rounded mb-4">
            <h3 class="font-medieval text-lg text-yellow-400 mb-2">Available Quests</h3>
            <div id="tavern-quests-list" class="space-y-2"></div>
        </div>`;

        const list = document.getElementById('tavern-quests-list');
        if (!town.availableQuests || town.availableQuests.length === 0) {
            list.innerHTML = '<p class="text-zinc-500 italic">No quests available at the moment.</p>';
        } else {
            town.availableQuests.forEach(quest => {
                const questEl = document.createElement('div');
                questEl.className = 'bg-zinc-800 p-3 rounded border border-zinc-700 flex justify-between items-center';
                questEl.innerHTML = `
                    <div>
                        <div class="font-bold text-white">${quest.title}</div>
                        <div class="text-xs text-zinc-400">${quest.description}</div>
                        <div class="text-xs text-yellow-500 mt-1">Reward: ${quest.rewardGold} G, ${quest.rewardRenown} Renown</div>
                    </div>
                    <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold">Accept</button>
                `;
                questEl.querySelector('button').addEventListener('click', () => {
                    if (this.game.player.activeQuests.length >= 5) {
                        this.addMessage("You have too many active quests!", "text-red-500");
                        return;
                    }
                    this.game.player.activeQuests.push(quest);
                    town.availableQuests = town.availableQuests.filter(q => q !== quest);
                    this.addMessage(`Accepted quest: ${quest.title}`, "text-green-400");
                    this.updateTownTavernUI(town);
                });
                list.appendChild(questEl);
            });
        }
    }

    openQuests() {
        this.renderQuests();
        this.elements.questsModal.classList.remove('hidden');
    }

    closeQuests() {
        this.elements.questsModal.classList.add('hidden');
    }

    renderQuests() {
        this.elements.questsList.innerHTML = '';
        if (this.game.player.activeQuests.length === 0) {
            this.elements.questsList.innerHTML = '<div class="text-center text-zinc-500 italic p-4">No active quests. Visit taverns to find work.</div>';
            return;
        }

        this.game.player.activeQuests.forEach(quest => {
            const questEl = document.createElement('div');
            questEl.className = 'bg-zinc-900 p-3 rounded border border-zinc-700 mb-2';

            let progressText = '';
            if (quest.type === 'delivery') {
                const currentAmount = this.game.player.inventory[quest.item] || 0;
                const isReady = currentAmount >= quest.amount && this.game.currentLocation && this.game.currentLocation.id === quest.targetId;
                progressText = `<div class="text-sm mt-1 ${isReady ? 'text-green-400' : 'text-zinc-400'}">Progress: ${currentAmount}/${quest.amount} ${GOODS[quest.item].name}</div>`;
                if (this.game.currentLocation && this.game.currentLocation.id === quest.targetId) {
                    progressText += `<div class="text-xs text-blue-400">You are at the target location.</div>`;
                } else {
                    const targetTown = this.game.locations.find(l => l.id === quest.targetId);
                    progressText += `<div class="text-xs text-zinc-500">Target: ${targetTown ? targetTown.name : 'Unknown'}</div>`;
                }
            }

            questEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-bold text-yellow-500">${quest.title}</div>
                        <div class="text-sm text-zinc-300">${quest.description}</div>
                        ${progressText}
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-yellow-600">${quest.rewardGold} Gold</div>
                        <div class="text-xs text-purple-400">${quest.rewardRenown} Renown</div>
                    </div>
                </div>
            `;
            this.elements.questsList.appendChild(questEl);
        });
    }

    updateKingdomsUI() {
        const contentEl = this.elements.kingdomsContentEl;
        contentEl.innerHTML = '';

        // Call to Army Button
        if (this.game.player.allegianceType === 'vassal' || this.game.player.factionId !== 'player') {
            contentEl.innerHTML += `<div class="bg-zinc-800 p-4 rounded mb-4 flex justify-between items-center">
                <div><h3 class="font-bold text-white">Call to Army</h3><p class="text-xs text-zinc-400">Spend 50 Influence to call nearby lords.</p></div>
                <button id="btn-call-army" class="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded">Call Lords (50 Inf)</button>
             </div>`;
            setTimeout(() => {
                const btn = document.getElementById('btn-call-army');
                if (btn) btn.addEventListener('click', () => {
                    if (this.game.player.influence >= 50) {
                        this.game.player.influence -= 50;
                        let count = 0;
                        this.game.parties.forEach(p => {
                            if (p.factionId === this.game.player.factionId && p.partyType === 'lord' && Pathfinder.getDistance(this.game.player.x, this.game.player.y, p.x, p.y) < 5000) {
                                p.armyLeaderId = this.game.player.id;
                                p.aiState = 'following_army';
                                count++;
                            }
                        });
                        this.addMessage(`Called ${count} lords to your army!`, 'text-green-400');
                        this.updatePlayerStats(this.game.player, this.game.currentDay);
                    } else {
                        this.addMessage("Not enough influence!", "text-red-500");
                    }
                });
            }, 0);
        }

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
            factionHtml += `<div class="col-span-2"><strong>Towns:</strong> ${towns.length > 0 ? towns.map(t => t.name).join(', ') : 'None'}</div>`;
            factionHtml += `<div class="col-span-2"><strong>Villages:</strong> ${villages.length > 0 ? villages.map(v => v.name).join(', ') : 'None'}</div>`;
            factionHtml += `</div></div>`;
            contentEl.innerHTML += factionHtml;
        });
    }

    showCombatOptions(partyA, partyB) {
        this.game.pauseGame();
        this.game.gameState = 'combat_menu';

        const enemyParty = (partyA === this.game.player) ? partyB : partyA;

        // Create modal if not exists (reuse combat modal structure or create new)
        // I'll inject a simple modal for now
        let modal = document.getElementById('combat-options-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'combat-options-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 hidden';
            modal.innerHTML = `
                <div class="bg-zinc-900 border-2 border-zinc-600 p-6 rounded-lg max-w-md w-full text-center">
                    <h2 class="font-medieval text-2xl text-red-500 mb-4">Battle Imminent!</h2>
                    <p class="text-zinc-300 mb-6" id="combat-desc">You have encountered an enemy.</p>
                    <div class="flex flex-col gap-3">
                        <button id="btn-auto-resolve" class="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-3 rounded font-bold">Command Troops (Auto-Resolve)</button>
                        <button id="btn-fps-combat" class="bg-red-700 hover:bg-red-600 text-white px-4 py-3 rounded font-bold border border-red-500">Lead the Charge (3D FPS)</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const descEl = modal.querySelector('#combat-desc');
        descEl.textContent = `You have encountered ${enemyParty.name} (${enemyParty.getPartySize()} troops).`;

        const btnAuto = modal.querySelector('#btn-auto-resolve');
        const btnFps = modal.querySelector('#btn-fps-combat');

        // Clone nodes to remove old listeners
        const newBtnAuto = btnAuto.cloneNode(true);
        btnAuto.parentNode.replaceChild(newBtnAuto, btnAuto);
        const newBtnFps = btnFps.cloneNode(true);
        btnFps.parentNode.replaceChild(newBtnFps, btnFps);

        newBtnAuto.addEventListener('click', () => {
            modal.classList.add('hidden');
            Combat.autoResolve(partyA, partyB, this.game);
        });

        newBtnFps.addEventListener('click', () => {
            modal.classList.add('hidden');
            this.game.start3DCombat(enemyParty);
        });

        modal.classList.remove('hidden');
    }

    updateTownMarketUI(town) {
        this.elements.townBuyListEl.innerHTML = '';
        this.elements.townSellListEl.innerHTML = '';
        const townGoods = Object.keys(town.inventory).sort((a, b) => GOODS[a].name.localeCompare(GOODS[b].name));
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

        const playerGoods = Object.keys(this.game.player.inventory).sort((a, b) => GOODS[a].name.localeCompare(GOODS[b].name));
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
        for (const troopType in town.barracks) {
            const count = town.barracks[troopType];
            if (count > 0) {
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
                    if (quantity > 0 && quantity <= count) {
                        const cost = quantity * troopData.cost;
                        if (this.game.player.gold >= cost) {
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
        if (town.hadShortageRecently) {
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
                if (quantity > 0 && quantity <= stock) {
                    const cost = quantity * price;
                    if (this.game.player.gold >= cost) {
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

    openStats() {
        this.elements.statsModal.classList.remove('hidden');
    }

    closeStats() {
        this.elements.statsModal.classList.add('hidden');
    }

    openLog() {
        this.elements.logModal.classList.remove('hidden');
    }

    closeLog() {
        this.elements.logModal.classList.add('hidden');
    }

    openKingdoms() {
        this.updateKingdomsUI();
        this.elements.kingdomsModal.classList.remove('hidden');
    }

    closeKingdoms() {
        this.elements.kingdomsModal.classList.add('hidden');
    }

    openParty() {
        this.updatePartyUI();
        this.elements.partyModal.classList.remove('hidden');
    }

    closeParty() {
        this.elements.partyModal.classList.add('hidden');
    }

    updatePartyUI() {
        const player = this.game.player;
        this.elements.partyCount.textContent = `${player.getPartySize()} / ${player.getMaxPartySize()}`;

        // Calculate wages (simple sum of upkeep)
        const wages = player.party.reduce((sum, t) => sum + (t.count * (TROOP_TYPES[t.type]?.upkeep || 0)), 0);
        this.elements.partyWages.textContent = `${wages} G/day`;

        this.elements.partyList.innerHTML = '';

        player.party.forEach(troop => {
            const type = troop.type;
            const count = troop.count;
            const xp = troop.xp || 0;
            const data = TROOP_TYPES[type];

            const itemEl = document.createElement('div');
            itemEl.className = 'bg-zinc-900 p-3 rounded border border-zinc-700';

            let upgradeHtml = '';
            if (data.upgradeTo) {
                const upgradeData = TROOP_TYPES[data.upgradeTo];
                const xpNeeded = data.xpToUpgrade * count; // Total XP needed for stack? No, let's do per unit logic visual but stack logic actual
                // Actually, we track XP per stack.
                // Let's show a progress bar for the stack's readiness to upgrade ONE unit?
                // Or just show "Ready to Upgrade: X"

                const unitsReady = Math.floor(xp / data.xpToUpgrade);
                const upgradeCost = (upgradeData.cost - data.cost) + 10;

                upgradeHtml = `
                    <div class="mt-2 pt-2 border-t border-zinc-800">
                        <div class="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>XP: ${Math.floor(xp)}</span>
                            <span>Next Upgrade: ${data.xpToUpgrade} XP/unit</span>
                        </div>
                        <div class="w-full bg-zinc-800 rounded-full h-2 mb-2">
                            <div class="bg-yellow-600 h-2 rounded-full" style="width: ${Math.min(100, (xp / (data.xpToUpgrade * count)) * 100)}%"></div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-yellow-500">Upgrade to ${upgradeData.name} (${upgradeCost} G)</span>
                            <button class="upgrade-btn bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed" 
                                ${unitsReady > 0 && player.gold >= upgradeCost ? '' : 'disabled'}
                                data-type="${type}" data-cost="${upgradeCost}">
                                Upgrade (${Math.min(unitsReady, count)})
                            </button>
                        </div>
                    </div>
                `;
            }

            itemEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-bold text-zinc-200">${data.name}</div>
                        <div class="text-xs text-zinc-500">Tier ${Math.floor(data.power / 2)} • ${data.type === 'cavalry' ? 'Cavalry' : 'Infantry'}</div>
                    </div>
                    <div class="text-xl font-bold text-white">${count}</div>
                </div>
                ${upgradeHtml}
            `;

            const upgradeBtn = itemEl.querySelector('.upgrade-btn');
            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', () => {
                    const unitsReady = Math.floor(xp / data.xpToUpgrade);
                    const toUpgrade = Math.min(unitsReady, count); // Upgrade all ready units? Or just 1?
                    // Let's upgrade 1 at a time for better control, or add a "Max" button later.
                    // For now, let's upgrade 1.
                    if (toUpgrade > 0) {
                        if (player.upgradeTroop(type, 1)) {
                            this.updatePlayerStats(player, this.game.currentDay);
                            this.updatePartyUI();
                        }
                    }
                });
            }

            this.elements.partyList.appendChild(itemEl);
        });
    }

    leaveTown() {
        // Set justLeftLocation to the ID of the town we are leaving so we don't immediately re-enter
        if (this.game.currentLocation) {
            this.game.justLeftLocation = this.game.currentLocation.id;
        }
        this.elements.townModal.classList.add('hidden');
        this.game.gameState = 'map';
        this.game.currentLocation = null;
    }

    leaveVillage() {
        // Set justLeftLocation to the ID of the village we are leaving
        if (this.game.currentLocation) {
            this.game.justLeftLocation = this.game.currentLocation.id;
        }
        this.elements.villageModal.classList.add('hidden');
        this.game.gameState = 'map';
        this.game.currentLocation = null;
    }

    showCombatReport(data) {
        this.elements.combatTitle.textContent = data.title;
        this.elements.combatResult.textContent = data.result;
        this.elements.combatPlayerParty.textContent = data.playerPartyDesc;
        this.elements.combatEnemyParty.textContent = data.enemyPartyDesc;
        this.elements.combatLog.innerHTML = data.log;
        this.elements.combatPlayerLosses.textContent = data.playerLosses;
        this.elements.combatEnemyLosses.textContent = data.enemyLosses;

        if (data.result.includes('Victory')) {
            this.elements.combatResult.className = 'text-2xl font-bold text-center mb-4 text-green-400';
        } else if (data.result.includes('Defeat')) {
            this.elements.combatResult.className = 'text-2xl font-bold text-center mb-4 text-red-400';
        } else {
            this.elements.combatResult.className = 'text-2xl font-bold text-center mb-4 text-yellow-400';
        }

        this.elements.combatModal.classList.remove('hidden');
    }

    closeCombatReport() {
        this.elements.combatModal.classList.add('hidden');
        this.game.gameState = 'map';
    }

    showLootModal(loot) {
        this.elements.lootList.innerHTML = '';

        // Gold
        if (loot.gold > 0) {
            const goldEl = document.createElement('div');
            goldEl.className = 'flex justify-between items-center bg-zinc-900 p-3 rounded border border-yellow-900';
            goldEl.innerHTML = `<span class="font-bold text-yellow-500">Gold</span> <span class="font-mono text-yellow-400">+${loot.gold}</span>`;
            this.elements.lootList.appendChild(goldEl);
        }

        // Items
        for (const [item, count] of Object.entries(loot.inventory)) {
            if (count > 0) {
                const itemEl = document.createElement('div');
                itemEl.className = 'flex justify-between items-center bg-zinc-900 p-3 rounded border border-zinc-700';
                const itemName = GOODS[item]?.name || item;
                itemEl.innerHTML = `<span class="text-zinc-300">${itemName}</span> <span class="font-mono text-green-400">+${count}</span>`;
                this.elements.lootList.appendChild(itemEl);
            }
        }

        if (this.elements.lootList.children.length === 0) {
            this.elements.lootList.innerHTML = '<div class="text-center text-zinc-500 italic p-4">No loot found...</div>';
        }

        this.elements.lootModal.classList.remove('hidden');
    }

    closeLootModal() {
        this.elements.lootModal.classList.add('hidden');
        this.game.gameState = 'map';
        this.game.resumeGame(); // Ensure game loop is running if it was paused
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

    showLoadingScreen() {
        this.elements.loadingScreen.classList.remove('hidden');
        this.updateLoadingProgress('Initializing...', 0);
    }

    updateLoadingProgress(text, percent) {
        this.elements.loadingText.textContent = text;
        this.elements.loadingBar.style.width = `${percent}%`;
    }

    hideLoadingScreen() {
        // Small delay to ensure user sees 100%
        setTimeout(() => {
            this.elements.loadingScreen.classList.add('hidden');
        }, 500);
    }
}
