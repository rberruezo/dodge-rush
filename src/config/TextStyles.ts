import Phaser from 'phaser';
import { COLORS } from './Constants';

/**
 * Centralised typography. Two pixel fonts (with monospace fallback):
 *  - HEAD: "Press Start 2P" — chunky, for titles / score / buttons.
 *  - BODY: "VT323" — condensed & readable, for labels / instructions / info.
 * Keeping all text styling here makes the look consistent and easy to tweak.
 */
export const FONT_HEAD = "'Press Start 2P', monospace";
export const FONT_BODY = "'VT323', monospace";

type Style = Phaser.Types.GameObjects.Text.TextStyle;
const shadow = (s: Style, blur = 0): Style => ({
  ...s,
  shadow: { offsetX: 0, offsetY: 4, color: '#00000099', blur, fill: true, stroke: false }
});

export const Text = {
  /** Big logo / screen titles. */
  title: (size = 46, color: string = COLORS.white): Style =>
    shadow({ fontFamily: FONT_HEAD, fontSize: `${size}px`, color }),

  /** The live score number. */
  score: (size = 54, color: string = COLORS.white): Style =>
    shadow({ fontFamily: FONT_HEAD, fontSize: `${size}px`, color }),

  /** Button labels. */
  button: (size = 26, color: string = COLORS.white): Style => ({
    fontFamily: FONT_HEAD,
    fontSize: `${size}px`,
    color
  }),

  /** Readable body text (instructions, info, results). */
  body: (size = 30, color: string = COLORS.white): Style => ({
    fontFamily: FONT_BODY,
    fontSize: `${size}px`,
    color
  }),

  /** Small HUD labels (best, lives, combo). */
  label: (size = 26, color: string = COLORS.gold): Style =>
    shadow({ fontFamily: FONT_BODY, fontSize: `${size}px`, color })
} as const;
