// Dynamic image color extraction with saturation boost for vivid ambient glow
const colorCache = new Map<string, string>();

export async function extractDominantColor(imageUrl: string, fallback = '#8B5CF6'): Promise<string> {
  if (!imageUrl) return fallback;
  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      resolve(fallback);
    }, 1200);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallback);
          return;
        }

        ctx.drawImage(img, 0, 0, 40, 40);
        const data = ctx.getImageData(0, 0, 40, 40).data;

        let bestR = 139, bestG = 92, bestB = 246; // fallback violet
        let maxSaturation = -1;

        // Find the most saturated, vibrant color from the image
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          const brightness = (r + g + b) / 3;

          // Ignore pitch black or pure white
          if (brightness > 40 && brightness < 230 && max > 0) {
            const saturation = delta / max;
            if (saturation > maxSaturation) {
              maxSaturation = saturation;
              bestR = r;
              bestG = g;
              bestB = b;
            }
          }
        }

        if (maxSaturation > 0.15) {
          const hex = `#${((1 << 24) + (bestR << 16) + (bestG << 8) + bestB).toString(16).slice(1)}`;
          colorCache.set(imageUrl, hex);
          resolve(hex);
        } else {
          colorCache.set(imageUrl, fallback);
          resolve(fallback);
        }
      } catch {
        resolve(fallback);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(fallback);
    };

    img.src = imageUrl;
  });
}
