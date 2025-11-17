export const GRID_SIZE = 100;
export const TERRAIN_TYPES = {
    plains: { color: '#166534', name: 'Plains' },
    forest: { color: '#14532d', name: 'Forest' },
    mountain: { color: '#57534e', name: 'Mountains' },
    water: { color: '#1d4ed8', name: 'Water' }
};
export const TROOP_HP = 5;
export const TROOP_TYPES = {
    'spearman':  { name: 'Spearman',  atk: 1, def: 1, hp: TROOP_HP, cost: 15, upkeep: 1, power: 3 },
    'swordsman': { name: 'Swordsman', atk: 2, def: 0, hp: TROOP_HP, cost: 25, upkeep: 2, power: 4 },
    'looter':    { name: 'Looter',    atk: 2, def: 0, hp: TROOP_HP, cost: 0, upkeep: 0, power: 3 },
    'wild_beast':{ name: 'Wild Beast',atk: 3, def: 1, hp: TROOP_HP * 1.5, cost: 0, upkeep: 0, power: 5 }
};
export const GOODS = {
    'grain':   { name: 'Grain',   basePrice: 10, type: 'food',     idealStock: 200 },
    'butter':  { name: 'Butter',  basePrice: 20, type: 'food',     idealStock: 100 },
    'cheese':  { name: 'Cheese',  basePrice: 18, type: 'food',     idealStock: 100 },
    'meat':    { name: 'Meat',    basePrice: 22, type: 'food',     idealStock: 100 },
    'horses':  { name: 'Horses',  basePrice: 50, type: 'military', idealStock: 50 },
    'ore':     { name: 'Iron Ore',basePrice: 30, type: 'resource', idealStock: 150 },
    'wood':    { name: 'Wood',    basePrice: 15, type: 'resource', idealStock: 200 },
    'leather': { name: 'Leather', basePrice: 25, type: 'resource', idealStock: 100 },
    'bread':   { name: 'Bread',   basePrice: 16, type: 'food',     idealStock: 150 },
    'tools':   { name: 'Tools',   basePrice: 75, type: 'industrial', idealStock: 50 },
    'armor':   { name: 'Armor',   basePrice: 90, type: 'military', idealStock: 30 },
};
export const FACTIONS = {
    'player':   { name: 'Player',         color: '#3b82f6' },
    'vikingr':  { name: 'Vikingr',        color: '#60a5fa', aggressiveness: 0.7, honor: 0.4, mercantilism: 0.5 },
    'sarran':   { name: 'Sarran',         color: '#f59e0b', aggressiveness: 0.6, honor: 0.6, mercantilism: 0.7 },
    'vaegir':   { name: 'Vaegir',         color: '#a78bfa', aggressiveness: 0.4, honor: 0.8, mercantilism: 0.4 },
    'rhodok':   { name: 'Rhodok',         color: '#22c55e', aggressiveness: 0.5, honor: 0.5, mercantilism: 0.8 },
    'bandit':   { name: 'Bandits',        color: '#ef4444' },
    'beast':    { name: 'Beasts',         color: '#581c87' },
    'caravan':  { name: 'Caravan',        color: '#facc15' },
};
export const BASE_PLAYER_SPEED = 18000;
export const REAL_SECONDS_PER_GAME_HOUR = 90;
export const MIN_ZOOM = 0.02;
export const MAX_ZOOM = 3.0;
export const MAP_DIMENSION = 100000;
