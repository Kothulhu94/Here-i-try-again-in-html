# Remaining Issues to Fix

## 1. Title Screen - Cryo-Awakening Message
Edit `index.html` lines 13-14:
- Change "Beasts&Bandits 2D" to "CRYO-AWAKENING"  
- Change text-yellow-400 to text-cyan-400
- Replace description with sci-fi text

## 2. Enemy Not Spawning
The ambush party may be spawning in water/mountains.

Fix in `src/game.js` after line 138:
```javascript
// Ensure ambush spawns on passable terrain
let attempts = 0;
while (this.worldMap.isImpassable(this.worldMap.getTerrainAt(ambushX, ambushY)) && attempts < 50) {
    const ambushAngle = Math.random() * 2 * Math.PI;
    const ambushDistance = 300 + Math.random() * 200;
    ambushX = playerStartX + Math.cos(ambushAngle) * ambushDistance;
    ambushY = playerStartY + Math.sin(ambushAngle) * ambushDistance;
    attempts++;
}
```

## 3. Stuttering Performance

The stuttering is likely caused by:
- Too many console.logs still running
- Pathfinding calculations on every frame
- No frame rate limiting

Quick fixes:
- Remove remaining console logs in checkInteractions
- Add `requestAnimationFrame` throttling
- Reduce AI update frequency

The stuttering is NOT a limitation of the technology - it's a code optimization issue.
