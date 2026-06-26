import { describe, it, expect } from 'vitest';
import { poseFacesRight, shouldFlipX, POSE_FACES_RIGHT } from './PlayerFacing';

const ALL_POSES = ['hover', 'move', 'moveHard', 'boost', 'celebrate', 'cheer', 'dizzy'];

describe('PlayerFacing — natural pose facing', () => {
  it('side-flight poses face LEFT, idle/celebration poses face RIGHT', () => {
    expect(poseFacesRight('move')).toBe(false);
    expect(poseFacesRight('moveHard')).toBe(false);
    expect(poseFacesRight('hover')).toBe(true);
    expect(poseFacesRight('boost')).toBe(true);
    expect(poseFacesRight('cheer')).toBe(true);
    expect(poseFacesRight('celebrate')).toBe(true);
    expect(poseFacesRight('dizzy')).toBe(true);
  });

  it('defaults unknown poses to facing LEFT', () => {
    expect(poseFacesRight('nonexistent')).toBe(false);
  });
});

describe('PlayerFacing — mirror to travel direction', () => {
  it('mirrors a left-facing pose when travelling right', () => {
    expect(shouldFlipX(false, 1)).toBe(true); // move + going right -> flip
    expect(shouldFlipX(false, -1)).toBe(false); // move + going left  -> no flip
  });

  it('mirrors a right-facing pose when travelling left', () => {
    expect(shouldFlipX(true, -1)).toBe(true); // hover + going left  -> flip
    expect(shouldFlipX(true, 1)).toBe(false); // hover + going right -> no flip
  });

  it('INVARIANT: every pose ends up facing its travel direction', () => {
    for (const kind of ALL_POSES) {
      for (const dir of [1, -1] as const) {
        const natRight = poseFacesRight(kind);
        const flipped = shouldFlipX(natRight, dir);
        // Net visual facing: natural side, mirrored iff flipped.
        const netFacesRight = natRight !== flipped;
        const shouldFaceRight = dir === 1;
        expect(
          netFacesRight,
          `pose "${kind}" travelling ${dir > 0 ? 'right' : 'left'} should face ${
            shouldFaceRight ? 'right' : 'left'
          }`
        ).toBe(shouldFaceRight);
      }
    }
  });

  it('keeps the natural-facing map in sync with the poses it covers', () => {
    // Every key declared must be a known pose (guards typos / stale entries).
    for (const key of Object.keys(POSE_FACES_RIGHT)) {
      expect(ALL_POSES).toContain(key);
    }
  });
});
