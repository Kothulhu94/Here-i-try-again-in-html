const GRID_SIZE = 100;
const TERRAIN_TYPES = {
    plains: { color: '#166534', name: 'Plains', speedModifier: 1.0 },
    forest: { color: '#14532d', name: 'Forest', speedModifier: 0.75 },
    mountain: { color: '#57534e', name: 'Mountains', speedModifier: 0.0 },
    water: { color: '#1d4ed8', name: 'Water', speedModifier: 0.0 },
    road: { color: '#d4d4d8', name: 'Road', speedModifier: 1.25 }
};
const TROOP_HP = 5;
const TROOP_TYPES = {
    'recruit': { name: 'Recruit', atk: 1, def: 0, hp: 5, cost: 10, upkeep: 1, power: 1, upgradeTo: 'militia', xpToUpgrade: 50 },
    'militia': { name: 'Militia', atk: 2, def: 1, hp: 6, cost: 20, upkeep: 2, power: 2, upgradeTo: 'footman', xpToUpgrade: 150 },
    'footman': { name: 'Footman', atk: 3, def: 2, hp: 8, cost: 40, upkeep: 4, power: 4, upgradeTo: 'veteran', xpToUpgrade: 300 },
    'veteran': { name: 'Veteran', atk: 5, def: 3, hp: 10, cost: 80, upkeep: 8, power: 8, upgradeTo: 'champion', xpToUpgrade: 600 },
    'champion': { name: 'Champion', atk: 8, def: 5, hp: 15, cost: 150, upkeep: 15, power: 15, upgradeTo: null, xpToUpgrade: 0 },

    'spearman': { name: 'Spearman', atk: 2, def: 2, hp: TROOP_HP, cost: 15, upkeep: 1, power: 3, upgradeTo: 'veteran_spearman', xpToUpgrade: 200 },
    'veteran_spearman': { name: 'Vet. Spearman', atk: 4, def: 4, hp: 8, cost: 45, upkeep: 5, power: 6, upgradeTo: null, xpToUpgrade: 0 },

    'swordsman': { name: 'Swordsman', atk: 3, def: 1, hp: TROOP_HP, cost: 25, upkeep: 2, power: 4, upgradeTo: 'veteran_swordsman', xpToUpgrade: 200 },
    'veteran_swordsman': { name: 'Vet. Swordsman', atk: 6, def: 2, hp: 8, cost: 55, upkeep: 6, power: 7, upgradeTo: null, xpToUpgrade: 0 },

    'looter': { name: 'Looter', atk: 1, def: 0, hp: TROOP_HP, cost: 0, upkeep: 0, power: 1, upgradeTo: null, xpToUpgrade: 0 },
    'bandit': { name: 'Bandit', atk: 2, def: 0, hp: TROOP_HP, cost: 0, upkeep: 0, power: 2, upgradeTo: 'raider', xpToUpgrade: 100 },
    'raider': { name: 'Raider', atk: 3, def: 1, hp: 7, cost: 0, upkeep: 0, power: 4, upgradeTo: null, xpToUpgrade: 0 },

    'wild_beast': { name: 'Wild Beast', atk: 3, def: 1, hp: TROOP_HP * 1.5, cost: 0, upkeep: 0, power: 5, upgradeTo: null, xpToUpgrade: 0 },
    'the_sleeper': { name: 'The Sleeper', atk: 40, def: 10, hp: 50, cost: 0, upkeep: 0, power: 100, upgradeTo: null, xpToUpgrade: 0 }
};
const GOODS = {
    'grain': { name: 'Grain', basePrice: 10, type: 'food', idealStock: 200 },
    'butter': { name: 'Butter', basePrice: 20, type: 'food', idealStock: 100 },
    'cheese': { name: 'Cheese', basePrice: 18, type: 'food', idealStock: 100 },
    'meat': { name: 'Meat', basePrice: 22, type: 'food', idealStock: 100 },
    'horses': { name: 'Horses', basePrice: 50, type: 'military', idealStock: 50 },
    'ore': { name: 'Iron Ore', basePrice: 30, type: 'resource', idealStock: 150 },
    'wood': { name: 'Wood', basePrice: 15, type: 'resource', idealStock: 200 },
    'leather': { name: 'Leather', basePrice: 25, type: 'resource', idealStock: 100 },
    'bread': { name: 'Bread', basePrice: 16, type: 'food', idealStock: 150 },
    'tools': { name: 'Tools', basePrice: 75, type: 'industrial', idealStock: 50 },
    'armor': { name: 'Armor', basePrice: 90, type: 'military', idealStock: 30 },
};
const FACTIONS = {
    'player': { name: 'Player', color: '#3b82f6' },
    'vikingr': { name: 'Vikingr', color: '#60a5fa', aggressiveness: 0.7, honor: 0.4, mercantilism: 0.5 },
    'sarran': { name: 'Sarran', color: '#f59e0b', aggressiveness: 0.6, honor: 0.6, mercantilism: 0.7 },
    'vaegir': { name: 'Vaegir', color: '#a78bfa', aggressiveness: 0.4, honor: 0.8, mercantilism: 0.4 },
    'rhodok': { name: 'Rhodok', color: '#22c55e', aggressiveness: 0.5, honor: 0.5, mercantilism: 0.8 },
    'bandit': { name: 'Bandits', color: '#ef4444' },
    'beast': { name: 'Beasts', color: '#581c87' },
    'caravan': { name: 'Caravan', color: '#facc15' },
};
const BASE_PLAYER_SPEED = 18000;
const REAL_SECONDS_PER_GAME_HOUR = 90;
const MIN_ZOOM = 0.02;
const MAX_ZOOM = 3.0;
const MAP_DIMENSION = 100000;
