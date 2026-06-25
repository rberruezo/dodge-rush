import Phaser from 'phaser';
import { ASSET_KEYS, COIN_CFG, COLORS } from '../config/Constants';
import { Text } from '../config/TextStyles';

export interface CoinOpts {
  size?: number; // text font size (px); coin scales to match
  color?: string;
  animate?: boolean; // spin (true) or a static coin (false)
}

/**
 * A coin icon + label, centred at (x, y), as a Container. Uses the spinning
 * coin sprite (slow loop) so coin totals feel alive. Returns the container so
 * callers can fade/move it.
 */
export function coinCounter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  opts: CoinOpts = {}
): Phaser.GameObjects.Container {
  const size = opts.size ?? 28;
  const coinPx = Math.round(size * 1.3);
  const gap = 8;

  const coin = scene.add.sprite(0, 0, ASSET_KEYS.COIN, opts.animate === false ? 12 : 0).setDisplaySize(coinPx, coinPx);
  if (opts.animate !== false && scene.anims.exists(COIN_CFG.animKey)) coin.play(COIN_CFG.animKey);

  const txt = scene.add.text(0, 0, label, Text.label(size, opts.color ?? COLORS.gold)).setOrigin(0, 0.5);

  const total = coinPx + gap + txt.width;
  coin.setOrigin(0.5).setPosition(-total / 2 + coinPx / 2, 0);
  txt.setPosition(-total / 2 + coinPx + gap, 0);

  return scene.add.container(x, y, [coin, txt]);
}
