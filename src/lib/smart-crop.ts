/**
 * Smart Crop — 客户端 Canvas 图片焦点分析
 *
 * 1. 加载图片到 Canvas（缩小到 100px 宽采样）
 * 2. 用 Sobel 算子计算边缘强度
 * 3. 横向分 5 个区域，找信息量最密集的区域
 * 4. 返回 object-position 值（如 "50% 35%"）
 */

const SAMPLE_WIDTH = 100;
const ZONES = 5;

type AnalyzeResult = {
  position: string; // "x% y%"
  confidence: number; // 0-1
};

function toProxyUrl(url: string): string {
  if (!url.startsWith("http")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    // 先尝试直接加载，失败后走代理
    img.onerror = () => {
      const proxyImg = new Image();
      proxyImg.crossOrigin = "anonymous";
      proxyImg.onload = () => resolve(proxyImg);
      proxyImg.onerror = () => reject(new Error("Failed to load image"));
      proxyImg.src = toProxyUrl(url);
    };
    img.onload = () => resolve(img);
    img.src = url;
  });
}

/**
 * 检测并裁掉黑边（letterboxing）
 * 返回有效内容的垂直范围 [topRatio, bottomRatio]
 */
function detectLetterbox(data: Uint8ClampedArray, width: number, height: number): [number, number] {
  const BLACK_THRESHOLD = 30;
  const isRowBlack = (y: number): boolean => {
    let sum = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      sum += data[i] + data[i + 1] + data[i + 2];
    }
    return sum / width / 3 < BLACK_THRESHOLD;
  };

  let top = 0;
  let bottom = height - 1;

  // 从顶部往下找第一条非黑行
  while (top < height / 2 && isRowBlack(top)) top++;
  // 从底部往上找第一条非黑行
  while (bottom > height / 2 && isRowBlack(bottom)) bottom--;

  return [top / height, bottom / height];
}

/**
 * 用 Sobel 算子计算边缘强度
 */
function computeEdgeMap(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const edges = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // 灰度值
      const gray = (px: number, py: number): number => {
        const i = (py * width + px) * 4;
        return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      };

      // Sobel X
      const gx =
        -gray(x - 1, y - 1) + gray(x + 1, y - 1) +
        -2 * gray(x - 1, y) + 2 * gray(x + 1, y) +
        -gray(x - 1, y + 1) + gray(x + 1, y + 1);

      // Sobel Y
      const gy =
        -gray(x - 1, y - 1) - 2 * gray(x, y - 1) - gray(x + 1, y - 1) +
        gray(x - 1, y + 1) + 2 * gray(x, y + 1) + gray(x + 1, y + 1);

      edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return edges;
}

/**
 * 分析图片，返回最佳 object-position
 */
export async function analyzeImageFocus(url: string): Promise<AnalyzeResult> {
  try {
    const img = await loadImage(url);

    // 缩小到采样尺寸
    const scale = SAMPLE_WIDTH / img.naturalWidth;
    const width = SAMPLE_WIDTH;
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { position: "50% 50%", confidence: 0 };

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;

    // 1. 检测黑边
    const [letterTop, letterBottom] = detectLetterbox(data, width, height);
    const hasLetterbox = letterTop > 0.05 || letterBottom < 0.95;

    // 2. 计算边缘图
    const edges = computeEdgeMap(data, width, height);

    // 3. 在有效区域内（去掉黑边）计算横向能量分布
    const effectiveTop = Math.floor(letterTop * height);
    const effectiveBottom = Math.ceil(letterBottom * height);
    const effectiveHeight = effectiveBottom - effectiveTop;

    if (effectiveHeight < 10) {
      return { position: "50% 50%", confidence: 0 };
    }

    // 横向分 ZONES 个区域
    const zoneWidth = Math.floor(width / ZONES);
    const zoneEnergies = new Float32Array(ZONES);

    for (let z = 0; z < ZONES; z++) {
      let sum = 0;
      let count = 0;
      for (let y = effectiveTop; y < effectiveBottom; y++) {
        for (let x = z * zoneWidth; x < (z + 1) * zoneWidth; x++) {
          sum += edges[y * width + x];
          count++;
        }
      }
      zoneEnergies[z] = count > 0 ? sum / count : 0;
    }

    // 4. 找能量最高的区域
    let maxZone = 0;
    let maxEnergy = 0;
    let totalEnergy = 0;
    for (let z = 0; z < ZONES; z++) {
      totalEnergy += zoneEnergies[z];
      if (zoneEnergies[z] > maxEnergy) {
        maxEnergy = zoneEnergies[z];
        maxZone = z;
      }
    }

    // 5. 计算垂直方向的最佳位置
    // 在有效区域内，找能量最高的行带
    const rowBands = 5;
    const bandHeight = Math.floor(effectiveHeight / rowBands);
    const bandEnergies = new Float32Array(rowBands);

    for (let b = 0; b < rowBands; b++) {
      let sum = 0;
      let count = 0;
      for (let y = effectiveTop + b * bandHeight; y < effectiveTop + (b + 1) * bandHeight && y < effectiveBottom; y++) {
        for (let x = 0; x < width; x++) {
          sum += edges[y * width + x];
          count++;
        }
      }
      bandEnergies[b] = count > 0 ? sum / count : 0;
    }

    let maxBand = 0;
    let maxBandEnergy = 0;
    for (let b = 0; b < rowBands; b++) {
      if (bandEnergies[b] > maxBandEnergy) {
        maxBandEnergy = bandEnergies[b];
        maxBand = b;
      }
    }

    // 6. 计算最终位置
    // X: 最高能量区域的中心
    const xPos = ((maxZone + 0.5) / ZONES) * 100;

    // Y: 在有效区域内的相对位置，映射回原图比例
    const yInEffective = (maxBand + 0.5) / rowBands;
    const yPos = (letterTop + yInEffective * (letterBottom - letterTop)) * 100;

    // 置信度：能量分布的集中程度
    const confidence = totalEnergy > 0 ? maxEnergy * ZONES / totalEnergy : 0;

    // 如果所有区域能量差不多（纯色图），默认居中
    if (confidence < 1.2) {
      return { position: "50% 50%", confidence: 0.1 };
    }

    return {
      position: `${Math.round(xPos)}% ${Math.round(yPos)}%`,
      confidence: Math.min(confidence / 2, 1),
    };
  } catch {
    return { position: "50% 50%", confidence: 0 };
  }
}
