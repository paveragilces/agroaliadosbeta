import React, { useEffect, useMemo, useState } from 'react';
import './ImageAnalytics.css';
import { UploadCloud, Activity, Download, SlidersHorizontal, Printer } from 'lucide-react';

const CATEGORY_STYLES = {
  healthy: { label: 'Cobertura sana', color: '#0f9f6e', heatmap: [34, 197, 94] },
  mild: { label: 'Estrés leve', color: '#facc15', heatmap: [250, 204, 21] },
  moderate: { label: 'Estrés medio', color: '#fb923c', heatmap: [251, 146, 60] },
  severe: { label: 'Estrés severo', color: '#dc2626', heatmap: [220, 38, 38] },
};

const METRIC_BASE_RANGES = {
  gli: { healthy: [0.08, 0.18], mild: [-0.02, 0.05], severe: [-0.15, -0.02] },
  vari: { healthy: [0.02, 0.12], mild: [-0.04, 0.02], severe: [-0.18, -0.04] },
  tgi: { healthy: [-40, 30], mild: [-110, -40], severe: [-220, -110] }
};

const MAX_DIMENSION = 900;

const readFileAsDataURL = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });

const loadImageElement = dataUrl =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('La imagen está dañada o tiene un formato no soportado.'));
    img.src = dataUrl;
  });

const createHeatmap = (buffer, width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(buffer);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

const createOverlayHeatmap = (baseCanvas, buffer, width, height, opacity = 0.45) => {
  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = width;
  overlayCanvas.height = height;
  const ctx = overlayCanvas.getContext('2d');
  ctx.drawImage(baseCanvas, 0, 0, width, height);

  const heatmapCanvas = document.createElement('canvas');
  heatmapCanvas.width = width;
  heatmapCanvas.height = height;
  const heatmapCtx = heatmapCanvas.getContext('2d');
  const imageData = heatmapCtx.createImageData(width, height);
  imageData.data.set(buffer);
  heatmapCtx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(heatmapCanvas, 0, 0, width, height);
  ctx.restore();

  return overlayCanvas.toDataURL('image/png');
};

const scoreMap = {
  severe: 0,
  moderate: 1,
  mild: 2,
  healthy: 3
};

const combinedBucketFromScore = score => {
  if (score >= 2.4) return 'healthy';
  if (score >= 1.5) return 'mild';
  if (score >= 0.8) return 'moderate';
  return 'severe';
};

const analyzeImageFile = async (file, strictnessValue = 50, progressCallback, zoneCount = 4) => {
  progressCallback?.('Preparando imagen…');
  const sourceDataUrl = await readFileAsDataURL(file);
  const image = await loadImageElement(sourceDataUrl);
  progressCallback?.('Ajustando resolución…');
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  const perMetricStats = {
    gli: { total: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    vari: { total: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    tgi: { total: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
  };
  const percentileSamples = {
    gli: [],
    vari: [],
    tgi: [],
  };

  let pixels = 0;

  progressCallback?.('Calculando índices base…');
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const denominator = 2 * g + r + b;
    if (!denominator) continue;
    const gli = (2 * g - r - b) / denominator;
    const variDen = g + r - b;
    const vari = variDen === 0 ? 0 : (g - r) / variDen;
    const tgi = -0.5 * (190 * (r - g) - 120 * (r - b));

    perMetricStats.gli.total += gli;
    perMetricStats.vari.total += vari;
    perMetricStats.tgi.total += tgi;
    perMetricStats.gli.min = Math.min(perMetricStats.gli.min, gli);
    perMetricStats.gli.max = Math.max(perMetricStats.gli.max, gli);
    perMetricStats.vari.min = Math.min(perMetricStats.vari.min, vari);
    perMetricStats.vari.max = Math.max(perMetricStats.vari.max, vari);
    perMetricStats.tgi.min = Math.min(perMetricStats.tgi.min, tgi);
    perMetricStats.tgi.max = Math.max(perMetricStats.tgi.max, tgi);
    percentileSamples.gli.push(gli);
    percentileSamples.vari.push(vari);
    percentileSamples.tgi.push(tgi);
    pixels += 1;
  }

  const computePercentiles = (values) => {
    if (!values?.length) return {};
    const sorted = [...values].sort((a, b) => a - b);
    const pick = (p) => {
      const idx = Math.min(sorted.length - 1, Math.floor(((p / 100) * (sorted.length - 1))));
      return sorted[idx];
    };
    return {
      p15: pick(15),
      p30: pick(30),
      p45: pick(45),
      p60: pick(60),
      p70: pick(70),
    };
  };

  const percentileSnapshot = {
    gli: {
      percentiles: computePercentiles(percentileSamples.gli),
      min: Number.isFinite(perMetricStats.gli.min) ? perMetricStats.gli.min : 0,
      max: Number.isFinite(perMetricStats.gli.max) ? perMetricStats.gli.max : 0
    },
    vari: {
      percentiles: computePercentiles(percentileSamples.vari),
      min: Number.isFinite(perMetricStats.vari.min) ? perMetricStats.vari.min : 0,
      max: Number.isFinite(perMetricStats.vari.max) ? perMetricStats.vari.max : 0
    },
    tgi: {
      percentiles: computePercentiles(percentileSamples.tgi),
      min: Number.isFinite(perMetricStats.tgi.min) ? perMetricStats.tgi.min : 0,
      max: Number.isFinite(perMetricStats.tgi.max) ? perMetricStats.tgi.max : 0
    }
  };

  const thresholdSet = buildThresholdSet(strictnessValue, percentileSnapshot);

  const metrics = ['gli', 'vari', 'tgi'];
  const categoryMatrix = {
    gli: { healthy: 0, mild: 0, moderate: 0, severe: 0 },
    vari: { healthy: 0, mild: 0, moderate: 0, severe: 0 },
    tgi: { healthy: 0, mild: 0, moderate: 0, severe: 0 },
    combined: { healthy: 0, mild: 0, moderate: 0, severe: 0 }
  };

  const heatmapBuffers = {
    gli: new Uint8ClampedArray(data.length),
    vari: new Uint8ClampedArray(data.length),
    tgi: new Uint8ClampedArray(data.length),
    combined: new Uint8ClampedArray(data.length)
  };
  const vegetationMask = new Uint8Array(width * height);
  const diseasedMask = new Uint8Array(width * height);

  const gridRows = 8;
  const gridCols = 8;
  const cellCounts = Array(gridRows * gridCols).fill(0);
  const cellSevere = Array(gridRows * gridCols).fill(0);
  let combinedScoreTotal = 0;
  let agreementPixels = 0;
  const hotspotCells = [];

  progressCallback?.('Clasificando píxeles…');
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const denominator = 2 * g + r + b;
    if (!denominator) continue;
    const gli = (2 * g - r - b) / denominator;
    const variDen = g + r - b;
    const vari = variDen === 0 ? 0 : (g - r) / variDen;
    const tgi = -0.5 * (190 * (r - g) - 120 * (r - b));

    const gliBucket = categorizeValue(gli, thresholdSet.gli);
    const variBucket = categorizeValue(vari, thresholdSet.vari);
    const tgiBucket = categorizeValue(tgi, thresholdSet.tgi);

    categoryMatrix.gli[gliBucket] += 1;
    categoryMatrix.vari[variBucket] += 1;
    categoryMatrix.tgi[tgiBucket] += 1;

    const pixelIndex = index / 4;
    const y = Math.floor(pixelIndex / width);
    const x = pixelIndex % width;
    const brightness = (r + g + b) / 3;
    const isVegetation =
      brightness > 30 &&
      g >= r * 0.9 &&
      g >= b * 0.9 &&
      gli > thresholdSet.gli.mild;
    if (isVegetation) vegetationMask[pixelIndex] = 1;
    const row = Math.min(gridRows - 1, Math.floor((y / height) * gridRows));
    const col = Math.min(gridCols - 1, Math.floor((x / width) * gridCols));
    const cellIndex = row * gridCols + col;
    cellCounts[cellIndex] += 1;
    if (gliBucket === 'severe' || variBucket === 'severe' || tgiBucket === 'severe') {
      cellSevere[cellIndex] += 1;
    }

    const combinedScore =
      (scoreMap[gliBucket] + scoreMap[variBucket] + scoreMap[tgiBucket]) / metrics.length;
    combinedScoreTotal += combinedScore;
    const combinedBucket = combinedBucketFromScore(combinedScore);
    categoryMatrix.combined[combinedBucket] += 1;
    if (gliBucket === variBucket && variBucket === tgiBucket) {
      agreementPixels += 1;
    }
    if (combinedBucket === 'severe') {
      diseasedMask[pixelIndex] = 1;
    }

    const fillBuffer = (buffer, bucket) => {
      const [hr, hg, hb] = CATEGORY_STYLES[bucket].heatmap;
      buffer[index] = hr;
      buffer[index + 1] = hg;
      buffer[index + 2] = hb;
      buffer[index + 3] = 255;
    };
    fillBuffer(heatmapBuffers.gli, gliBucket);
    fillBuffer(heatmapBuffers.vari, variBucket);
    fillBuffer(heatmapBuffers.tgi, tgiBucket);
    fillBuffer(heatmapBuffers.combined, combinedBucket);
  }

  const anomalyCount = cellCounts.reduce((count, total, idx) => {
    if (!total) return count;
    const severityRatio = cellSevere[idx] / total;
    if (severityRatio >= 0.25) {
      hotspotCells.push({
        index: idx,
        ratio: severityRatio,
        row: Math.floor(idx / gridCols),
        col: idx % gridCols
      });
      return count + 1;
    }
    return count;
  }, 0);
  const sortedHotspots = hotspotCells.sort((a, b) => b.ratio - a.ratio).slice(0, 4);

  progressCallback?.('Resumiendo métricas…');
  const gliAverage = pixels ? perMetricStats.gli.total / pixels : 0;
  const variAverage = pixels ? perMetricStats.vari.total / pixels : 0;
  const tgiAverage = pixels ? perMetricStats.tgi.total / pixels : 0;
  const combinedAverage = pixels ? combinedScoreTotal / pixels : 0;
  const overlayImages = {
    gli: createOverlayHeatmap(canvas, heatmapBuffers.gli, width, height),
    vari: createOverlayHeatmap(canvas, heatmapBuffers.vari, width, height),
    tgi: createOverlayHeatmap(canvas, heatmapBuffers.tgi, width, height),
    combined: createOverlayHeatmap(canvas, heatmapBuffers.combined, width, height)
  };
  const zoneData = computeZoneClusters(
    width,
    height,
    heatmapBuffers.combined,
    12,
    12,
    zoneCount
  );

  progressCallback?.('Generando mapas…');
  return {
    originalImage: canvas.toDataURL('image/jpeg', 0.85),
    heatmapImage: createHeatmap(heatmapBuffers.gli, width, height),
    heatmapImages: {
      gli: createHeatmap(heatmapBuffers.gli, width, height),
      vari: createHeatmap(heatmapBuffers.vari, width, height),
      tgi: createHeatmap(heatmapBuffers.tgi, width, height),
      combined: createHeatmap(heatmapBuffers.combined, width, height)
    },
    overlayImage: overlayImages.gli,
    overlayImages,
    stats: {
      totalPixels: pixels,
      gliAverage,
      gliMin: Number.isFinite(perMetricStats.gli.min) ? perMetricStats.gli.min : 0,
      gliMax: Number.isFinite(perMetricStats.gli.max) ? perMetricStats.gli.max : 0,
      variAverage,
      variMin: Number.isFinite(perMetricStats.vari.min) ? perMetricStats.vari.min : 0,
      variMax: Number.isFinite(perMetricStats.vari.max) ? perMetricStats.vari.max : 0,
      tgiAverage,
      tgiMin: Number.isFinite(perMetricStats.tgi.min) ? perMetricStats.tgi.min : 0,
      tgiMax: Number.isFinite(perMetricStats.tgi.max) ? perMetricStats.tgi.max : 0,
      anomalyCount,
      categories: categoryMatrix.gli,
      perMetric: {
        gli: { categories: categoryMatrix.gli, average: gliAverage, min: perMetricStats.gli.min, max: perMetricStats.gli.max },
        vari: { categories: categoryMatrix.vari, average: variAverage, min: perMetricStats.vari.min, max: perMetricStats.vari.max },
        tgi: { categories: categoryMatrix.tgi, average: tgiAverage, min: perMetricStats.tgi.min, max: perMetricStats.tgi.max },
        combined: { categories: categoryMatrix.combined, average: combinedAverage }
      },
      agreement: {
        matchPercent: pixels ? (agreementPixels / pixels) * 100 : 0,
        dominant: Object.keys(categoryMatrix.combined).reduce((prev, cur) =>
          categoryMatrix.combined[cur] > (categoryMatrix.combined[prev] || 0) ? cur : prev
        , 'healthy')
      },
      hotspots: sortedHotspots,
      gridSize: { rows: gridRows, cols: gridCols },
      zones: zoneData.clusters
    },
    dimensions: { width, height },
    zoneOverlayImage: zoneData.overlay,
    percentileSnapshot,
    thresholds: thresholdSet,
  };
};

const formatPercent = (count, total) => {
  if (!total) return '0%';
  return `${((count / total) * 100).toFixed(1)}%`;
};

const formatDate = isoString => {
  try {
    return new Date(isoString).toLocaleString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
};

const zoneLabelFromCell = (row, col, totalRows, totalCols) => {
  const rowBand = totalRows / 3;
  const colBand = totalCols / 3;
  const rowLabel = row < rowBand ? 'norte' : row >= 2 * rowBand ? 'sur' : 'centro';
  const colLabel = col < colBand ? 'oeste' : col >= 2 * colBand ? 'este' : 'centro';
  return `${rowLabel} ${colLabel}`.trim();
};

const zoneLabelFromPoint = (x, y, width, height) => {
  const totalRows = 3;
  const totalCols = 3;
  const row = Math.min(totalRows - 1, Math.floor((y / height) * totalRows));
  const col = Math.min(totalCols - 1, Math.floor((x / width) * totalCols));
  return zoneLabelFromCell(row, col, totalRows, totalCols);
};

const computeZoneClusters = (
  width,
  height,
  combinedBuffer,
  gridRows = 12,
  gridCols = 12,
  k = 4
) => {
  if (!combinedBuffer?.length) return { clusters: [], overlay: null };

  const cells = [];
  const cellWidth = Math.ceil(width / gridCols);
  const cellHeight = Math.ceil(height / gridRows);

  for (let row = 0; row < gridRows; row += 1) {
    for (let col = 0; col < gridCols; col += 1) {
      const startX = col * cellWidth;
      const startY = row * cellHeight;
      const limitX = Math.min(width, startX + cellWidth);
      const limitY = Math.min(height, startY + cellHeight);
      const cellArea = (limitX - startX) * (limitY - startY);
      if (!cellArea) continue;
      let severe = 0;
      let mild = 0;
      let moderate = 0;
      let healthy = 0;

      for (let y = startY; y < limitY; y += 1) {
        for (let x = startX; x < limitX; x += 1) {
          const idx = (y * width + x) * 4;
          const r = combinedBuffer[idx];
          const g = combinedBuffer[idx + 1];
          const b = combinedBuffer[idx + 2];
          if (r > 180 && g < 150) severe += 1;
          else if (r > 200 && g > 200) moderate += 1;
          else if (g > 170 && b < 140) mild += 1;
          else healthy += 1;
        }
      }

      const total = severe + moderate + mild + healthy || 1;
      cells.push({
        row,
        col,
        startX,
        startY,
        width: limitX - startX,
        height: limitY - startY,
        features: [
          severe / total,
          moderate / total,
          mild / total,
          healthy / total,
          (row + 1) / gridRows,
          (col + 1) / gridCols
        ]
      });
    }
  }

  const runKMeans = (points, clustersCount) => {
    if (!points.length) return [];
    const centroids = points
      .slice(0, clustersCount)
      .map(item => [...item.features]);

    const assignments = new Array(points.length).fill(0);
    const distance = (a, b) =>
      Math.sqrt(a.reduce((acc, value, idx) => acc + (value - b[idx]) ** 2, 0));

    for (let iter = 0; iter < 12; iter += 1) {
      let moved = false;
      points.forEach((point, idx) => {
        let bestCluster = 0;
        let minDist = Number.POSITIVE_INFINITY;
        centroids.forEach((centroid, clusterIdx) => {
          const dist = distance(point.features, centroid);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = clusterIdx;
          }
        });
        if (assignments[idx] !== bestCluster) {
          assignments[idx] = bestCluster;
          moved = true;
        }
      });
      if (!moved) break;
      centroids.forEach((centroid, clusterIdx) => {
        const assignedPoints = points.filter((_, idx) => assignments[idx] === clusterIdx);
        if (!assignedPoints.length) return;
        assignedPoints[0].features.forEach((_, featureIdx) => {
          const value = assignedPoints.reduce(
            (sum, point) => sum + point.features[featureIdx],
            0
          );
          centroid[featureIdx] = value / assignedPoints.length;
        });
      });
    }
    return assignments;
  };

  const cappedK = Math.max(2, Math.min(6, k));
  const assignments = runKMeans(cells, cappedK);
  const clusterMeta = Array.from({ length: cappedK }, () => ({
    area: 0,
    severe: 0,
    mild: 0,
    moderate: 0,
    healthy: 0,
    cells: []
  }));

  cells.forEach((cell, idx) => {
    const zone = assignments[idx] ?? 0;
    const meta = clusterMeta[zone];
    const cellArea = cell.width * cell.height;
    meta.area += cellArea;
    meta.severe += cell.features[0] * cellArea;
    meta.moderate += cell.features[1] * cellArea;
    meta.mild += cell.features[2] * cellArea;
    meta.healthy += cell.features[3] * cellArea;
    meta.cells.push(cell);
  });

  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = width;
  overlayCanvas.height = height;
  const overlayCtx = overlayCanvas.getContext('2d');
  overlayCtx.fillStyle = 'rgba(0,0,0,0)';
  overlayCtx.fillRect(0, 0, width, height);

  clusterMeta.forEach((meta, idx) => {
    const severityScore = meta.area
      ? (meta.severe * 1.2 + meta.moderate * 0.8 + meta.mild * 0.3) / meta.area
      : 0;
    let fillColor = CLUSTER_COLORS[3];
    if (severityScore >= 0.4) fillColor = CLUSTER_COLORS[0];
    else if (severityScore >= 0.25) fillColor = CLUSTER_COLORS[1];
    else if (severityScore >= 0.12) fillColor = CLUSTER_COLORS[2];

    overlayCtx.fillStyle = fillColor;
    overlayCtx.beginPath();
    meta.cells.forEach(cell => {
      overlayCtx.rect(cell.startX, cell.startY, cell.width, cell.height);
    });
    overlayCtx.fill();

    overlayCtx.fillStyle = 'rgba(15,23,42,0.8)';
    overlayCtx.font = 'bold 16px Inter, sans-serif';
    overlayCtx.textAlign = 'center';
    overlayCtx.textBaseline = 'middle';
    const centroidX = meta.cells.reduce((sum, cell) => sum + cell.startX + cell.width / 2, 0) / meta.cells.length;
    const centroidY = meta.cells.reduce((sum, cell) => sum + cell.startY + cell.height / 2, 0) / meta.cells.length;
    overlayCtx.fillText(idx + 1, centroidX, centroidY);
  });

  const totalArea = width * height || 1;
  const clusters = clusterMeta.map((meta, idx) => ({
    id: `zone-${idx + 1}`,
    label: `Zona ${idx + 1}`,
    areaPercent: (meta.area / totalArea) * 100,
    severePercent: meta.area ? (meta.severe / meta.area) * 100 : 0,
    mildPercent: meta.area ? (meta.mild / meta.area) * 100 : 0,
    moderatePercent: meta.area ? (meta.moderate / meta.area) * 100 : 0,
    healthyPercent: meta.area ? (meta.healthy / meta.area) * 100 : 0
  }));

  return {
    clusters,
    overlay: overlayCanvas.toDataURL('image/png')
  };
};
const buildInsightMessages = stats => {
  if (!stats) return [];
  const insights = [];
  const total = stats.totalPixels || 0;
  const combinedCategories = stats.perMetric?.combined?.categories || stats.categories || {};
  const severePercent = total ? ((combinedCategories.severe || 0) / total) * 100 : 0;
  if (severePercent >= 25) {
    insights.push(`⚠️ ${severePercent.toFixed(1)}% del lote presenta estrés severo. Recomienda visita técnica inmediata.`);
  } else if (severePercent >= 10) {
    insights.push(`⚠️ ${severePercent.toFixed(1)}% muestra estrés severo. Atiende esos bloques en los próximos 3 días.`);
  }
  (stats.hotspots || []).forEach(spot => {
    const zone = zoneLabelFromCell(
      spot.row,
      spot.col,
      stats.gridSize?.rows || 8,
      stats.gridSize?.cols || 8
    );
    insights.push(
      `📍 ${Math.round(spot.ratio * 100)}% de estrés en el cuadrante ${zone}. Refuerza riego o nutrición focalizada.`
    );
  });
  if (!insights.length) {
    insights.push('✅ Cobertura homogénea. Mantén el plan de manejo actual.');
  }
  return insights;
};

const buildThresholdSet = (strictness, statsSnapshot) => {
  const pct = Math.min(Math.max(strictness, 0), 100) / 100;
  const mixRatio = pct * 0.6; // soften default sensitivity
  const average = values => {
    const finiteValues = values.filter(Number.isFinite);
    if (!finiteValues.length) return undefined;
    return finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
  };
  const blendValue = (baseValue, dynamicValue, decimals = 3) => {
    const target = Number.isFinite(dynamicValue) ? dynamicValue : baseValue;
    return parseFloat((baseValue + (target - baseValue) * mixRatio).toFixed(decimals));
  };

  const output = {};
  Object.entries(METRIC_BASE_RANGES).forEach(([metric, ranges]) => {
    const snapshot = statsSnapshot?.[metric];
    const percentiles = snapshot?.percentiles || {};
    const decimals = metric === 'tgi' ? 1 : 3;

    const healthyBase = average(ranges.healthy) ?? ranges.healthy[1];
    const healthyDynamic = average([
      percentiles.p60,
      percentiles.p70,
      percentiles.p45
    ]);

    const mildBase = average(ranges.mild) ?? ranges.mild[1];
    const mildDynamic = average([percentiles.p30, percentiles.p45]);

    const severeBase = average(ranges.severe) ?? ranges.severe[1];
    const severeDynamic = Number.isFinite(percentiles.p15)
      ? percentiles.p15
      : snapshot?.min;

    output[metric] = {
      healthy: blendValue(healthyBase, healthyDynamic, decimals),
      mild: blendValue(mildBase, mildDynamic, decimals),
      severe: blendValue(severeBase, severeDynamic, decimals)
    };
  });
  return output;
};

const categorizeValue = (value, metricThresholds) => {
  if (!metricThresholds) return 'moderate';
  if (value >= metricThresholds.healthy) return 'healthy';
  if (value >= metricThresholds.mild) return 'mild';
  if (value <= metricThresholds.severe) return 'severe';
  return 'moderate';
};

const FORMULA_INFO = [
  { label: 'GLI', formula: '(2G − R − B) / (2G + R + B)' },
  { label: 'VARI', formula: '(G − R) / (G + R − B)' },
  { label: 'TGI', formula: '−0.5 · [190(R − G) − 120(R − B)]' }
];

const REFERENCE_INFO = [
  'Louhaichi M., Borman M. M., Johnson D. E. (2001). A photographic technique for estimating rangeland vegetation cover. Agronomy Journal 93(4).',
  'Hunt E. R., Doraiswamy P. C., McMurtrey J. E. et al. (2013). Measuring wheat senescence with VARI and other vegetation indices. Remote Sensing Letters 4(4).'
];

const METRIC_LABELS = {
  gli: 'GLI',
  vari: 'VARI',
  tgi: 'TGI',
  combined: 'Combinado'
};

const CLUSTER_COLORS = [
  'rgba(220, 38, 38, 0.5)',   // rojo severo
  'rgba(234, 179, 8, 0.5)',   // amarillo intenso
  'rgba(250, 204, 21, 0.5)',  // amarillo suave
  'rgba(34, 197, 94, 0.5)',   // verde saludable
];

const ImageAnalytics = ({ role, currentUser, fincas = [], analyses = [], onSaveAnalysis }) => {
  const [selectedFinca, setSelectedFinca] = useState(fincas[0]?.id || '');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [strictness, setStrictness] = useState(50);
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [metricView, setMetricView] = useState({});
  const [showStrictnessControls, setShowStrictnessControls] = useState(false);
  const [showFormulaGuide, setShowFormulaGuide] = useState(false);
  const [sectionState, setSectionState] = useState({
    data: true,
    parameters: true,
    notes: true
  });
  const [zoneCount, setZoneCount] = useState(4);

  const thresholds = useMemo(() => buildThresholdSet(strictness), [strictness]);

  useEffect(() => {
    if (fincas.length === 0) {
      setSelectedFinca('');
      return;
    }
    if (!selectedFinca || !fincas.find(f => f.id === selectedFinca)) {
      setSelectedFinca(fincas[0].id);
    }
  }, [fincas, selectedFinca]);

  const orderedAnalyses = useMemo(() =>
    [...analyses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [analyses]
  );

  const handleFileChange = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSelectedImage(null);
      setImageMeta(null);
      setError('Selecciona un archivo de imagen (JPG o PNG).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setSelectedImage(null);
      setImageMeta(null);
      setError('La imagen supera los 20 MB. Reduce el tamaño antes de subirla.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataURL(file);
      const img = await loadImageElement(dataUrl);
      setSelectedImage({ file, dataUrl });
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight, name: file.name, size: file.size });
      setError('');
      setPlantSamples([]);
    } catch (err) {
      console.error(err);
      setError('No pudimos leer la imagen. Intenta con otro archivo.');
    }
  };

  const toggleSection = key => {
    setSectionState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportAnalysis = analysis => {
    if (!analysis) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    const { stats = {} } = analysis;
    const total = stats.totalPixels || 0;
    const categoriesData =
      stats.perMetric?.combined?.categories || stats.categories || {};
    const insights = buildInsightMessages(stats);
    const categoryRows = Object.keys(CATEGORY_STYLES)
      .map(key => {
        const label = CATEGORY_STYLES[key].label;
        const count = categoriesData[key] || 0;
        const percent = total ? ((count / total) * 100).toFixed(1) : '0.0';
        return `<tr><td>${label}</td><td>${percent}%</td><td>${count.toLocaleString('es-EC')}</td></tr>`;
      })
      .join('');
    const insightsList = insights
      .map(item => `<li>${item}</li>`)
      .join('');
    const zones = analysis.stats?.zones;
    const zoneBlock = zones && zones.length
      ? `<h2>Zonas detectadas</h2>
         <ul>
           ${zones
             .map(
               zone =>
                 `<li>${zone.label}: ${zone.areaPercent.toFixed(1)}% del lote, estrés severo ${zone.severePercent.toFixed(1)}%</li>`
             )
             .join('')}
         </ul>`
      : '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${analysis.title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin-bottom: 4px; }
            .meta { color: #475569; margin-bottom: 16px; }
            .preview { display: flex; gap: 12px; margin-bottom: 18px; }
            .preview img { width: 48%; border-radius: 12px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e2e8f0; }
            ul { padding-left: 18px; }
            .insights { background: #f8fafc; padding: 12px; border-radius: 12px; margin-top: 16px; }
            .notes { margin-top: 12px; font-style: italic; color: #334155; }
          </style>
        </head>
        <body>
          <h1>${analysis.title}</h1>
          <div class="meta">${analysis.fincaName} · ${formatDate(analysis.createdAt)}</div>
          <div class="preview">
            <img src="${analysis.originalImage}" alt="Original" />
            <img src="${analysis.heatmapImage}" alt="Clasificación" />
          </div>
          <h2>Clasificación por niveles</h2>
          <table>
            <thead><tr><th>Estado</th><th>Porcentaje</th><th>Píxeles</th></tr></thead>
            <tbody>${categoryRows}</tbody>
          </table>
          ${zoneBlock}
          <div class="insights">
            <h3>Recomendaciones</h3>
            <ul>${insightsList}</ul>
          </div>
          ${analysis.notes ? `<p class="notes">Notas: ${analysis.notes}</p>` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!selectedFinca) {
      setError('Selecciona una finca para asociar el análisis.');
      return;
    }
    if (!selectedImage?.file) {
      setError('Adjunta una imagen de vuelo para analizar.');
      return;
    }
    setProcessing(true);
    setProcessingStage('Preparando imagen…');
    setError('');
    try {
      const fincaMeta = fincas.find(f => f.id === selectedFinca) || {};
      const analysisPayload = await analyzeImageFile(
        selectedImage.file,
        strictness,
        stage => setProcessingStage(stage || ''),
        zoneCount
      );
      onSaveAnalysis({
        id: `img-${Date.now()}`,
        fincaId: selectedFinca,
        fincaName: fincaMeta.name || 'Finca sin nombre',
        producerId: fincaMeta.producerId || currentUser?.id || null,
        producerName: fincaMeta.producerName || currentUser?.owner || currentUser?.name || 'Productor',
        authorId: currentUser?.id || null,
        authorName: currentUser?.name || 'Usuario',
        role,
        title: title.trim() || `Análisis ${new Date().toLocaleDateString('es-EC')}`,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        thresholds: analysisPayload.thresholds,
        percentileSnapshot: analysisPayload.percentileSnapshot,
        ...analysisPayload,
      });
      setSelectedImage(null);
      setImageMeta(null);
      setTitle('');
      setNotes('');
      setProcessingStage('');
    } catch (err) {
      console.error(err);
      setError('No pudimos procesar la imagen. Intenta con otra resolución o formato.');
    } finally {
      setProcessing(false);
      setProcessingStage('');
    }
  };

  return (
    <div className="imageAnalytics">
      <section className="imageAnalytics__panel">
        <div className="imageAnalytics__panelHeader">
          <div>
            <p className="eyebrow">Laboratorio RGB</p>
            <h1>Analiza la salud de tus lotes con imágenes de dron</h1>
            <p>Calculamos índices GLI/VARI a partir de cualquier fotografía RGB y generamos un mapa de estrés listo para compartir.</p>
          </div>
        </div>
        <div className="imageAnalytics__legendBar">
          {Object.entries(CATEGORY_STYLES).map(([key, meta]) => (
            <span key={key}>
              <span className="imageCard__legendDot" style={{ backgroundColor: meta.color }} />
              {meta.label}
            </span>
          ))}
        </div>

        <form className="imageAnalytics__form" onSubmit={handleSubmit}>
          <div className={`imageAnalytics__section ${sectionState.data ? 'is-open' : ''}`}>
            <button
              type="button"
              className="imageAnalytics__sectionToggle"
              onClick={() => toggleSection('data')}
              aria-expanded={sectionState.data}
            >
              <div>
                <p>Datos del vuelo</p>
                <small>Selecciona la finca y la imagen a analizar.</small>
              </div>
              <span>{sectionState.data ? '−' : '+'}</span>
            </button>
            {sectionState.data && (
              <div className="imageAnalytics__sectionContent">
                <div className="imageAnalytics__formRow">
                  <label>
                    Finca asociada
                    <select
                      value={selectedFinca}
                      onChange={event => setSelectedFinca(event.target.value)}
                      className="imageAnalytics__select"
                    >
                      {fincas.map(finca => (
                        <option key={finca.id} value={finca.id}>
                          {finca.name}
                          {finca.producerName ? ` · ${finca.producerName}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Nombre del análisis (opcional)
                    <input
                      type="text"
                      value={title}
                      maxLength={80}
                      placeholder="Vuelo semanal Lote 3"
                      onChange={event => setTitle(event.target.value)}
                    />
                  </label>
                </div>

                <label className="imageAnalytics__upload">
                  <UploadCloud size={22} />
                  <div>
                    <strong>{selectedImage ? 'Imagen seleccionada' : 'Subir imagen RGB'}</strong>
                    <span>Formatos aceptados: JPG o PNG (hasta 20 MB).</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </label>

                {selectedImage && (
                  <div className="imageAnalytics__preview">
                    <img src={selectedImage.dataUrl} alt="Previsualización del vuelo" />
                    {imageMeta && (
                      <div className="imageAnalytics__previewMeta">
                        <p>
                          <strong>{imageMeta.name}</strong> · {Math.round(imageMeta.size / 1024)} KB · {imageMeta.width}×{imageMeta.height}px
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`imageAnalytics__section ${sectionState.parameters ? 'is-open' : ''}`}>
            <button
              type="button"
              className="imageAnalytics__sectionToggle"
              onClick={() => toggleSection('parameters')}
              aria-expanded={sectionState.parameters}
            >
              <div>
                <p>Parámetros y umbrales</p>
                <small>Define la exigencia y consulta cómo calculamos los índices.</small>
              </div>
              <span>{sectionState.parameters ? '−' : '+'}</span>
            </button>
            {sectionState.parameters && (
              <div className="imageAnalytics__sectionContent">
                <div className="imageAnalytics__parameters">
                  <div className="imageAnalytics__parametersHeader">
                    <div className="imageAnalytics__parametersTitle">
                      <SlidersHorizontal size={18} />
                      <div>
                        <p>Parámetros de clasificación</p>
                        <small>¿Quieres un criterio más estricto? Ajusta el deslizador y recalcularemos los umbrales.</small>
                      </div>
                    </div>
                  </div>
                  <div className="imageAnalytics__strictnessSummary">
                    <div>
                      <span>Exigencia actual</span>
                      <strong>{strictness}%</strong>
                      {!showStrictnessControls && <small>Predeterminado</small>}
                    </div>
                    <button
                      type="button"
                      className="buttonGhost"
                      onClick={() => setShowStrictnessControls(prev => !prev)}
                    >
                      {showStrictnessControls ? 'Listo' : 'Ajustar nivel'}
                    </button>
                  </div>
                  {showStrictnessControls && (
                    <label className="imageAnalytics__strictness">
                      Ajustar nivel
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={strictness}
                        onChange={event => setStrictness(Number(event.target.value))}
                      />
                    </label>
                  )}
                  <label className="imageAnalytics__strictness">
                    Número de zonas
                    <input
                      type="range"
                      min="2"
                      max="6"
                      value={zoneCount}
                      onChange={event => setZoneCount(Number(event.target.value))}
                    />
                    <small>{zoneCount} zonas</small>
                  </label>
                  <div className="imageAnalytics__thresholdList">
                    <p>
                      <strong>Umbrales GLI:</strong> sano ≥ {thresholds.gli.healthy.toFixed(3)} · leve ≥{' '}
                      {thresholds.gli.mild.toFixed(3)} · severo ≤ {thresholds.gli.severe.toFixed(3)}
                    </p>
                    <p>
                      <strong>Umbrales VARI:</strong> sano ≥ {thresholds.vari.healthy.toFixed(3)} · leve ≥{' '}
                      {thresholds.vari.mild.toFixed(3)} · severo ≤ {thresholds.vari.severe.toFixed(3)}
                    </p>
                    <p>
                      <strong>Umbrales TGI:</strong> sano ≥ {thresholds.tgi.healthy.toFixed(1)} · leve ≥{' '}
                      {thresholds.tgi.mild.toFixed(1)} · severo ≤ {thresholds.tgi.severe.toFixed(1)}
                    </p>
                  </div>
                  <div className="imageAnalytics__formulaHint">
                    <span>¿Cómo calculamos?</span>
                    <div className="imageAnalytics__tooltip">
                      <button
                        type="button"
                        aria-label="Ver fórmulas de los índices"
                        onClick={() => setShowFormulaGuide(prev => !prev)}
                        className={showFormulaGuide ? 'is-active' : ''}
                      >
                        i
                      </button>
                      <div
                        className={`imageAnalytics__tooltipContent ${showFormulaGuide ? 'is-visible' : ''}`}
                        role="dialog"
                      >
                        <p className="imageAnalytics__tooltipSubtitle">Índices:</p>
                        <ul className="imageAnalytics__tooltipList">
                          {FORMULA_INFO.map(info => (
                            <li key={info.label}>
                              <strong>{info.label}</strong>
                              <span>{info.formula}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="imageAnalytics__tooltipSubtitle">Referencias:</p>
                        <ul className="imageAnalytics__tooltipRefs">
                          {REFERENCE_INFO.map(ref => (
                            <li key={ref}>{ref}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`imageAnalytics__section ${sectionState.notes ? 'is-open' : ''}`}>
            <button
              type="button"
              className="imageAnalytics__sectionToggle"
              onClick={() => toggleSection('notes')}
              aria-expanded={sectionState.notes}
            >
              <div>
                <p>Notas y hallazgos</p>
                <small>Registra observaciones para compartir con el productor.</small>
              </div>
              <span>{sectionState.notes ? '−' : '+'}</span>
            </button>
            {sectionState.notes && (
              <div className="imageAnalytics__sectionContent">
                <label>
                  Notas o hallazgos
                  <textarea
                    value={notes}
                    maxLength={280}
                    onChange={event => setNotes(event.target.value)}
                    placeholder="Ej. Cobertura uniforme, sin estrés aparente en el bloque norte."
                  />
                </label>
              </div>
            )}
          </div>

          {error && <p className="imageAnalytics__error">{error}</p>}
          {processing && (
            <div className="imageAnalytics__progress">
              <div className="imageAnalytics__progressBar">
                <span />
              </div>
              <p>{processingStage || 'Procesando imagen…'}</p>
            </div>
          )}

          <button type="submit" className="buttonPrimary" disabled={processing || !fincas.length}>
            {processing ? 'Procesando imagen…' : 'Calcular índices'}
          </button>
        </form>
      </section>

      <section className="imageAnalytics__history">
        <div className="imageAnalytics__historyHeader">
          <div>
            <p className="eyebrow">Historial</p>
            <h2>Reportes generados</h2>
          </div>
          <span className="historyCounter">
            <Activity size={16} /> {orderedAnalyses.length} análisis
          </span>
        </div>

        {orderedAnalyses.length === 0 ? (
          <div className="imageAnalytics__empty">
            <p>Todavía no hay análisis registrados. Sube tu primera imagen para generar el mapa de estrés.</p>
          </div>
        ) : (
          <div className="imageAnalytics__cards">
            {orderedAnalyses.map(analysis => {
              const { stats = {} } = analysis;
              const perMetric = stats.perMetric || {};
              const currentMetric = metricView[analysis.id] || 'gli';
              const metricData =
                perMetric[currentMetric] ||
                (currentMetric === 'gli'
                  ? {
                      categories: stats.categories,
                      average: stats.gliAverage,
                      min: stats.gliMin,
                      max: stats.gliMax
                    }
                  : null);
              const categoriesData = metricData?.categories || stats.categories || {};
              const sumCategories = data =>
                Object.values(data || {}).reduce((acc, value) => acc + (Number(value) || 0), 0);
              const total = stats?.totalPixels || sumCategories(categoriesData);
              const breakdown = Object.keys(CATEGORY_STYLES).map(key => ({
                key,
                count: categoriesData[key] || 0,
                percent: total ? ((categoriesData[key] || 0) / total) * 100 : 0
              }));
              const heatmapSrc =
                analysis.heatmapImages?.[currentMetric] ||
                (currentMetric === 'gli'
                  ? analysis.heatmapImage
                  : analysis.heatmapImages?.gli || analysis.heatmapImage);
              const overlaySrc =
                analysis.overlayImages?.[currentMetric] ||
                (currentMetric === 'gli'
                  ? analysis.overlayImage
                  : analysis.overlayImages?.gli || analysis.overlayImage);
              const availableThresholds = ['gli', 'vari', 'tgi'].filter(
                metric => analysis.thresholds?.[metric]
              );
              const insightMessages = buildInsightMessages(stats);
              return (
                <article className="imageCard" key={analysis.id}>
                  <header className="imageCard__header">
                    <div>
                      <h3>{analysis.title}</h3>
                      <span>{analysis.fincaName}</span>
                    </div>
                    <span className="imageCard__date">{formatDate(analysis.createdAt)}</span>
                  </header>
                  {analysis.notes && <p className="imageCard__notes">{analysis.notes}</p>}
                  <div className="imageCard__previews">
                    <figure onClick={() => setPreviewImage({ src: analysis.originalImage, title: `${analysis.title} · Original` })}>
                      <img src={analysis.originalImage} alt="Imagen original" />
                      <figcaption>Original</figcaption>
                    </figure>
                    <figure onClick={() => setPreviewImage({ src: heatmapSrc, title: `${analysis.title} · Clasificación ${METRIC_LABELS[currentMetric]}` })}>
                      <img src={heatmapSrc} alt="Mapa de estrés" />
                      <figcaption>Clasificación</figcaption>
                    </figure>
                    {overlaySrc && (
                      <figure onClick={() => setPreviewImage({ src: overlaySrc, title: `${analysis.title} · Superposición ${METRIC_LABELS[currentMetric]}` })}>
                        <img src={overlaySrc} alt="Clasificación superpuesta" />
                        <figcaption>Superpuesta</figcaption>
                      </figure>
                    )}
                    {analysis.zoneOverlayImage && (
                      <figure onClick={() => setPreviewImage({ src: analysis.zoneOverlayImage, title: `${analysis.title} · Zonificación` })}>
                        <img src={analysis.zoneOverlayImage} alt="Zonas" />
                        <figcaption>Zonificación</figcaption>
                      </figure>
                    )}
                  </div>
                  <div className="imageCard__stats">
                    {['gli', 'vari', 'tgi', 'combined'].map(metric => (
                      <button
                        type="button"
                        key={metric}
                        className={`imageCard__metric ${currentMetric === metric ? 'is-active' : ''}`}
                        onClick={() => setMetricView(prev => ({ ...prev, [analysis.id]: metric }))}
                      >
                        <span>{METRIC_LABELS[metric]} promedio</span>
                        <strong>
                          {metric === 'gli' && (stats?.gliAverage || 0).toFixed(3)}
                          {metric === 'vari' && (stats?.variAverage || 0).toFixed(3)}
                          {metric === 'tgi' && (stats?.tgiAverage || 0).toFixed(0)}
                          {metric === 'combined' && (perMetric?.combined?.average || 0).toFixed(2)}
                        </strong>
                      </button>
                    ))}
                    <div className="imageCard__metric">
                      <span>Píxeles analizados</span>
                      <strong>{total.toLocaleString('es-EC')}</strong>
                    </div>
                  </div>
                  {stats.agreement && (
                    <div className="imageCard__summary">
                      <span>
                        Diagnóstico combinado:{' '}
                        <strong>{CATEGORY_STYLES[stats.agreement.dominant || 'healthy'].label}</strong>
                      </span>
                      <span>
                        Coincidencia entre índices:{' '}
                        <strong>{stats.agreement.matchPercent.toFixed(1)}%</strong>
                      </span>
                    </div>
                  )}
                  <div className="imageCard__meta">
                    <span>
                      Zonas críticas detectadas:{' '}
                      <strong>{stats?.anomalyCount ?? 0}</strong>
                    </span>
                    {stats?.zones?.length > 0 && (
                      <>
                        <span>
                          Zonas detectadas:{' '}
                          <strong>{stats.zones.length}</strong>
                        </span>
                        <span>
                          Zona más crítica:{' '}
                          <strong>
                            {stats.zones
                              .slice()
                              .sort((a, b) => b.severePercent - a.severePercent)[0]?.label || 'N/A'}
                          </strong>
                        </span>
                      </>
                    )}
                    {analysis.dimensions && (
                      <span>
                        Resolución procesada: {analysis.dimensions.width}×{analysis.dimensions.height}px
                      </span>
                    )}
                    {availableThresholds.length > 0 &&
                      availableThresholds.map(metric => {
                        const precision = metric === 'tgi' ? 1 : 3;
                        const thresholds = analysis.thresholds[metric];
                        return (
                          <span key={`${analysis.id}-${metric}`}>
                            Umbrales {METRIC_LABELS[metric]} · sano ≥{' '}
                            {Number.isFinite(thresholds.healthy)
                              ? thresholds.healthy.toFixed(precision)
                              : thresholds.healthy}{' '}
                            · leve ≥{' '}
                            {Number.isFinite(thresholds.mild)
                              ? thresholds.mild.toFixed(precision)
                              : thresholds.mild}{' '}
                            · severo ≤{' '}
                            {Number.isFinite(thresholds.severe)
                              ? thresholds.severe.toFixed(precision)
                            : thresholds.severe}
                          </span>
                        );
                      })}
                  </div>
                  {insightMessages.length > 0 && (
                    <div className="imageCard__insights">
                      <strong>Recomendaciones</strong>
                      <ul>
                        {insightMessages.map(item => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <table className="imageCard__table">
                    <thead>
                      <tr>
                        <th>Clasificación</th>
                        <th>Porcentaje</th>
                        <th>Píxeles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map(item => (
                        <tr key={item.key}>
                          <td>
                            <span
                              className="imageCard__legendDot"
                              style={{ backgroundColor: CATEGORY_STYLES[item.key].color }}
                            />
                            {CATEGORY_STYLES[item.key].label}
                          </td>
                          <td>{formatPercent(item.count, total)}</td>
                          <td>{item.count.toLocaleString('es-EC')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {stats.zones?.length > 0 && (
                    <div className="imageCard__plantsList">
                      <strong>Zonas de manejo</strong>
                      <ul>
                        {stats.zones.map(zone => (
                          <li key={zone.id}>
                            {zone.label}: {zone.areaPercent.toFixed(1)}% del lote ·{' '}
                            {zone.severePercent.toFixed(1)}% estrés severo
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {metricData && Number.isFinite(metricData.min) && (
                    <table className="imageCard__table compact">
                      <thead>
                        <tr>
                          <th>Métrica</th>
                          <th>Promedio</th>
                          <th>Mínimo</th>
                          <th>Máximo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{METRIC_LABELS[currentMetric]}</td>
                          <td>
                            {(metricData?.average || 0).toFixed(currentMetric === 'tgi' ? 0 : 3)}
                          </td>
                          <td>
                            {(metricData?.min || 0).toFixed(currentMetric === 'tgi' ? 0 : 3)}
                          </td>
                          <td>
                            {(metricData?.max || 0).toFixed(currentMetric === 'tgi' ? 0 : 3)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                  <div className="imageCard__actions">
                    <a href={analysis.originalImage} download={`original-${analysis.id}.jpg`} className="buttonGhost">
                      <Download size={16} /> Original
                    </a>
                    <a
                      href={heatmapSrc || analysis.heatmapImage}
                      download={`heatmap-${analysis.id}-${currentMetric}.png`}
                      className="buttonGhost"
                    >
                      <Download size={16} /> Heatmap
                    </a>
                    {overlaySrc && (
                      <a
                        href={overlaySrc}
                        download={`superpuesta-${analysis.id}-${currentMetric}.png`}
                        className="buttonGhost"
                      >
                        <Download size={16} /> Superpuesta
                      </a>
                    )}
                    {analysis.zoneOverlayImage && (
                      <a
                        href={analysis.zoneOverlayImage}
                        download={`zonas-${analysis.id}.png`}
                        className="buttonGhost"
                      >
                        <Download size={16} /> Zonificación
                      </a>
                    )}
                    <button type="button" className="buttonGhost" onClick={() => handleExportAnalysis(analysis)}>
                      <Printer size={16} /> Exportar PDF
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {previewImage && (
        <div className="imageAnalytics__lightbox" onClick={() => setPreviewImage(null)}>
          <div className="imageAnalytics__lightboxContent" role="dialog" aria-modal="true">
            <img src={previewImage.src} alt={previewImage.title} />
            <p>{previewImage.title}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnalytics;
