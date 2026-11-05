# Impact Core (Combat VFX Enhancement)

Four transparent SVG effects: light, heavy, critical, finisher. All images are additive-friendly, scalable 512x512 vector stamps, animated by BattleVFX.draw via scale/fade over time. SVGs are visual assets; the preview concept-sheet is not used in-game.

Integration: town-battle impact() emits impactCore only after a successful hit; tactics-ui hit events emit the same. BattleVFX retains all original skill and particle assets. If images are unavailable, legacy bursts and rings remain; ?impact=0 forces original effects for A/B testing.

Durations (ms): light 280, heavy 380, critical 470, finisher 610. Do not apply impactCore to MISS, heal or unopposed guard. Game balance and damage rules are unchanged.
