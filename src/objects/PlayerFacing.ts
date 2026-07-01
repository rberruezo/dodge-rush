/**
 * Pure facing/mirroring logic for the player sprite (no Phaser dependency, so
 * it is unit-testable).
 *
 * The art is drawn facing a fixed side per pose. In the current sheet every
 * pose faces RIGHT (the side-flight fly rows, boost, and the front-ish idle /
 * celebration poses). We mirror (flipX) per pose so the character always ends
 * up facing the direction it is travelling.
 */
export const POSE_FACES_RIGHT: Record<string, boolean> = {
  hover: true,
  move: true,
  moveHard: true,
  dizzy: true,
  boost: true,
  cheer: true,
  celebrate: true,
  impact: true,
  death: true
};

/** Natural facing of a pose's art. Unknown poses default to facing LEFT. */
export function poseFacesRight(kind: string): boolean {
  return POSE_FACES_RIGHT[kind] ?? false;
}

/**
 * Whether the sprite must be mirrored (flipX) to face its travel direction.
 * @param natFacesRight the pose art's natural side (see {@link poseFacesRight})
 * @param faceDir       travel facing: +1 = right, -1 = left
 */
export function shouldFlipX(natFacesRight: boolean, faceDir: 1 | -1): boolean {
  return natFacesRight ? faceDir === -1 : faceDir === 1;
}
