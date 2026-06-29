import type { Player } from '../objects/Player';
import type { Barrier } from '../objects/Barrier';

/**
 * Deterministic AABB collision.
 *
 * Each barrier is a horizontal wall with a gap (the "hole"). The player is safe
 * only while crossing a barrier's vertical band AND fully inside its gap. This
 * runs against a handful of active barriers per frame, so a simple manual check
 * is cheaper and more predictable than spinning up a physics engine.
 */
export class CollisionSystem {
  /** Returns the barrier the player collided with this frame, or null. */
  static check(player: Player, barriers: Barrier[]): Barrier | null {
    const box = player.getHitbox();
    const pTop = box.y - box.halfH;
    const pBottom = box.y + box.halfH;
    const pLeft = box.x - box.halfW;
    const pRight = box.x + box.halfW;

    for (const barrier of barriers) {
      if (!barrier.active) continue;

      const bTop = barrier.y - barrier.bandHeight / 2;
      const bBottom = barrier.y + barrier.bandHeight / 2;

      // No vertical overlap -> cannot collide with this barrier.
      if (pBottom <= bTop || pTop >= bBottom) continue;

      // Safe when the player's full width sits inside ANY of the barrier's gaps
      // (a fork has two; a normal wall has one). Otherwise it's a hit.
      let insideHole = false;
      for (const gap of barrier.safeGaps()) {
        const gapLeft = gap.x - gap.width / 2;
        const gapRight = gap.x + gap.width / 2;
        if (pLeft >= gapLeft && pRight <= gapRight) {
          insideHole = true;
          break;
        }
      }
      if (!insideHole) return barrier;
    }
    return null;
  }
}
