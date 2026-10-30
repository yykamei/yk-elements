// @ts-check

/**
 * Color probes for browser tests.
 *
 * `getComputedStyle` may serialize a color in any space (oklch included), so
 * these helpers draw it to a canvas to read sRGB channels and compare them.
 *
 * ```js
 * channels('oklch(60% 0.2 20)'); // [r, g, b]
 * contrast('black', 'white'); // 21
 * ```
 */
const context = document.createElement('canvas').getContext('2d');
if (!context) {
  throw new Error('2D canvas is unavailable');
}

export function channels(color) {
  const probe = document.createElement('div');
  probe.style.color = color;
  document.body.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();

  if (!CSS.supports('color', resolved)) {
    throw new Error(`Unsupported color: ${resolved}`);
  }

  context.fillStyle = '#000000';
  context.fillStyle = resolved;
  context.fillRect(0, 0, 1, 1);
  return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
}

function luminance([red, green, blue]) {
  const linear = [red, green, blue].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrast(foreground, background) {
  const values = [
    luminance(channels(foreground)),
    luminance(channels(background)),
  ].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
