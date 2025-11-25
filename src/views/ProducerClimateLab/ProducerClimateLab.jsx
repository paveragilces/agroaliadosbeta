import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  MapContainer,
  TileLayer,
  LayersControl,
  GeoJSON,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import Icon from '../../components/ui/Icon';
import Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import * as turf from '@turf/turf';
import './ProducerClimateLab.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

HighchartsMore(Highcharts);

const defaultCenter = [-2.170998, -79.922356];
const BASE_VARIABLES = [
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'et0_fao_evapotranspiration',
  'windspeed_10m_max',
  'shortwave_radiation_sum',
];
const MOVING_WINDOW_WEEKS = 4;
const HISTORICAL_YEARS_TO_FETCH = 5;
const HISTORICAL_MIN_YEAR = 1979;
const HISTORICAL_ATTEMPTS = [5, 4, 3, 2, 1];
const RAIN_THRESHOLDS = {
  low: 20,
  high: 80,
};
const TEMP_THRESHOLDS = {
  low: 20,
  high: 33,
};
const STAGE_OPTIONS = [
  { value: 'establishment', label: 'Banano en establecimiento', kc: 0.9 },
  { value: 'development', label: 'Banano en desarrollo', kc: 1.1 },
  { value: 'production', label: 'Banano en producción', kc: 1.2 },
  { value: 'renovation', label: 'Banano en renovación', kc: 1.0 },
];
const GDD_BASE_OPTIONS = [
  { value: 10, label: 'Base 10 °C' },
  { value: 12, label: 'Base 12 °C' },
  { value: 14, label: 'Base 14 °C' },
];
const ANOMALY_WINDOWS = [15, 30, 45, 60];
const DAYS_PER_MONTH = 28;
const MJ_PER_SUNHOUR = 1.2;
const GDD_TARGETS = {
  10: 1100,
  12: 1000,
  14: 950,
};
const MAX_BAGGING_WEEKS = 12;
const CHART_COLORS = {
  blue: '#0ea5e9',
  blueSoft: '#38bdf8',
  orange: '#f97316',
  orangeSoft: '#fdba74',
  green: '#10b981',
  greenSoft: '#6ee7b7',
  gray: '#94a3b8',
};

const SERIES_COLORS = {
  rainfall: { primary: '#0ea5e9', muted: '#cbd5f5' },
  temperature: { primary: '#f97316', muted: '#ccd3e0' },
  light: { primary: '#10b981', muted: '#cbd5f5' },
  gdd: { primary: '#a855f7', muted: '#cbd5f5' },
};

const buildVerticalGradient = (start, end) => ({
  linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
  stops: [
    [0, start],
    [1, end],
  ],
});

const BLUE_GRADIENT = buildVerticalGradient('rgba(14,165,233,0.95)', 'rgba(14,165,233,0.2)');
const ORANGE_GRADIENT = buildVerticalGradient('rgba(249,115,22,0.9)', 'rgba(249,115,22,0.25)');
const GREEN_GRADIENT = buildVerticalGradient('rgba(16,185,129,0.9)', 'rgba(16,185,129,0.2)');
const RED_GRADIENT = buildVerticalGradient('rgba(239,68,68,0.9)', 'rgba(239,68,68,0.25)');

const formatDateInput = (date) => date.toISOString().split('T')[0];

const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const getDayOfYear = (date) => {
  const startOfYear = new Date(Date.UTC(date.getFullYear(), 0, 0));
  const diff =
    date -
    startOfYear +
    (startOfYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60000;
  return Math.floor(diff / 86400000);
};

const getISOWeekInfo = (date) => {
  const tmpDate = new Date(date.getTime());
  tmpDate.setHours(0, 0, 0, 0);
  tmpDate.setDate(tmpDate.getDate() + 3 - ((tmpDate.getDay() + 6) % 7));
  const week1 = new Date(tmpDate.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((tmpDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) /
        7
    );
  return { week: weekNumber, isoYear: tmpDate.getFullYear() };
};

const aggregateWeekly = (entries) => {
  const map = new Map();

  entries.forEach((entry) => {
    const { week, isoYear } = getISOWeekInfo(entry.date);
    const key = `${isoYear}-W${week}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        week,
        isoYear,
        count: 0,
        maxTempSum: 0,
        minTempSum: 0,
        rain: 0,
        et0: 0,
        windMax: 0,
        radiation: 0,
      });
    }
    const bucket = map.get(key);
    bucket.count += 1;
    bucket.maxTempSum += entry.temperature_2m_max ?? 0;
    bucket.minTempSum += entry.temperature_2m_min ?? 0;
    bucket.rain += entry.precipitation_sum ?? 0;
    bucket.et0 += entry.et0_fao_evapotranspiration ?? 0;
    bucket.windMax = Math.max(bucket.windMax, entry.windspeed_10m_max ?? 0);
    bucket.radiation += entry.shortwave_radiation_sum ?? 0;
  });

  return Array.from(map.values()).sort((a, b) => {
    if (a.isoYear !== b.isoYear) return a.isoYear - b.isoYear;
    return a.week - b.week;
  });
};

const formatWeekLabel = (isoYear, week) =>
  `Semana ${String(week).padStart(2, '0')} · ${isoYear}`;

const MapAutoFocus = ({ finca }) => {
  const map = useMap();

  useEffect(() => {
    if (!finca) return;
    if (finca.boundary?.geojson) {
      const layer = L.geoJSON(finca.boundary.geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [32, 32] });
        return;
      }
    }
    if (finca.location) {
      map.setView([finca.location.lat, finca.location.lon], 14);
    }
  }, [finca, map]);

  return null;
};

const getFincaCoordinates = (finca) => {
  if (!finca) return null;
  if (finca.boundary?.centroid) return finca.boundary.centroid;
  if (finca.boundary?.geojson) {
    try {
      const centroid = turf.centerOfMass(finca.boundary.geojson);
      if (centroid?.geometry?.coordinates?.length === 2) {
        const [lon, lat] = centroid.geometry.coordinates;
        return { lat, lon };
      }
    } catch (error) {
      console.warn('No se pudo calcular el centroide del polígono', error);
    }
  }
  if (finca.location) return finca.location;
  return null;
};

const findDryWindow = (forecast) => {
  if (!forecast?.daily?.time?.length) return null;
  const dates = forecast.daily.time;
  const rainfall = forecast.daily.precipitation_sum || [];
  let streak = [];

  for (let i = 0; i < dates.length; i += 1) {
    const rain = rainfall[i] ?? 0;
    const isoDate = dates[i];
    if (rain < 1) {
      streak.push(isoDate);
      if (streak.length >= 3) {
        return { start: streak[0], end: streak[streak.length - 1] };
      }
    } else {
      streak = [];
    }
  }
  return null;
};

const formatDateShort = (isoDate) => {
  const parsed = new Date(isoDate);
  return parsed.toLocaleDateString('es-EC', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const formatNumber = (value, options = {}) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('es-EC', {
    maximumFractionDigits: 1,
    ...options,
  }).format(value);
};

const palette = ['#0ea5e9', '#f97316', '#a855f7', '#22c55e', '#facc15', '#6366f1'];

const buildPremiumTooltip = (suffix = '') => ({
  shared: true,
  useHTML: true,
  formatter() {
    const header = `<div class="meteogramTooltip"><strong>${this.x}</strong>`;
    const rows = (this.points || [])
      .map(
        (point) =>
          `<div><span style="color:${point.color}">●</span> ${
            point.series.name
          }: <strong>${Highcharts.numberFormat(point.y, 1)}${suffix}</strong></div>`
      )
      .join('');
    return `${header}${rows}</div>`;
  },
});

Highcharts.setOptions({
  chart: {
    style: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    backgroundColor: 'transparent',
    spacing: [12, 12, 12, 12],
  },
  colors: palette,
  lang: {
    thousandsSep: '.',
  },
  legend: {
    itemStyle: {
      fontWeight: 600,
    },
  },
  tooltip: {
    borderRadius: 12,
    borderWidth: 0,
    shadow: false,
  },
});

const ProducerClimateLab = ({ producer, onNavigate }) => {
  const fincas = producer?.fincas || [];
  const [selectedFincaId, setSelectedFincaId] = useState(fincas[0]?.id || null);
  const [climateData, setClimateData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const reportRef = useRef(null);

  const selectedFinca = useMemo(
    () => fincas.find((f) => f.id === selectedFincaId) || fincas[0] || null,
    [fincas, selectedFincaId]
  );

  const coordinates = useMemo(() => getFincaCoordinates(selectedFinca), [selectedFinca]);

  const getFincaSlug = useCallback(() => {
    const base = (selectedFinca?.name || 'finca')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '');
    return base || 'finca';
  }, [selectedFinca?.name]);

  const fetchClimateData = useCallback(async () => {
    if (!coordinates) return;
    setLoading(true);
    setError(null);
    setClimateData(null);
    setForecastData(null);

    const today = new Date();
    const endDate = formatDateInput(today);
    const dailyParams = BASE_VARIABLES.join(',');
    let historyJson = null;
    let usedStartYear = null;

    try {
      for (const attemptRange of HISTORICAL_ATTEMPTS) {
        const startYear = Math.max(today.getFullYear() - attemptRange, HISTORICAL_MIN_YEAR);
        const comparisonStart = new Date(startYear, 0, 1);
        const startDate = formatDateInput(comparisonStart);
        const historyUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${coordinates.lat}&longitude=${coordinates.lon}&start_date=${startDate}&end_date=${endDate}&daily=${dailyParams}&timezone=auto`;
        try {
          const historyResponse = await fetch(historyUrl);
          if (!historyResponse.ok) {
            continue;
          }
          const data = await historyResponse.json();
          if (!data?.daily?.time?.length) {
            continue;
          }
          historyJson = data;
          usedStartYear = startYear;
          break;
        } catch (requestError) {
          continue;
        }
      }

      if (!historyJson || usedStartYear === null) {
        throw new Error('No se pudo obtener el histórico de clima.');
      }

      const actualCoverage = today.getFullYear() - usedStartYear;
      setHistoryCoverageYears(actualCoverage);
      setAnomalyWindowYears((prev) => Math.min(prev, actualCoverage));
      setClimateData(historyJson);
      setError(null);

      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&daily=${dailyParams}&forecast_days=7&timezone=auto`;
      const forecastResponse = await fetch(forecastUrl);
      if (forecastResponse.ok) {
        const forecastJson = await forecastResponse.json();
        setForecastData(forecastJson);
      }

      setLastRequest({
        executedAt: new Date().toISOString(),
        startDate: formatDateInput(new Date(usedStartYear, 0, 1)),
        endDate,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al consultar la información climática.');
    } finally {
      setLoading(false);
    }
  }, [coordinates]);

  useEffect(() => {
    fetchClimateData();
  }, [fetchClimateData]);

  const dailyEntries = useMemo(() => {
    if (!climateData?.daily?.time?.length) return [];
    const { daily } = climateData;
    return daily.time.map((isoDate, idx) => {
      const date = new Date(isoDate);
      return {
        isoDate,
        date,
        dayOfYear: getDayOfYear(date),
        temperature_2m_max: daily.temperature_2m_max?.[idx],
        temperature_2m_min: daily.temperature_2m_min?.[idx],
        precipitation_sum: daily.precipitation_sum?.[idx],
        et0_fao_evapotranspiration: daily.et0_fao_evapotranspiration?.[idx],
        windspeed_10m_max: daily.windspeed_10m_max?.[idx],
        shortwave_radiation_sum: daily.shortwave_radiation_sum?.[idx],
      };
    });
  }, [climateData]);

  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const previousYear = currentYear - 1;
  const currentDayOfYear = getDayOfYear(today);
  const previousYearDayLimit = Math.min(
    currentDayOfYear,
    isLeapYear(previousYear) ? 366 : 365
  );

  const currentYearEntries = useMemo(
    () => dailyEntries.filter((entry) => entry.date.getFullYear() === currentYear),
    [dailyEntries, currentYear]
  );
  const previousYearEntries = useMemo(
    () => dailyEntries.filter((entry) => entry.date.getFullYear() === previousYear),
    [dailyEntries, previousYear]
  );

  const ytdCurrentEntries = useMemo(
    () => currentYearEntries.filter((entry) => entry.dayOfYear <= currentDayOfYear),
    [currentYearEntries, currentDayOfYear]
  );
  const ytdPreviousEntries = useMemo(
    () => previousYearEntries.filter((entry) => entry.dayOfYear <= previousYearDayLimit),
    [previousYearEntries, previousYearDayLimit]
  );

  const climateInsights = useMemo(() => {
    if (!ytdCurrentEntries.length) {
      return null;
    }

    const sumMetric = (collection, key) =>
      collection.reduce((acc, entry) => acc + (entry[key] ?? 0), 0);

    const averageMetric = (collection, key) => {
      if (!collection.length) return 0;
      const sum = sumMetric(collection, key);
      return sum / collection.length;
    };

    const rainCurrent = sumMetric(ytdCurrentEntries, 'precipitation_sum');
    const rainPrevious = sumMetric(ytdPreviousEntries, 'precipitation_sum');
    const maxAvgCurrent = averageMetric(ytdCurrentEntries, 'temperature_2m_max');
    const maxAvgPrevious = averageMetric(ytdPreviousEntries, 'temperature_2m_max');
    const et0Current = sumMetric(ytdCurrentEntries, 'et0_fao_evapotranspiration');
    const et0Previous = sumMetric(ytdPreviousEntries, 'et0_fao_evapotranspiration');

    const windyDaysCurrent = ytdCurrentEntries.filter(
      (entry) => (entry.windspeed_10m_max ?? 0) >= 20
    ).length;
    const windyDaysPrevious = ytdPreviousEntries.filter(
      (entry) => (entry.windspeed_10m_max ?? 0) >= 20
    ).length;

    return {
      rain: {
        current: rainCurrent,
        previous: rainPrevious,
        delta: rainCurrent - rainPrevious,
      },
      maxTemp: {
        current: maxAvgCurrent,
        previous: maxAvgPrevious,
        delta: maxAvgCurrent - maxAvgPrevious,
      },
      et0: {
        current: et0Current,
        previous: et0Previous,
        delta: et0Current - et0Previous,
      },
      windEvents: {
        current: windyDaysCurrent,
        previous: windyDaysPrevious,
        delta: windyDaysCurrent - windyDaysPrevious,
      },
    };
  }, [ytdCurrentEntries, ytdPreviousEntries]);

  const aggregatedWeeks = useMemo(() => aggregateWeekly(dailyEntries), [dailyEntries]);
  const currentIsoInfo = getISOWeekInfo(today);
  const previousIsoYear = currentIsoInfo.isoYear - 1;

  const chartWeeks = useMemo(() => {
    if (!aggregatedWeeks.length) return [];
    const maxWeek = Math.max(...aggregatedWeeks.map((item) => item.week));
    return Array.from({ length: maxWeek }, (_, index) => index + 1);
  }, [aggregatedWeeks]);

  const availableYears = useMemo(() => {
    const unique = Array.from(new Set(aggregatedWeeks.map((item) => item.isoYear)));
    return unique.sort((a, b) => a - b);
  }, [aggregatedWeeks]);

  const groupedYears = useMemo(() => {
    const map = new Map();
    availableYears.forEach((year) => {
      const decadeStart = Math.floor(year / 10) * 10;
      const label = `${decadeStart}s`;
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label).push(year);
    });
    return Array.from(map.entries())
      .map(([label, years]) => ({
        label,
        years: years.sort((a, b) => a - b),
      }))
      .sort((a, b) => parseInt(a.label) - parseInt(b.label));
  }, [availableYears]);

  const pickDefaultYears = useCallback(
    () => {
      if (!availableYears.length) return [];
      if (availableYears.length === 1) return [availableYears[0]];
      const last = availableYears[availableYears.length - 1];
      const prev = availableYears[availableYears.length - 2];
      return prev === last ? [last] : [prev, last];
    },
    [availableYears]
  );

  const [rainSelectedYears, setRainSelectedYears] = useState([]);
  const [rainViewMode, setRainViewMode] = useState('absolute');
  const [rainPrimaryYear, setRainPrimaryYear] = useState(null);
  const [rainComparisonYear, setRainComparisonYear] = useState(null);

  const [tempSelectedYears, setTempSelectedYears] = useState([]);
  const [tempViewMode, setTempViewMode] = useState('absolute');
  const [tempPrimaryYear, setTempPrimaryYear] = useState(null);
  const [tempComparisonYear, setTempComparisonYear] = useState(null);
  const [lightSelectedYears, setLightSelectedYears] = useState([]);
  const [kcStage, setKcStage] = useState(STAGE_OPTIONS[1].value);
  const [gddBase, setGddBase] = useState(GDD_BASE_OPTIONS[2].value);
  const [anomalyWindowYears, setAnomalyWindowYears] = useState(30);
  const [historyCoverageYears, setHistoryCoverageYears] = useState(HISTORICAL_YEARS_TO_FETCH);

  useEffect(() => {
    if (!availableYears.length) return;
    setRainSelectedYears((prev) => {
      const filtered = prev.filter((year) => availableYears.includes(year));
      if (filtered.length) return filtered;
      return pickDefaultYears();
    });
    setTempSelectedYears((prev) => {
      const filtered = prev.filter((year) => availableYears.includes(year));
      if (filtered.length) return filtered;
      return pickDefaultYears();
    });
    setLightSelectedYears((prev) => {
      const filtered = prev.filter((year) => availableYears.includes(year));
      if (filtered.length) return filtered;
      return pickDefaultYears();
    });
    setRainPrimaryYear((prev) => {
      if (prev && availableYears.includes(prev)) return prev;
      return availableYears[availableYears.length - 1];
    });
    setTempPrimaryYear((prev) => {
      if (prev && availableYears.includes(prev)) return prev;
      return availableYears[availableYears.length - 1];
    });
    setRainComparisonYear((prev) => {
      if (prev && availableYears.includes(prev)) return prev;
      return availableYears.length > 1
        ? availableYears[availableYears.length - 2]
        : availableYears[0];
    });
    setTempComparisonYear((prev) => {
      if (prev && availableYears.includes(prev)) return prev;
      return availableYears.length > 1
        ? availableYears[availableYears.length - 2]
        : availableYears[0];
    });
    setKcStage((prev) => {
      const exists = STAGE_OPTIONS.some((stage) => stage.value === prev);
      return exists ? prev : STAGE_OPTIONS[0].value;
    });
    setGddBase((prev) => {
      const exists = GDD_BASE_OPTIONS.some((option) => option.value === prev);
      return exists ? prev : GDD_BASE_OPTIONS[0].value;
    });
  }, [availableYears, pickDefaultYears]);

  const weeklyMetricSeries = useMemo(() => {
    if (!chartWeeks.length) return {};
    const byYear = new Map();
    aggregatedWeeks.forEach((item) => {
      if (!byYear.has(item.isoYear)) {
        byYear.set(item.isoYear, new Map());
      }
      byYear.get(item.isoYear).set(item.week, item);
    });
    const result = {};
    availableYears.forEach((year) => {
      const weekMap = byYear.get(year) || new Map();
      result[year] = chartWeeks.map((week) => {
      const bucket = weekMap.get(week);
      if (!bucket) {
        return {
          rain: null,
          tmax: null,
          tmin: null,
          lightHours: null,
        };
      }
      const avgLight =
        bucket.count && bucket.radiation
          ? Math.min(bucket.radiation / bucket.count / MJ_PER_SUNHOUR, 14)
          : bucket.count
          ? 0
          : null;
      return {
        rain: Number(bucket.rain.toFixed(1)),
        tmax: bucket.count
          ? Number((bucket.maxTempSum / bucket.count).toFixed(1))
          : null,
        tmin: bucket.count
          ? Number((bucket.minTempSum / bucket.count).toFixed(1))
          : null,
        lightHours:
          avgLight !== null ? Number(avgLight.toFixed(1)) : null,
      };
    });
    });
    return result;
  }, [aggregatedWeeks, availableYears, chartWeeks]);

  const getMetricSeries = useCallback(
    (year, metric) => {
      const data = weeklyMetricSeries[year];
      if (!data) return chartWeeks.map(() => null);
      return data.map((point) => point?.[metric] ?? null);
    },
    [weeklyMetricSeries, chartWeeks]
  );

  const buildDeltaData = useCallback(
    (metric, primaryYear, referenceYear) => {
      if (!primaryYear || !referenceYear) return [];
      const primarySeries = getMetricSeries(primaryYear, metric);
      const comparisonSeries = getMetricSeries(referenceYear, metric);
      return chartWeeks.map((_, index) => {
        const primaryValue = primarySeries[index];
        const referenceValue = comparisonSeries[index];
        if (primaryValue === null || referenceValue === null) {
          return null;
        }
        return Number((primaryValue - referenceValue).toFixed(2));
      });
    },
    [chartWeeks, getMetricSeries]
  );

  const weeklyTableRows = useMemo(() => {
    const currentIsoYearWeeks = aggregatedWeeks.filter(
      (week) => week.isoYear === currentIsoInfo.isoYear
    );
    const lastWeeks = currentIsoYearWeeks.slice(-6).reverse();
    return lastWeeks.map((week) => ({
      key: week.key,
      label: formatWeekLabel(week.isoYear, week.week),
      tmax: week.count ? week.maxTempSum / week.count : null,
      tmin: week.count ? week.minTempSum / week.count : null,
      rain: week.rain,
      et0: week.et0,
      wind: week.windMax,
    }));
  }, [aggregatedWeeks, currentIsoInfo.isoYear]);

  const rainfallThresholdSeries = useMemo(() => {
    if (!weeklyTableRows.length) return null;
    const rows = [...weeklyTableRows].reverse();
    const rainValues = rows.map(row => Number((row.rain || 0).toFixed(1)));
    const avg = rainValues.length
      ? Number((rainValues.reduce((acc, value) => acc + value, 0) / rainValues.length).toFixed(1))
      : 0;
    return {
      categories: rows.map(row => row.label),
      rainValues,
      reference: rainValues.map(() => avg),
    };
  }, [weeklyTableRows]);

  const rainfallThresholdChartOptions = useMemo(() => {
    if (!rainfallThresholdSeries) return null;
    return {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        height: 280,
      },
      title: { text: undefined },
      xAxis: {
        categories: rainfallThresholdSeries.categories,
        lineColor: 'rgba(15,107,70,0.35)',
        labels: { style: { color: '#475569', fontWeight: '600' } },
      },
      yAxis: {
        min: 0,
        title: { text: 'mm', style: { color: '#0f2f25' } },
        gridLineColor: 'rgba(148,163,184,0.3)',
        labels: { style: { color: '#475569' } },
      },
      legend: { itemStyle: { color: '#0f2f25' } },
      tooltip: { shared: true, valueSuffix: ' mm' },
      plotOptions: {
        column: {
          borderRadius: 6,
          pointPadding: 0.1,
          groupPadding: 0.2,
        },
      },
      series: [
        {
          name: 'Lluvia actual',
          data: rainfallThresholdSeries.rainValues,
          color: '#0ea5e9',
        },
        {
          type: 'spline',
          name: 'Promedio móvil',
          data: rainfallThresholdSeries.reference,
          color: '#94a3b8',
          dashStyle: 'ShortDash',
        },
      ],
    };
  }, [rainfallThresholdSeries]);

  const agronomicSignals = useMemo(() => {
    const currentYearWeeks = aggregatedWeeks
      .filter((week) => week.isoYear === currentIsoInfo.isoYear)
      .sort((a, b) => a.week - b.week);
    if (!currentYearWeeks.length) return null;
    const latest = currentYearWeeks[currentYearWeeks.length - 1];
    const windowStart = Math.max(0, currentYearWeeks.length - MOVING_WINDOW_WEEKS);
    const windowSlice = currentYearWeeks.slice(windowStart);

    const average = (list, getter) => {
      if (!list.length) return null;
      const total = list.reduce((acc, item) => acc + getter(item), 0);
      return total / list.length;
    };
    const weekMaxTemp = (week) =>
      week.count ? week.maxTempSum / week.count : 0;

    const rainMovingAvg = average(windowSlice, (week) => week.rain);
    const tempMovingAvg = average(windowSlice, weekMaxTemp);

    const recentWindow = currentYearWeeks.slice(-8);
    const rainStressWeeks = recentWindow.filter((week) => week.rain <= RAIN_THRESHOLDS.low).length;
    const heatStressWeeks = recentWindow.filter((week) => weekMaxTemp(week) >= TEMP_THRESHOLDS.high).length;

    const classify = (value, thresholds) => {
      if (value === null || value === undefined) return 'neutral';
      if (value >= thresholds.high) return 'high';
      if (value <= thresholds.low) return 'low';
      return 'optimal';
    };

    return {
      latestLabel: formatWeekLabel(latest.isoYear, latest.week),
      windowSize: windowSlice.length,
      rainMovingAvg,
      tempMovingAvg,
      rainStatus: classify(rainMovingAvg, RAIN_THRESHOLDS),
      tempStatus: classify(tempMovingAvg, TEMP_THRESHOLDS),
      rainStressWeeks,
      heatStressWeeks,
      referenceWeeks: recentWindow.length,
    };
  }, [aggregatedWeeks, currentIsoInfo.isoYear]);

  const climateAlerts = useMemo(() => {
    if (!agronomicSignals || !weeklyTableRows.length) return [];
    const alerts = [];
    if (agronomicSignals.rainStatus === 'low') {
      alerts.push({
        type: 'warning',
        title: 'Estrés hídrico potencial',
        detail: `El promedio móvil de lluvia cayó por debajo de ${RAIN_THRESHOLDS.low} mm/semana.`,
        suggestion: 'Evalúa programar riego o aplicar mulching para conservar humedad.',
      });
    }
    if (agronomicSignals.tempStatus === 'high') {
      alerts.push({
        type: 'risk',
        title: 'Temperaturas elevadas',
        detail: `La T° máxima móvil supera ${TEMP_THRESHOLDS.high} °C.`,
        suggestion:
          'Revisa la ventilación en invernaderos o planifica labores en horas con menos radiación.',
      });
    }
    const highWindWeeks = weeklyTableRows.filter((row) => row.wind >= 20);
    if (highWindWeeks.length) {
      alerts.push({
        type: 'info',
        title: 'Vientos fuertes registrados',
        detail: `${highWindWeeks.length} semana(s) con ráfagas ≥ 20 km/h.`,
        suggestion: 'Refuerza tutores o revisa estructuras antes de labores en campo.',
      });
    }
    const dryWindow = findDryWindow(forecastData);
    if (dryWindow) {
      alerts.push({
        type: 'success',
        title: 'Ventana operativa disponible',
        detail: `Pronóstico seco del ${formatDateShort(dryWindow.start)} al ${formatDateShort(
          dryWindow.end
        )}.`,
        suggestion: 'Ideal para aplicaciones foliares o labores de cosecha.',
      });
    } else {
      alerts.push({
        type: 'info',
        title: 'Sin ventana seca próxima',
        detail: 'Los próximos 7 días presentan lluvia frecuente.',
        suggestion: 'Reprograma aplicaciones y prioriza labores bajo techo.',
      });
    }

    return alerts;
  }, [agronomicSignals, forecastData, weeklyTableRows]);

  const anomalyIndicators = useMemo(() => {
    const currentWeekEntry = aggregatedWeeks.find(
      (week) => week.isoYear === currentIsoInfo.isoYear && week.week === currentIsoInfo.week
    );
    if (!currentWeekEntry) return null;
    const minYear = currentIsoInfo.isoYear - anomalyWindowYears;
    const peerWeeks = aggregatedWeeks.filter(
      (week) =>
        week.week === currentWeekEntry.week &&
        week.isoYear !== currentIsoInfo.isoYear &&
        week.isoYear >= minYear
    );
    if (!peerWeeks.length) return null;
    const avgRain = peerWeeks.reduce((acc, week) => acc + week.rain, 0) / peerWeeks.length;
    const avgTemp =
      peerWeeks.reduce(
        (acc, week) => acc + (week.count ? week.maxTempSum / week.count : 0),
        0
      ) / peerWeeks.length;
    const currentTemp = currentWeekEntry.count
      ? currentWeekEntry.maxTempSum / currentWeekEntry.count
      : null;
    return {
      label: formatWeekLabel(currentWeekEntry.isoYear, currentWeekEntry.week),
      rainDelta: currentWeekEntry.rain - avgRain,
      tempDelta: currentTemp !== null ? currentTemp - avgTemp : null,
      avgRain,
      avgTemp,
      peers: peerWeeks.length,
    };
  }, [aggregatedWeeks, anomalyWindowYears, currentIsoInfo.isoYear, currentIsoInfo.week]);

  const sigatokaRisk = useMemo(() => {
    if (!dailyEntries.length || !aggregatedWeeks.length) return null;
    const last28Days = dailyEntries.slice(-28);
    if (!last28Days.length) return null;

    const minTempValues = last28Days
      .map((entry) => entry.temperature_2m_min)
      .filter((value) => typeof value === 'number' && !Number.isNaN(value));
    const avgMinTemp = minTempValues.length
      ? minTempValues.reduce((acc, value) => acc + value, 0) / minTempValues.length
      : null;

    const amplitudeAggregate = last28Days.reduce(
      (acc, entry) => {
        const max = entry.temperature_2m_max;
        const min = entry.temperature_2m_min;
        if (typeof max !== 'number' || typeof min !== 'number') return acc;
        return { sum: acc.sum + (max - min), count: acc.count + 1 };
      },
      { sum: 0, count: 0 }
    );
    const avgAmplitude =
      amplitudeAggregate.count > 0 ? amplitudeAggregate.sum / amplitudeAggregate.count : null;

    const lastFourWeeks = aggregatedWeeks.slice(-4);
    const rainLast4Weeks = lastFourWeeks.reduce((acc, week) => acc + week.rain, 0);
    const et0Last4Weeks = lastFourWeeks.reduce((acc, week) => acc + week.et0, 0);
    const humiditySurplus = rainLast4Weeks - et0Last4Weeks;

    const rainPressure = (() => {
      if (rainLast4Weeks >= 220) return 'high';
      if (rainLast4Weeks >= 160) return 'medium';
      return 'low';
    })();

    const humidityPressure = (() => {
      if (humiditySurplus >= 80) return 'high';
      if (humiditySurplus >= 40) return 'medium';
      return 'low';
    })();

    const tempPressure = (() => {
      if (avgMinTemp === null) return 'low';
      if (avgMinTemp >= 20 && avgMinTemp <= 24) return 'high';
      if (avgMinTemp >= 18 && avgMinTemp <= 26) return 'medium';
      return 'low';
    })();

    const amplitudePressure = (() => {
      if (avgAmplitude === null) return 'low';
      if (avgAmplitude <= 8) return 'high';
      if (avgAmplitude <= 11.5) return 'medium';
      return 'low';
    })();

    const pressureScores = { high: 1, medium: 0.6, low: 0.25 };
    const pressureList = [rainPressure, humidityPressure, tempPressure, amplitudePressure];
    const composite =
      pressureList.reduce((acc, pressure) => acc + pressureScores[pressure], 0) /
      pressureList.length;
    const highCount = pressureList.filter((value) => value === 'high').length;
    const mediumCount = pressureList.filter((value) => value === 'medium').length;

    let riskLevel = 'low';
    if (highCount >= 2 || composite >= 0.75 || (highCount === 1 && mediumCount >= 2)) {
      riskLevel = 'high';
    } else if (highCount >= 1 || mediumCount >= 2 || composite >= 0.5) {
      riskLevel = 'medium';
    }

    const recommendations = [];
    if (riskLevel !== 'low') {
      recommendations.push('Acelera el monitoreo visual y registra focos activos.');
    }
    if (riskLevel === 'high') {
      recommendations.push('Programa aplicaciones protectoras y deshoje sanitario.');
    } else if (riskLevel === 'medium') {
      recommendations.push('Refuerza la mezcla preventiva en lotes con historial de Sigatoka.');
    } else {
      recommendations.push('Mantén el programa regular y vigila cambios de clima.');
    }

    const factorDetails = [
      {
        label: 'Lluvia acumulada',
        value: rainLast4Weeks,
        unit: 'mm',
        context: 'Últimas 4 semanas',
        hint: '≥ 220 mm dispara presión alta',
        pressure: rainPressure,
      },
      {
        label: 'Exceso hídrico',
        value: humiditySurplus,
        unit: 'mm',
        context: 'Lluvia − ET₀ (4 semanas)',
        hint: '≥ 40 mm indica hojas húmedas por más horas',
        pressure: humidityPressure,
      },
      {
        label: 'T° mínima',
        value: avgMinTemp,
        unit: '°C',
        context: 'Promedio últimas 4 semanas',
        hint: 'Óptimo del patógeno: 20‑24 °C',
        pressure: tempPressure,
      },
      {
        label: 'Amplitud térmica',
        value: avgAmplitude,
        unit: '°C',
        context: 'Variación intradía (28 días)',
        hint: '< 8 °C acelera el ciclo de Sigatoka',
        pressure: amplitudePressure,
      },
    ];

    return {
      riskLevel,
      rainLast4Weeks,
      avgMinTemp,
      avgAmplitude,
      humiditySurplus,
      recommendations,
      factors: factorDetails,
    };
  }, [aggregatedWeeks, dailyEntries]);

  const mokoRisk = useMemo(() => {
    if (!aggregatedWeeks.length || !dailyEntries.length) return null;
    const last28Days = dailyEntries.slice(-28);
    if (!last28Days.length) return null;
    const avgTemp =
      last28Days.reduce((acc, entry) => {
        const max = entry.temperature_2m_max ?? 0;
        const min = entry.temperature_2m_min ?? 0;
        return acc + (max + min) / 2;
      }, 0) / last28Days.length;
    const avgMin =
      last28Days.reduce((acc, entry) => acc + (entry.temperature_2m_min ?? 0), 0) /
      last28Days.length;
    const lastFourWeeks = aggregatedWeeks.slice(-4);
    const rainLast4Weeks = lastFourWeeks.reduce((acc, week) => acc + week.rain, 0);
    const surplus = lastFourWeeks.reduce((acc, week) => acc + (week.rain - week.et0), 0);

    const tempPressure = (() => {
      if (avgTemp >= 26 && avgTemp <= 30) return 'high';
      if (avgTemp >= 24 && avgTemp < 26) return 'medium';
      return 'low';
    })();
    const humidityPressure = (() => {
      if (surplus >= 100) return 'high';
      if (surplus >= 40) return 'medium';
      return 'low';
    })();
    const rainPressure = (() => {
      if (rainLast4Weeks >= 280) return 'high';
      if (rainLast4Weeks >= 180) return 'medium';
      return 'low';
    })();
    const warmNights = avgMin >= 23 ? 'high' : avgMin >= 21 ? 'medium' : 'low';

    const pressureScores = { high: 1, medium: 0.6, low: 0.2 };
    const pressureList = [tempPressure, humidityPressure, rainPressure, warmNights];
    const composite =
      pressureList.reduce((acc, pressure) => acc + pressureScores[pressure], 0) /
      pressureList.length;
    const highCount = pressureList.filter((value) => value === 'high').length;
    const mediumCount = pressureList.filter((value) => value === 'medium').length;

    let riskLevel = 'low';
    if (highCount >= 2 || composite >= 0.8 || (highCount === 1 && mediumCount >= 2)) {
      riskLevel = 'high';
    } else if (highCount >= 1 || mediumCount >= 2 || composite >= 0.5) {
      riskLevel = 'medium';
    }

    const recommendations = [];
    if (riskLevel === 'high') {
      recommendations.push('Refuerza monitoreo de moko y desinfección de herramientas.');
      recommendations.push('Limita movimientos de cuadrillas entre lotes y revisa drenajes.');
    } else if (riskLevel === 'medium') {
      recommendations.push('Mantén trampas/monitoreo y evita heridas en pseudotallos.');
    } else {
      recommendations.push('Condiciones normales, continua con el plan sanitario.');
    }

    return {
      riskLevel,
      avgTemp,
      avgMin,
      rainLast4Weeks,
      surplus,
      factors: [
        {
          label: 'Temp. media',
          value: avgTemp,
          unit: '°C',
          hint: 'Óptimo para moko: 26‑30 °C',
          pressure: tempPressure,
        },
        {
          label: 'Noches cálidas',
          value: avgMin,
          unit: '°C',
          hint: 'Moko se acelera con mínimas > 23 °C',
          pressure: warmNights,
        },
        {
          label: 'Lluvia 4 semanas',
          value: rainLast4Weeks,
          unit: 'mm',
          hint: '≥ 280 mm activa brotes bacterianos',
          pressure: rainPressure,
        },
        {
          label: 'Exceso hídrico',
          value: surplus,
          unit: 'mm',
          hint: 'Suelo saturado favorece infectividad',
          pressure: humidityPressure,
        },
      ],
      recommendations,
    };
  }, [aggregatedWeeks, dailyEntries]);


  const rainfallChartOptions = useMemo(() => {
    if (!chartWeeks.length || !availableYears.length) return null;
    const categories = chartWeeks.map((week) => `S${String(week).padStart(2, '0')}`);
    if (rainViewMode === 'delta') {
      if (!rainPrimaryYear || !rainComparisonYear) return null;
      const deltaData = buildDeltaData('rain', rainPrimaryYear, rainComparisonYear);
      return {
        chart: { backgroundColor: 'transparent', spacing: [10, 10, 10, 10] },
        title: { text: undefined },
        xAxis: {
          categories,
          tickInterval: Math.max(Math.floor(chartWeeks.length / 8), 1),
          lineColor: '#cbd5f5',
        },
        yAxis: {
          title: { text: `${rainPrimaryYear} - ${rainComparisonYear} (mm)` },
          gridLineColor: '#dfe7f4',
          gridLineDashStyle: 'Dash',
          plotLines: [{ color: '#94a3b8', value: 0, width: 1 }],
        },
        tooltip: buildPremiumTooltip(' mm'),
        credits: { enabled: false },
        legend: { enabled: false },
        plotOptions: {
          column: {
            borderRadius: 8,
            borderWidth: 0,
            pointPadding: 0.08,
          },
        },
        series: [
          {
            type: 'column',
            name: 'Diferencia semanal',
            data: deltaData.map((value) =>
              value === null
                ? null
                : {
                    y: value,
                    color: value >= 0 ? BLUE_GRADIENT : RED_GRADIENT,
                  }
            ),
          },
        ],
      };
    }

    const highlightYear = rainSelectedYears[rainSelectedYears.length - 1];
    const { primary, muted } = SERIES_COLORS.rainfall;
    const series = rainSelectedYears.map((year, index) => {
      const isHighlight = year === highlightYear;
      const color = isHighlight ? primary : muted;
      return {
        type: isHighlight ? 'areaspline' : 'spline',
        name: `${year}`,
        data: getMetricSeries(year, 'rain'),
        color,
        fillOpacity: isHighlight ? 0.18 : 0,
        lineWidth: isHighlight ? 3.5 : 2,
        dashStyle: isHighlight ? 'Solid' : 'ShortDash',
        marker: {
          enabled: true,
          radius: isHighlight ? 4 : 2.5,
          lineColor: color,
          lineWidth: 2,
          fillColor: '#ffffff',
        },
        shadow: isHighlight,
        zIndex: isHighlight ? 3 : 1,
        connectNulls: false,
      };
    });

    if (!series.length) return null;

    return {
      chart: { backgroundColor: 'transparent', spacing: [10, 10, 10, 10] },
      title: { text: undefined },
      xAxis: {
        categories,
        tickInterval: Math.max(Math.floor(chartWeeks.length / 8), 1),
        lineColor: '#cbd5f5',
      },
      yAxis: {
        title: { text: 'Lluvia semanal (mm)' },
        gridLineColor: '#dfe7f4',
        gridLineDashStyle: 'Dash',
      },
      tooltip: buildPremiumTooltip(' mm'),
      credits: { enabled: false },
      legend: { align: 'center' },
      series,
    };
  }, [
    availableYears.length,
    buildDeltaData,
    chartWeeks,
    getMetricSeries,
    rainComparisonYear,
    rainPrimaryYear,
    rainSelectedYears,
    rainViewMode,
  ]);

  const temperatureChartOptions = useMemo(() => {
    if (!chartWeeks.length || !availableYears.length) return null;
    const categories = chartWeeks.map((week) => `S${String(week).padStart(2, '0')}`);
    if (tempViewMode === 'delta') {
      if (!tempPrimaryYear || !tempComparisonYear) return null;
      const deltaData = buildDeltaData('tmax', tempPrimaryYear, tempComparisonYear);
      return {
        chart: { backgroundColor: 'transparent', spacing: [10, 10, 10, 10] },
        title: { text: undefined },
        xAxis: {
          categories,
          tickInterval: Math.max(Math.floor(chartWeeks.length / 8), 1),
          lineColor: '#cbd5f5',
        },
        yAxis: {
          title: { text: `${tempPrimaryYear} - ${tempComparisonYear} (°C)` },
          gridLineColor: '#dfe7f4',
          gridLineDashStyle: 'Dash',
          plotLines: [{ color: '#94a3b8', value: 0, width: 1 }],
        },
        tooltip: buildPremiumTooltip(' °C'),
        credits: { enabled: false },
        legend: { enabled: false },
        plotOptions: {
          column: {
            borderRadius: 6,
            borderWidth: 0,
          },
        },
        series: [
          {
            type: 'column',
            name: 'Diferencia de T° máxima',
            data: deltaData.map((value) =>
              value === null
                ? null
                : {
                    y: value,
                    color: value >= 0 ? ORANGE_GRADIENT : BLUE_GRADIENT,
                  }
            ),
          },
        ],
      };
    }

    const highlightYear = tempSelectedYears[tempSelectedYears.length - 1];
    const { primary, muted } = SERIES_COLORS.temperature;
    const series = tempSelectedYears.map((year, index) => {
      const isHighlight = year === highlightYear;
      const color = isHighlight ? primary : muted;
      return {
        type: isHighlight ? 'areaspline' : 'spline',
        name: `${year}`,
        data: getMetricSeries(year, 'tmax'),
        color,
        fillOpacity: isHighlight ? 0.12 : 0,
        lineWidth: isHighlight ? 3.5 : 2,
        dashStyle: isHighlight ? 'Solid' : 'ShortDash',
        marker: {
          enabled: true,
          radius: isHighlight ? 4 : 2.5,
          lineColor: color,
          lineWidth: 2,
          fillColor: '#fff',
        },
        connectNulls: false,
        shadow: isHighlight,
      };
    });

    if (!series.length) return null;

    return {
      chart: { backgroundColor: 'transparent', spacing: [10, 10, 10, 10] },
      title: { text: undefined },
      xAxis: {
        categories,
        tickInterval: Math.max(Math.floor(chartWeeks.length / 8), 1),
        lineColor: '#cbd5f5',
      },
      yAxis: {
        title: { text: 'T° máxima semanal (°C)' },
        gridLineColor: '#dfe7f4',
        gridLineDashStyle: 'Dash',
      },
      tooltip: buildPremiumTooltip(' °C'),
      credits: { enabled: false },
      legend: { align: 'center' },
      series,
    };
  }, [
    availableYears.length,
    buildDeltaData,
    chartWeeks,
    getMetricSeries,
    tempComparisonYear,
    tempPrimaryYear,
    tempSelectedYears,
    tempViewMode,
  ]);

  const canShowDelta = availableYears.length >= 2;

  const getYearSetter = (type) => {
    if (type === 'rain') return setRainSelectedYears;
    if (type === 'temp') return setTempSelectedYears;
    if (type === 'light') return setLightSelectedYears;
    return null;
  };

  const toggleYearSelection = (type, year) => {
    const updater = getYearSetter(type);
    if (!updater) return;
    updater((prev) => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev;
        return prev.filter((value) => value !== year);
      }
      return [...prev, year].sort((a, b) => a - b);
    });
  };

  const handleDecadeAction = (type, years, action) => {
    const setter = getYearSetter(type);
    if (!setter) return;
    setter((prev) => {
      if (action === 'replace') {
        return [...years];
      }
      if (action === 'add') {
        const combined = Array.from(new Set([...prev, ...years]));
        return combined.sort((a, b) => a - b);
      }
      if (action === 'remove') {
        const remaining = prev.filter((year) => !years.includes(year));
        if (remaining.length) return remaining;
        const fallback = availableYears[availableYears.length - 1];
        return fallback ? [fallback] : prev;
      }
      return prev;
    });
  };

  const handleQuickSelect = (type, mode) => {
    const targetSetter = getYearSetter(type);
    if (!targetSetter) return;
    let years = [];
    if (mode === 'all') {
      years = [...availableYears];
    } else if (mode === 'last5') {
      years = availableYears.slice(-5);
    } else if (mode === 'last10') {
      years = availableYears.slice(-10);
    } else if (mode === 'recent') {
      years = availableYears.slice(-2);
    }
    if (years.length === 0 && availableYears.length) {
      years = [availableYears[availableYears.length - 1]];
    }
    targetSetter(years);
  };

  const renderYearSelector = (type, viewMode, selectedYears) => {
    if (viewMode !== 'absolute' || !availableYears.length) return null;
    return (
      <div className="chip-controls modern">
        <div className="selector-summary">
          <div className="selector-overview">
            <span>Seleccionados · {selectedYears.length}</span>
            <div className="selected-tags">
              {selectedYears.length ? (
                selectedYears.slice(-6).map((year) => (
                  <span key={`${type}-selected-${year}`}>{year}</span>
                ))
              ) : (
                <span className="empty-tag">Selecciona al menos un año</span>
              )}
              {selectedYears.length > 6 && (
                <span className="overflow-tag">+{selectedYears.length - 6} más</span>
              )}
            </div>
          </div>
          <div className="chip-quick-actions">
            <button type="button" onClick={() => handleQuickSelect(type, 'last5')}>
              Últimos 5
            </button>
            <button type="button" onClick={() => handleQuickSelect(type, 'last10')}>
              Últimos 10
            </button>
            <button type="button" onClick={() => handleQuickSelect(type, 'recent')}>
              Campaña actual
            </button>
            <button type="button" onClick={() => handleQuickSelect(type, 'all')}>
              Todos
            </button>
          </div>
        </div>
        <div className="decade-grid">
          {groupedYears.map(({ label, years }) => {
            const selectedCount = years.filter((year) => selectedYears.includes(year)).length;
            return (
              <article key={`${type}-${label}`} className="decade-card">
                <header>
                  <div>
                    <strong>{label}</strong>
                    <small>
                      {selectedCount}/{years.length} activos
                    </small>
                  </div>
                  <div className="decade-actions">
                    <button type="button" onClick={() => handleDecadeAction(type, years, 'replace')}>
                      Solo esta
                    </button>
                    <button type="button" onClick={() => handleDecadeAction(type, years, 'add')}>
                      Sumar
                    </button>
                    <button type="button" onClick={() => handleDecadeAction(type, years, 'remove')}>
                      Quitar
                    </button>
                  </div>
                </header>
                <div className="decade-chips chip-scroll">
                  <div className="producer-climate__chip-group">
                    {years.map((year) => (
                      <button
                        key={`${type}-${year}`}
                        type="button"
                        className={`producer-climate__chip-button ${
                          selectedYears.includes(year) ? 'is-active' : ''
                        }`}
                        onClick={() => toggleYearSelection(type, year)}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  };

  const getIrrigationSeries = useCallback(
    (year, stageValue) => {
      const stage = STAGE_OPTIONS.find((item) => item.value === stageValue);
      if (!stage || !chartWeeks.length) return chartWeeks.map(() => null);
      const byYear = aggregatedWeeks
        .filter((item) => item.isoYear === year)
        .reduce((map, item) => {
          map.set(item.week, item);
          return map;
        }, new Map());
      return chartWeeks.map((week) => {
        const bucket = byYear.get(week);
        if (!bucket) return null;
        const et0 = bucket.et0;
        const rain = bucket.rain;
        const lamina = Math.max(stage.kc * et0 - rain, 0);
        return Number(lamina.toFixed(1));
      });
    },
    [aggregatedWeeks, chartWeeks]
  );

  const irrigationChartOptions = useMemo(() => {
    if (!chartWeeks.length || !availableYears.length) return null;
    const currentYearData = getIrrigationSeries(currentIsoInfo.isoYear, kcStage);
    const previousYearData = getIrrigationSeries(previousIsoYear, kcStage);
    return {
      chart: { backgroundColor: 'transparent', spacing: [10, 10, 10, 10] },
      title: { text: undefined },
      xAxis: {
        categories: chartWeeks.map((week) => `S${String(week).padStart(2, '0')}`),
        tickInterval: Math.max(Math.floor(chartWeeks.length / 8), 1),
        lineColor: '#cbd5f5',
      },
      yAxis: {
        title: { text: 'Lámina requerida (mm)' },
        gridLineColor: '#dfe7f4',
        gridLineDashStyle: 'Dash',
      },
      tooltip: buildPremiumTooltip(' mm'),
      credits: { enabled: false },
      legend: { align: 'center' },
      series: [
        {
          type: 'column',
          name: `${currentIsoInfo.isoYear}`,
          data: currentYearData,
          color: BLUE_GRADIENT,
          borderWidth: 0,
          borderRadius: 8,
          pointPadding: 0.12,
        },
        {
          type: 'areaspline',
          name: `${previousIsoYear}`,
          data: previousYearData,
          color: '#94a3b8',
          dashStyle: 'ShortDash',
          fillOpacity: 0.08,
          marker: {
            enabled: true,
            radius: 3,
            lineColor: '#94a3b8',
            fillColor: '#ffffff',
          },
        },
      ],
    };
  }, [
    availableYears.length,
    chartWeeks,
    currentIsoInfo.isoYear,
    getIrrigationSeries,
    kcStage,
    previousIsoYear,
  ]);

  const lightChartOptions = useMemo(() => {
    if (!chartWeeks.length || !availableYears.length) return null;
    const highlightYear = lightSelectedYears[lightSelectedYears.length - 1];
    const { primary, muted } = SERIES_COLORS.light;
    const series = lightSelectedYears.map((year, index) => {
      const isHighlight = year === highlightYear;
      const color = isHighlight ? primary : muted;
      return {
        type: isHighlight ? 'areaspline' : 'spline',
        name: `${year}`,
        data: getMetricSeries(year, 'lightHours'),
        color,
        fillOpacity: isHighlight ? 0.12 : 0,
        lineWidth: isHighlight ? 3.4 : 2,
        dashStyle: isHighlight ? 'Solid' : 'ShortDash',
        marker: {
          enabled: true,
          radius: isHighlight ? 4 : 2.5,
          lineColor: color,
          lineWidth: 2,
          fillColor: '#fff',
        },
        connectNulls: false,
      };
    });
    if (!series.length) return null;
    const allValues = series
      .flatMap((serie) => serie.data)
      .filter((value) => typeof value === 'number' && !Number.isNaN(value));
    const minValue = allValues.length ? Math.min(...allValues) : 0;
    const suggestedMin = Math.max(0, Number((minValue - 0.5).toFixed(1)));
    return {
      chart: { backgroundColor: 'transparent', spacing: [10, 10, 10, 10] },
      title: { text: undefined },
      xAxis: {
        categories: chartWeeks.map((week) => `S${String(week).padStart(2, '0')}`),
        tickInterval: Math.max(Math.floor(chartWeeks.length / 8), 1),
        lineColor: '#cbd5f5',
      },
      yAxis: {
        title: { text: 'Horas luz estimadas (h/día)' },
        min: suggestedMin,
        max: 16,
        gridLineColor: '#dfe7f4',
        gridLineDashStyle: 'Dash',
      },
      tooltip: buildPremiumTooltip(' h'),
      credits: { enabled: false },
      legend: { align: 'center' },
      series,
    };
  }, [availableYears.length, chartWeeks, getMetricSeries, lightSelectedYears]);

  const weeklyGddMap = useMemo(() => {
    if (!dailyEntries.length) return new Map();
    const map = new Map();
    dailyEntries.forEach((entry) => {
      const max = entry.temperature_2m_max;
      const min = entry.temperature_2m_min;
      if (
        typeof max !== 'number' ||
        typeof min !== 'number' ||
        Number.isNaN(max) ||
        Number.isNaN(min)
      ) {
        return;
      }
      const avg = (max + min) / 2;
      const gdd = Math.max(avg - gddBase, 0);
      const { isoYear, week } = getISOWeekInfo(entry.date);
      if (!map.has(isoYear)) {
        map.set(isoYear, new Map());
      }
      const yearMap = map.get(isoYear);
      const current = yearMap.get(week) ?? 0;
      yearMap.set(week, current + gdd);
    });
    return map;
  }, [dailyEntries, gddBase]);

  const weeklyGddByYear = useMemo(() => {
    if (!chartWeeks.length || !availableYears.length) return {};
    const result = {};
    availableYears.forEach((year) => {
      const weekMap = weeklyGddMap.get(year) || new Map();
      result[year] = chartWeeks.map((week) => {
        const value = weekMap.get(week);
        return typeof value === 'number' ? Number(value.toFixed(1)) : null;
      });
    });
    return result;
  }, [availableYears, chartWeeks, weeklyGddMap]);

  const gddChartOptions = useMemo(() => {
    if (!chartWeeks.length || !availableYears.length) return null;
    const currentData = weeklyGddByYear[currentIsoInfo.isoYear] || chartWeeks.map(() => null);
    const previousData = weeklyGddByYear[previousIsoYear] || chartWeeks.map(() => null);
    const { primary, muted } = SERIES_COLORS.gdd;
    return {
      chart: { backgroundColor: 'transparent', spacing: [10, 10, 10, 10] },
      title: { text: undefined },
      xAxis: {
        categories: chartWeeks.map((week) => `S${String(week).padStart(2, '0')}`),
        tickInterval: Math.max(Math.floor(chartWeeks.length / 8), 1),
        lineColor: '#cbd5f5',
      },
      yAxis: {
        title: { text: `Grados día (base ${gddBase} °C)` },
        gridLineColor: '#dfe7f4',
        gridLineDashStyle: 'Dash',
      },
      tooltip: buildPremiumTooltip(' GDD'),
      credits: { enabled: false },
      legend: { align: 'center' },
      series: [
        {
          type: 'areaspline',
          name: `${currentIsoInfo.isoYear}`,
          data: currentData,
          color: buildVerticalGradient(primary, `${primary}22`),
          lineColor: primary,
          fillOpacity: 0.15,
          lineWidth: 3.2,
          marker: {
            enabled: true,
            radius: 4,
            lineColor: primary,
            fillColor: '#ffffff',
            lineWidth: 2,
          },
        },
        {
          type: 'spline',
          name: `${previousIsoYear}`,
          data: previousData,
          color: muted,
          dashStyle: 'ShortDash',
          marker: {
            enabled: true,
            radius: 3,
            symbol: 'diamond',
            lineColor: muted,
            fillColor: '#fff',
          },
        },
      ],
    };
  }, [
    availableYears.length,
    chartWeeks,
    currentIsoInfo.isoYear,
    gddBase,
    previousIsoYear,
    weeklyGddByYear,
  ]);

  const gddTarget = useMemo(() => GDD_TARGETS[gddBase] || 1000, [gddBase]);

  const gddSummary = useMemo(() => {
    if (!availableYears.length || !chartWeeks.length) return null;
    const currentSeries = weeklyGddByYear[currentIsoInfo.isoYear] || [];
    const previousSeries = weeklyGddByYear[previousIsoYear] || [];
    const accumulate = (series) =>
      series.reduce((acc, value) => acc + (typeof value === 'number' ? value : 0), 0);
    const currentTotal = accumulate(currentSeries);
    const previousTotal = accumulate(previousSeries);
    return {
      currentTotal,
      previousTotal,
      delta: currentTotal - previousTotal,
    };
  }, [availableYears.length, chartWeeks, currentIsoInfo.isoYear, previousIsoYear, weeklyGddByYear]);

  const baggingCohorts = useMemo(() => {
    if (!aggregatedWeeks.length || !weeklyGddMap.size) return [];
    const currentYearWeeks = aggregatedWeeks
      .filter(
        (week) => week.isoYear === currentIsoInfo.isoYear && week.week <= currentIsoInfo.week
      )
      .sort((a, b) => a.week - b.week);
    if (!currentYearWeeks.length) return [];
    const yearMap = weeklyGddMap.get(currentIsoInfo.isoYear) || new Map();
    const recentWeeks = currentYearWeeks.slice(-MAX_BAGGING_WEEKS);
    const currentWeekNumber = currentIsoInfo.week;
    const recentGddValues = [];
    for (let i = 0; i < 2; i += 1) {
      const week = currentWeekNumber - i;
      const value = yearMap.get(week);
      if (typeof value === 'number') recentGddValues.push(value);
    }
    const recentAvgGdd = recentGddValues.length
      ? recentGddValues.reduce((acc, val) => acc + val, 0) / recentGddValues.length
      : null;

    return recentWeeks
      .map((weekInfo) => {
        let cumulative = 0;
        for (let wk = weekInfo.week; wk <= currentWeekNumber; wk += 1) {
          const value = yearMap.get(wk);
          if (typeof value === 'number') {
            cumulative += value;
          }
        }
        if (cumulative === 0) return null;
        const progress = Math.min((cumulative / gddTarget) * 100, 150);
        const remainingGdd = Math.max(gddTarget - cumulative, 0);
        const weeksRemaining =
          recentAvgGdd && remainingGdd > 0 ? remainingGdd / recentAvgGdd : 0;
        const weeksSinceTarget =
          recentAvgGdd && cumulative >= gddTarget
            ? (cumulative - gddTarget) / (recentAvgGdd || 1)
            : 0;
        return {
          key: `${weekInfo.isoYear}-W${weekInfo.week}`,
          weekLabel: formatWeekLabel(weekInfo.isoYear, weekInfo.week),
          cumulative,
          progress,
          remainingGdd,
          weeksRemaining,
          weeksSinceTarget,
        };
      })
      .filter(Boolean)
      .reverse();
  }, [
    aggregatedWeeks,
    currentIsoInfo.isoYear,
    currentIsoInfo.week,
    gddTarget,
    weeklyGddMap,
  ]);

  const overTargetCohorts = useMemo(
    () => baggingCohorts.filter((cohort) => cohort.progress >= 110),
    [baggingCohorts]
  );

  const irrigationSummary = useMemo(() => {
    if (!chartWeeks.length || !availableYears.length) return null;
    const stage = STAGE_OPTIONS.find((item) => item.value === kcStage);
    if (!stage) return null;

    const currentSeries = getIrrigationSeries(currentIsoInfo.isoYear, kcStage);
    const previousSeries = getIrrigationSeries(previousIsoYear, kcStage);
    const sumSeries = (series) =>
      series.reduce((acc, value) => acc + (typeof value === 'number' ? value : 0), 0);
    const currentSeriesTotal = sumSeries(currentSeries);
    const previousSeriesTotal = sumSeries(previousSeries);

    const computeYearStats = (year) => {
      const yearWeeks = aggregatedWeeks.filter((item) => item.isoYear === year);
      if (!yearWeeks.length) return null;
      return yearWeeks.reduce(
        (acc, week) => {
          const etc = stage.kc * week.et0;
          const rain = week.rain;
          const net = Math.max(etc - rain, 0);
          return {
            net: acc.net + net,
            etc: acc.etc + etc,
            rain: acc.rain + rain,
            days: acc.days + week.count,
          };
        },
        { net: 0, etc: 0, rain: 0, days: 0 }
      );
    };

    const round = (value, digits = 1) => Number(value.toFixed(digits));
    const formatStats = (stats) => {
      if (!stats) return null;
      return {
        net: round(stats.net, 1),
        etc: round(stats.etc, 1),
        rain: round(stats.rain, 1),
        mmPerDay: stats.days ? round(stats.net / stats.days, 2) : null,
        m3PerHa: stats.days ? round((stats.net / stats.days) * 10 * DAYS_PER_MONTH, 0) : null,
      };
    };

    const currentStats = formatStats(computeYearStats(currentIsoInfo.isoYear));
    const previousStats = formatStats(computeYearStats(previousIsoYear));

    const currentTotal = currentStats?.net ?? currentSeriesTotal;
    const previousTotal = previousStats?.net ?? previousSeriesTotal;

    const buildDelta = (currentValue, previousValue, digits = 1) => {
      if (currentValue === null || currentValue === undefined) return null;
      if (previousValue === null || previousValue === undefined) return null;
      return Number((currentValue - previousValue).toFixed(digits));
    };

    return {
      currentTotal,
      previousTotal,
      delta: currentTotal - previousTotal,
      mmPerDayCurrent: currentStats?.mmPerDay ?? null,
      mmPerDayPrevious: previousStats?.mmPerDay ?? null,
      mmPerDayDelta: buildDelta(currentStats?.mmPerDay ?? null, previousStats?.mmPerDay ?? null, 2),
      m3PerHaCurrent: currentStats?.m3PerHa ?? null,
      m3PerHaPrevious: previousStats?.m3PerHa ?? null,
      m3PerHaDelta: buildDelta(currentStats?.m3PerHa ?? null, previousStats?.m3PerHa ?? null, 0),
      etcCurrent: currentStats?.etc ?? null,
      etcPrevious: previousStats?.etc ?? null,
      rainCurrent: currentStats?.rain ?? null,
      rainPrevious: previousStats?.rain ?? null,
    };
  }, [
    aggregatedWeeks,
    availableYears.length,
    chartWeeks,
    currentIsoInfo.isoYear,
    getIrrigationSeries,
    kcStage,
    previousIsoYear,
  ]);

  const forecastCards = useMemo(() => {
    if (!forecastData?.daily?.time?.length) return [];
    return forecastData.daily.time.map((date, index) => ({
      date,
      max: forecastData.daily.temperature_2m_max?.[index],
      min: forecastData.daily.temperature_2m_min?.[index],
      rain: forecastData.daily.precipitation_sum?.[index],
      wind: forecastData.daily.windspeed_10m_max?.[index],
    }));
  }, [forecastData]);

  const dryWindow = useMemo(() => findDryWindow(forecastData), [forecastData]);

  const forecastOperations = useMemo(() => {
    if (!forecastCards.length) return [];
    const getStatus = (value, thresholds) => {
      if (value >= thresholds.stop) return 'blocked';
      if (value >= thresholds.caution) return 'caution';
      return 'ideal';
    };
    return forecastCards.map((day) => {
      const spraying = (() => {
        const rainStatus = getStatus(day.rain ?? 0, { caution: 1, stop: 2.5 });
        const windStatus = getStatus(day.wind ?? 0, { caution: 18, stop: 25 });
        if (rainStatus === 'blocked' || windStatus === 'blocked') return 'blocked';
        if (rainStatus === 'caution' || windStatus === 'caution') return 'caution';
        return 'ideal';
      })();
      const irrigation = (() => {
        if ((day.rain ?? 0) >= 12) return 'blocked';
        if ((day.rain ?? 0) >= 5) return 'caution';
        return 'ideal';
      })();
      const cultural = (() => {
        const rainStatus = getStatus(day.rain ?? 0, { caution: 4, stop: 10 });
        const windStatus = getStatus(day.wind ?? 0, { caution: 28, stop: 38 });
        if (rainStatus === 'blocked' || windStatus === 'blocked') return 'blocked';
        if (rainStatus === 'caution' || windStatus === 'caution') return 'caution';
        return 'ideal';
      })();
      return {
        date: day.date,
        max: day.max,
        min: day.min,
        rain: day.rain,
        wind: day.wind,
        spraying,
        irrigation,
        cultural,
      };
    });
  }, [forecastCards]);

  const meteogramOptions = useMemo(() => {
    if (!forecastCards.length) return null;

    const points = forecastCards.map((day) => {
      const timestamp = Date.parse(`${day.date}T00:00:00Z`);
      return {
        x: isNaN(timestamp) ? undefined : timestamp,
        rain: typeof day.rain === 'number' ? Number(day.rain.toFixed(1)) : 0,
        max: typeof day.max === 'number' ? Number(day.max.toFixed(1)) : null,
        min: typeof day.min === 'number' ? Number(day.min.toFixed(1)) : null,
        wind:
          typeof day.wind === 'number'
            ? Number((day.wind * 3.6).toFixed(1)) // convertir de m/s a km/h
            : null,
      };
    });

    const temperatureBand = points.map(point => [point.x, point.min, point.max]);
    const maxPoints = points.map(point => [point.x, point.max]);
    const minPoints = points.map(point => [point.x, point.min]);
    const rainPoints = points.map(point => [point.x, point.rain]);
    const windPoints = points.map(point => [point.x, point.wind]);

    return {
      chart: {
        backgroundColor: 'transparent',
        zoomType: 'x',
        spacingTop: 12,
        spacingBottom: 14,
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { align: 'center' },
      xAxis: {
        type: 'datetime',
        crosshair: { width: 1, color: '#0f6b46' },
        tickInterval: 24 * 3600 * 1000,
        labels: { format: '{value:%a %d}' },
      },
      yAxis: [
        {
          title: { text: 'Temperatura (°C)' },
          gridLineColor: '#e2e8f0',
          plotBands: [
            {
              from: TEMP_THRESHOLDS.low,
              to: TEMP_THRESHOLDS.high,
              color: 'rgba(16,185,129,0.08)',
              label: {
                text: 'Rango ideal',
                style: { color: '#0f6b46', fontWeight: 600 },
              },
            },
          ],
        },
        {
          title: { text: 'Lluvia / Viento (mm / km/h)' },
          opposite: true,
          min: 0,
          gridLineColor: '#f1f5f9',
          plotLines: [
            {
              value: 18,
              color: '#f97316',
              dashStyle: 'ShortDash',
              width: 1,
              label: {
                text: 'Precaución viento',
                align: 'right',
                style: { color: '#f97316', fontSize: '11px' },
              },
            },
            {
              value: 25,
              color: '#dc2626',
              dashStyle: 'ShortDash',
              width: 1,
              label: {
                text: 'Límite viento',
                align: 'right',
                style: { color: '#dc2626', fontSize: '11px' },
              },
            },
          ],
        },
      ],
      tooltip: {
        shared: true,
        useHTML: true,
        formatter() {
          const lines = [
            `<div class=\"meteogramTooltip\"><strong>${Highcharts.dateFormat('%A %e %b', this.x)}</strong>`,
          ];
          this.points?.forEach(point => {
            const suffix = point.series.name.includes('Lluvia')
              ? ' mm'
              : point.series.name.includes('Viento')
              ? ' km/h'
              : ' °C';
            lines.push(
              `<div><span style=\"color:${point.color}\">●</span> ${point.series.name}: <strong>${Highcharts.numberFormat(point.y, 1)}${suffix}</strong></div>`
            );
          });
          lines.push('</div>');
          return lines.join('');
        },
      },
      series: [
        {
          type: 'column',
          name: 'Lluvia',
          data: rainPoints,
          yAxis: 1,
          color: BLUE_GRADIENT,
          borderRadius: 3,
        },
        {
          type: 'arearange',
          name: 'Rango térmico',
          data: temperatureBand,
          color: 'rgba(15,107,70,0.08)',
          lineColor: 'rgba(15,107,70,0.5)',
          fillOpacity: 0.5,
          zIndex: 0,
          tooltip: { valueSuffix: ' °C' },
        },
        {
          type: 'spline',
          name: 'T° Máx',
          data: maxPoints,
          color: CHART_COLORS.orange,
          marker: { enabled: true, symbol: 'circle' },
          zIndex: 2,
          tooltip: { valueSuffix: ' °C' },
        },
        {
          type: 'spline',
          name: 'T° Mín',
          data: minPoints,
          color: CHART_COLORS.blue,
          marker: { enabled: true, symbol: 'circle' },
          zIndex: 2,
          tooltip: { valueSuffix: ' °C' },
        },
        {
          type: 'spline',
          name: 'Viento máx',
          data: windPoints,
          yAxis: 1,
          color: CHART_COLORS.blue,
          lineWidth: 2,
          marker: { enabled: true, symbol: 'diamond' },
          tooltip: { valueSuffix: ' km/h' },
          zIndex: 3,
          zones: [
            { value: 18, color: CHART_COLORS.blue },
            { value: 25, color: '#f97316' },
            { color: '#dc2626' },
          ],
        },
      ],
    };
  }, [forecastCards]);

  const stressMonitor = useMemo(() => {
    if (!climateInsights || !gddSummary || !irrigationSummary) return null;
    const thermalDelta = gddSummary.delta;
    const hydricDelta = climateInsights.rain.delta - climateInsights.et0.delta;
    const irrigationDelta = irrigationSummary.delta;
    const thermalStatus = (() => {
      if (thermalDelta >= 80) return 'accelerated';
      if (thermalDelta <= -80) return 'slow';
      return 'normal';
    })();
    const hydricStatus = (() => {
      const balance = hydricDelta + irrigationDelta;
      if (balance <= -60) return 'deficit';
      if (balance >= 60) return 'surplus';
      return 'balanced';
    })();
    const recommendations = [];
    if (thermalStatus === 'accelerated') {
      recommendations.push('El ciclo térmico va adelantado. Ajusta cronogramas de corte.');
    } else if (thermalStatus === 'slow') {
      recommendations.push('El avance térmico es lento. Revisa nutrición y ventilación.');
    } else {
      recommendations.push('Velocidad térmica dentro de los rangos esperados.');
    }
    if (hydricStatus === 'deficit') {
      recommendations.push('Hay déficit hídrico neto. Considera reforzar riego o mulching.');
    } else if (hydricStatus === 'surplus') {
      recommendations.push('Exceso hídrico. Revisa drenajes y reduce láminas.');
    } else {
      recommendations.push('Balance hídrico estable, mantén la estrategia actual.');
    }
    return {
      thermalStatus,
      hydricStatus,
      thermalDelta,
      hydricDelta,
      irrigationDelta,
      recommendations,
    };
  }, [climateInsights, gddSummary, irrigationSummary]);

  const floodRisk = useMemo(() => {
    if (!aggregatedWeeks.length) return null;
    const lastWeek = aggregatedWeeks[aggregatedWeeks.length - 1];
    const lastFour = aggregatedWeeks.slice(-4);
    const rainOneWeek = lastWeek ? lastWeek.rain : 0;
    const rainFourWeeks = lastFour.reduce((acc, week) => acc + week.rain, 0);
    const et0FourWeeks = lastFour.reduce((acc, week) => acc + week.et0, 0);
    const surplus = rainFourWeeks - et0FourWeeks;

    let riskLevel = 'low';
    if (rainOneWeek > 120 || rainFourWeeks > 220 || surplus > 80) {
      riskLevel = 'high';
    } else if (rainOneWeek > 80 || rainFourWeeks > 160 || surplus > 40) {
      riskLevel = 'medium';
    }

    return {
      riskLevel,
      rainOneWeek,
      rainFourWeeks,
      surplus,
    };
  }, [aggregatedWeeks]);

  const handleDownloadDailyData = useCallback(() => {
    if (!dailyEntries.length) return;
    if (typeof document === 'undefined') return;
    const headers = [
      'fecha',
      'temp_max_c',
      'temp_min_c',
      'precipitacion_mm',
      'et0_mm',
      'viento_max_kmh',
    ];
    const formatValue = (value) =>
      typeof value === 'number' && !Number.isNaN(value) ? value.toFixed(2) : '';
    const rows = dailyEntries.map((entry) =>
      [
        entry.isoDate,
        formatValue(entry.temperature_2m_max),
        formatValue(entry.temperature_2m_min),
        formatValue(entry.precipitation_sum),
        formatValue(entry.et0_fao_evapotranspiration),
        formatValue(entry.windspeed_10m_max),
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const fincaSlug = getFincaSlug();
    const link = document.createElement('a');
    link.href = url;
    link.download = `clima-diario-${fincaSlug || 'finca'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [dailyEntries, getFincaSlug]);

  const handleDownloadReportPdf = useCallback(async () => {
    if (!reportRef.current) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    setIsExportingPdf(true);
    const element = reportRef.current;
    element.classList.add('producer-climate--export');
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.clientWidth,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const fincaSlug = getFincaSlug();
      pdf.save(`reporte-clima-${fincaSlug || 'finca'}.pdf`);
    } catch (pdfError) {
      console.error('No se pudo generar el PDF del laboratorio de clima', pdfError);
    } finally {
      element.classList.remove('producer-climate--export');
      setIsExportingPdf(false);
    }
  }, [getFincaSlug, reportRef]);

  const handleQuickExport = useCallback(
    async reportType => {
      if (!reportRef.current) return;
      if (typeof window === 'undefined') return;

      switch (reportType) {
        case 'summary': {
          const summaryElement = document.querySelector('.producer-climate__summary');
          if (!summaryElement) break;
          summaryElement.classList.add('producer-climate__exportBlock');
          try {
            const canvas = await html2canvas(summaryElement, { scale: 2, useCORS: true });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 10, pageWidth, imgHeight, undefined, 'FAST');
            pdf.save(`resumen-clima-${getFincaSlug() || 'finca'}.pdf`);
          } catch (e) {
            console.error('No se pudo exportar el resumen', e);
          } finally {
            summaryElement.classList.remove('producer-climate__exportBlock');
          }
          break;
        }
        case 'thresholds': {
          const thresholdSection = document.querySelector('.producer-climate__summary-block');
          if (!thresholdSection) break;
          thresholdSection.classList.add('producer-climate__exportBlock');
          try {
            const canvas = await html2canvas(thresholdSection, { scale: 2, useCORS: true });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 10, pageWidth, imgHeight, undefined, 'FAST');
            pdf.save(`umbrales-clima-${getFincaSlug() || 'finca'}.pdf`);
          } catch (e) {
            console.error('No se pudo exportar los umbrales', e);
          } finally {
            thresholdSection.classList.remove('producer-climate__exportBlock');
          }
          break;
        }
        default:
          handleDownloadReportPdf();
      }
    },
    [getFincaSlug, handleDownloadReportPdf]
  );

  const handleSelectFinca = (fincaId) => {
    setSelectedFincaId(fincaId);
  };

  const canFetch = Boolean(coordinates);

  const insightNarrative = useMemo(() => {
    const notes = [];
    if (sigatokaRisk) {
      notes.push(
        `Sigatoka negra en ${
          sigatokaRisk.riskLevel === 'high'
            ? 'presión alta'
            : sigatokaRisk.riskLevel === 'medium'
            ? 'presión moderada'
            : 'presión baja'
        }`
      );
    }
    if (mokoRisk) {
      notes.push(
        `Moko (${mokoRisk.riskLevel === 'high' ? 'alerta' : mokoRisk.riskLevel === 'medium' ? 'vigilar' : 'estable'})`
      );
    }
    if (stressMonitor) {
      if (stressMonitor.thermalStatus === 'accelerated') {
        notes.push('El ciclo térmico está adelantado vs. la campaña pasada.');
      } else if (stressMonitor.thermalStatus === 'slow') {
        notes.push('El desarrollo térmico va rezagado.');
      }
      if (stressMonitor.hydricStatus === 'deficit') {
        notes.push('Hay déficit hídrico neto respecto al año anterior.');
      } else if (stressMonitor.hydricStatus === 'surplus') {
        notes.push('Acumulas excedente hídrico respecto a la campaña previa.');
      }
    }
    if (!notes.length) {
      notes.push('Sin alertas críticas. Mantén los programas habituales.');
    }
    return notes;
  }, [mokoRisk, sigatokaRisk, stressMonitor]);

  return (
    <div ref={reportRef} className="producer-climate">
      <div className="producer-climate__summary">
      <header className="producer-climate__hero">
        <div>
          <span className="producer-climate__eyebrow">Clima operativo</span>
          <h1>Laboratorio de clima del productor</h1>
          <p>
            Consolidamos tu histórico, lo comparamos con la campaña pasada y te
            alertamos sobre ventanas ideales para labores en campo.
          </p>
        </div>
        <div className="producer-climate__hero-actions">
          <div className="producer-climate__exporters">
            <button
              type="button"
              className="button button-ghost"
              onClick={handleDownloadDailyData}
              disabled={!dailyEntries.length}
            >
              <Icon name="Download" size={18} /> Datos diarios CSV
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => handleQuickExport('summary')}
            >
              <Icon name="FileText" size={18} /> Resumen en PDF
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => handleQuickExport('thresholds')}
            >
              <Icon name="Layers" size={18} /> Umbrales en PDF
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={handleDownloadReportPdf}
              disabled={isExportingPdf}
            >
              <Icon name="FileDown" size={18} />
              {isExportingPdf ? 'Generando PDF...' : 'Reporte completo'}
            </button>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => onNavigate('producerProfile')}
          >
            <Icon name="UserRound" size={18} /> Ver mis fincas
          </button>
          <button
            type="button"
            className="button btn-primary"
            onClick={fetchClimateData}
            disabled={!canFetch || loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar clima'}
          </button>
        </div>
      </header>

      <section className="producer-climate__card producer-climate__narrative">
        <div className="producer-climate__narrative-header">
          <div>
            <h4>Resumen operativo</h4>
            <ul>
              {insightNarrative.map((note, index) => (
                <li key={`insight-${index}`}>{note}</li>
              ))}
            </ul>
          </div>
          <div className="producer-climate__logo">
            <img
              src="https://res.cloudinary.com/do4vybtt4/image/upload/v1762369002/Lytiks-02_indfgk.svg"
              alt="Lytiks"
            />
          </div>
        </div>
      </section>
      </div>

      <div className="producer-climate__layout">
        <section className="producer-climate__card producer-climate__card--break">
          <div className="producer-climate__card-header">
            <Icon name="MapPin" size={20} />
            <div>
              <h2>Mapa operativo</h2>
              <p>Selecciona una finca y visualiza su contorno oficial.</p>
            </div>
          </div>
          <div className="producer-climate__map-wrapper">
            {fincas.length > 0 ? (
              <MapContainer
                center={
                  coordinates ? [coordinates.lat, coordinates.lon] : defaultCenter
                }
                zoom={coordinates ? 13 : 9}
                className="producer-climate__map"
              >
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="Mapa base">
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Vista satelital">
                    <TileLayer
                      attribution="Tiles &copy; Esri"
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>
                {fincas.map((finca) => (
                  <React.Fragment key={finca.id}>
                    {finca.boundary?.geojson ? (
                      <GeoJSON
                        data={finca.boundary.geojson}
                        pathOptions={{
                          color: finca.id === selectedFinca?.id ? '#0f9f6e' : '#94a3b8',
                          weight: finca.id === selectedFinca?.id ? 3 : 1.5,
                          fillOpacity: finca.id === selectedFinca?.id ? 0.25 : 0.08,
                        }}
                        eventHandlers={{
                          click: () => handleSelectFinca(finca.id),
                        }}
                      />
                    ) : (
                      finca.location && (
                        <CircleMarker
                          center={[finca.location.lat, finca.location.lon]}
                          radius={finca.id === selectedFinca?.id ? 10 : 6}
                          color={finca.id === selectedFinca?.id ? '#0f9f6e' : '#475569'}
                          fillOpacity={0.85}
                          eventHandlers={{
                            click: () => handleSelectFinca(finca.id),
                          }}
                        >
                          <Tooltip direction="top">{finca.name}</Tooltip>
                        </CircleMarker>
                      )
                    )}
                  </React.Fragment>
                ))}
                {selectedFinca && <MapAutoFocus finca={selectedFinca} />}
              </MapContainer>
            ) : (
              <div className="producer-climate__empty-map">
                <Icon name="Info" size={20} />
                Registra al menos una finca para habilitar el análisis climático.
              </div>
            )}
          </div>
          <div className="producer-climate__finca-list">
            {fincas.map((finca) => {
              const isActive = finca.id === selectedFinca?.id;
              const area = finca.boundary?.areaHectares ?? finca.hectares;
              return (
                <button
                  type="button"
                  key={finca.id}
                  className={`producer-climate__finca-chip ${
                    isActive ? 'is-active' : ''
                  }`}
                  onClick={() => handleSelectFinca(finca.id)}
                >
                  <div>
                    <strong>{finca.name}</strong>
                    <span>{area ? `${area.toFixed(1)} ha` : 'Área sin digitalizar'}</span>
                  </div>
                  <span className="producer-climate__chip-pill">
                    {finca.boundary?.geojson ? 'Polígono listo' : 'Sólo coordenada'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="producer-climate__card producer-climate__card--break">
          <div className="producer-climate__card-header">
            <Icon name="BarChart3" size={20} />
            <div>
              <h2>Indicadores comparativos</h2>
              <p>Comparamos el acumulado del año actual vs. el anterior.</p>
            </div>
          </div>
          {climateInsights ? (
            <div className="producer-climate__insights-grid">
              <article>
                <div className="producer-climate__insight-icon">
                  <Icon name="CloudRain" size={20} />
                </div>
                <div>
                  <span>Precipitación acumulada</span>
                  <strong>{formatNumber(climateInsights.rain.current)} mm</strong>
                  <small>
                    {climateInsights.rain.delta >= 0 ? '+' : ''}
                    {formatNumber(climateInsights.rain.delta)} mm vs. {previousYear}
                  </small>
                </div>
              </article>
              <article>
                <div className="producer-climate__insight-icon">
                  <Icon name="Thermometer" size={20} />
                </div>
                <div>
                  <span>Temp. máxima promedio</span>
                  <strong>{formatNumber(climateInsights.maxTemp.current)} °C</strong>
                  <small>
                    {climateInsights.maxTemp.delta >= 0 ? '+' : ''}
                    {formatNumber(climateInsights.maxTemp.delta)} °C vs. {previousYear}
                  </small>
                </div>
              </article>
              <article>
                <div className="producer-climate__insight-icon">
                  <Icon name="LineChart" size={20} />
                </div>
                <div>
                  <span>ET₀ acumulada</span>
                  <strong>{formatNumber(climateInsights.et0.current)} mm</strong>
                  <small>
                    {climateInsights.et0.delta >= 0 ? '+' : ''}
                    {formatNumber(climateInsights.et0.delta)} mm vs. {previousYear}
                  </small>
                </div>
              </article>
              <article>
                <div className="producer-climate__insight-icon">
                  <Icon name="Clock8" size={20} />
                </div>
                <div>
                  <span>Días con viento &gt;= 20 km/h</span>
                  <strong>{climateInsights.windEvents.current}</strong>
                  <small>
                    {climateInsights.windEvents.delta >= 0 ? '+' : ''}
                    {climateInsights.windEvents.delta} vs. {previousYear}
                  </small>
                </div>
              </article>
            </div>
          ) : (
            <p className="producer-climate__placeholder">
              Consulta el clima para mostrar comparativas.
            </p>
          )}
          <div className="producer-climate__meta">
            <span>
              {coordinates
                ? `Coordenadas: ${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}`
                : 'Sin coordenadas registradas.'}
            </span>
            {lastRequest && (
              <span>
                Última consulta:{' '}
                {new Date(lastRequest.executedAt).toLocaleTimeString('es-EC', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </section>
      </div>

      {rainfallThresholdChartOptions && (
        <section className="producer-climate__card producer-climate__card--break producer-climate__summary-block">
          <div className="producer-climate__card-header">
            <Icon name="Layers" size={20} />
            <div>
              <h2>Histograma de lluvia vs promedio</h2>
              <p>Visualiza las últimas semanas frente al promedio móvil del sitio.</p>
            </div>
          </div>
          <div className="rainfall-chart">
            <HighchartsReact highcharts={Highcharts} options={rainfallThresholdChartOptions} />
          </div>
        </section>
      )}

      {agronomicSignals && (
        <section className="producer-climate__card producer-climate__card--break">
          <div className="producer-climate__card-header">
            <Icon name="SlidersHorizontal" size={20} />
            <div>
              <h2>Indicadores agronómicos</h2>
              <p>
                Promedios móviles y umbrales clave para {agronomicSignals.latestLabel}.
              </p>
            </div>
          </div>
          <div className="producer-climate__signals-grid">
            <article className={`signal-card status-${agronomicSignals.rainStatus}`}>
              <span>
                Promedio móvil de lluvia ({agronomicSignals.windowSize} semanas)
              </span>
              <strong>{formatNumber(agronomicSignals.rainMovingAvg)} mm</strong>
              <small>
                {agronomicSignals.rainStatus === 'high' && 'Exceso hídrico'}
                {agronomicSignals.rainStatus === 'low' && 'Posible déficit hídrico'}
                {agronomicSignals.rainStatus === 'optimal' && 'Rango óptimo'}
                {agronomicSignals.rainStatus === 'neutral' && 'Sin datos suficientes'}
              </small>
            </article>
            <article className={`signal-card status-${agronomicSignals.tempStatus}`}>
              <span>
                Promedio móvil T° máxima ({agronomicSignals.windowSize} semanas)
              </span>
              <strong>{formatNumber(agronomicSignals.tempMovingAvg)} °C</strong>
              <small>
                {agronomicSignals.tempStatus === 'high' && 'Riesgo de estrés térmico'}
                {agronomicSignals.tempStatus === 'low' && 'Temperaturas bajas'}
                {agronomicSignals.tempStatus === 'optimal' && 'Comportamiento ideal'}
                {agronomicSignals.tempStatus === 'neutral' && 'Sin datos suficientes'}
              </small>
            </article>
            <article className="signal-card status-summary">
              <span>Últimas {agronomicSignals.referenceWeeks} semanas analizadas</span>
              <div className="signal-summary">
                <div>
                  <strong>{agronomicSignals.rainStressWeeks}</strong>
                  <small>Semanas con lluvia &le; {RAIN_THRESHOLDS.low} mm</small>
                </div>
                <div>
                  <strong>{agronomicSignals.heatStressWeeks}</strong>
                  <small>Semanas con T° &ge; {TEMP_THRESHOLDS.high} °C</small>
                </div>
              </div>
            </article>
          </div>
        </section>
      )}

      {climateAlerts.length > 0 && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="AlertTriangle" size={20} />
            <div>
              <h2>Alertas agroclimáticas</h2>
              <p>Sugerencias operativas basadas en el clima actual y pronóstico.</p>
            </div>
          </div>
          <div className="producer-climate__alerts-list">
            {climateAlerts.map((alert, index) => (
              <article key={`${alert.type}-${index}`} className={`alert-card alert-${alert.type}`}>
                <div className="alert-card__header">
                  <Icon
                    name={
                      alert.type === 'warning'
                        ? 'AlertTriangle'
                        : alert.type === 'risk'
                        ? 'Flame'
                        : alert.type === 'success'
                        ? 'CheckCircle2'
                        : 'Info'
                    }
                    size={18}
                  />
                  <h4>{alert.title}</h4>
                </div>
                <p>{alert.detail}</p>
                {alert.suggestion && <span>{alert.suggestion}</span>}
              </article>
            ))}
          </div>
        </section>
      )}

      {anomalyIndicators && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="Activity" size={20} />
            <div>
              <h2>Anomalías climáticas</h2>
              <p>
                Variaciones de la semana {anomalyIndicators.label} respecto al promedio histórico.
              </p>
            </div>
          </div>
          <div className="anomaly-toolbar">
            <span>Ventana histórica</span>
            <div className="producer-climate__chip-group">
              {ANOMALY_WINDOWS.filter(window => window <= historyCoverageYears).map((window) => (
                <button
                  key={`anomaly-${window}`}
                  type="button"
                  className={`producer-climate__chip-button ${
                    anomalyWindowYears === window ? 'is-active' : ''
                  }`}
                  onClick={() => setAnomalyWindowYears(window)}
                >
                  {window} años
                </button>
              ))}
            </div>
            <small>
              {anomalyIndicators.peers} años usados para el promedio (cobertura disponible: {historyCoverageYears} años).
            </small>
          </div>
          <div className="anomaly-grid">
            <article>
              <span>Anomalía de lluvia</span>
              <strong className={anomalyIndicators.rainDelta >= 0 ? 'positive-text' : 'negative-text'}>
                {anomalyIndicators.rainDelta >= 0 ? '+' : ''}
                {formatNumber(anomalyIndicators.rainDelta)} mm
              </strong>
              <small>Promedio histórico: {formatNumber(anomalyIndicators.avgRain)} mm</small>
            </article>
            {anomalyIndicators.tempDelta !== null && (
              <article>
                <span>Anomalía T° máxima</span>
                <strong className={anomalyIndicators.tempDelta >= 0 ? 'positive-text' : 'negative-text'}>
                  {anomalyIndicators.tempDelta >= 0 ? '+' : ''}
                  {formatNumber(anomalyIndicators.tempDelta)} °C
                </strong>
                <small>Promedio histórico: {formatNumber(anomalyIndicators.avgTemp)} °C</small>
              </article>
            )}
          </div>
      </section>
      )}

      {sigatokaRisk && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="Biohazard" size={20} />
            <div>
              <h2>Radar Sigatoka negra</h2>
              <p>
                Índice estimado según humedad acumulada, temperatura nocturna y amplitud térmica.
              </p>
            </div>
          </div>
          <div className={`sigatoka-status sigatoka-${sigatokaRisk.riskLevel}`}>
            <div className="sigatoka-badge">
              {sigatokaRisk.riskLevel === 'high'
                ? 'Alta presión'
                : sigatokaRisk.riskLevel === 'medium'
                ? 'Presión moderada'
                : 'Presión baja'}
            </div>
            <div className="sigatoka-metrics">
              <div>
                <strong>{formatNumber(sigatokaRisk.rainLast4Weeks)} mm</strong>
                <span>Lluvia últimas 4 semanas</span>
              </div>
              <div>
                <strong>{formatNumber(sigatokaRisk.avgMinTemp)} °C</strong>
                <span>Promedio T° mínima (28 días)</span>
              </div>
              <div>
                <strong>{formatNumber(sigatokaRisk.avgAmplitude)} °C</strong>
                <span>Amplitud térmica diaria</span>
              </div>
              <div>
                <strong>{formatNumber(sigatokaRisk.humiditySurplus)} mm</strong>
                <span>Exceso hídrico vs ET₀</span>
              </div>
            </div>
            {sigatokaRisk.factors?.length > 0 && (
              <div className="sigatoka-factors">
                <span className="sigatoka-factors__title">Factores que ponderan el semáforo</span>
                <ul className="sigatoka-factor-list">
                  {sigatokaRisk.factors.map((factor, index) => (
                    <li className="sigatoka-factor" key={`sigatoka-factor-${index}`}>
                      <div className="sigatoka-factor__info">
                        <strong>{factor.label}</strong>
                        <span className="sigatoka-factor__context">{factor.context}</span>
                        <span className="sigatoka-factor__hint">{factor.hint}</span>
                      </div>
                      <div className="sigatoka-factor__value">
                        <strong>
                          {formatNumber(factor.value)}
                          {factor.unit ? ` ${factor.unit}` : ''}
                        </strong>
                        <span
                          className={`sigatoka-factor__badge sigatoka-factor__badge-${factor.pressure}`}
                        >
                          {factor.pressure === 'high'
                            ? 'Alta presión'
                            : factor.pressure === 'medium'
                            ? 'Moderada'
                            : 'Baja'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <ul className="sigatoka-advice">
            {sigatokaRisk.recommendations.map((item, index) => (
              <li key={`sigatoka-advice-${index}`}>
                <Icon name="CheckCircle2" size={14} />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {mokoRisk && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="Bacteria" size={20} />
            <div>
              <h2>Radar Moko (R. solanacearum)</h2>
              <p>
                Evaluamos lluvia, exceso hídrico y noches cálidas que aceleran la bacteria en
                pseudotallos.
              </p>
            </div>
          </div>
          <div className={`sigatoka-status sigatoka-${mokoRisk.riskLevel}`}>
            <div className="sigatoka-badge">
              {mokoRisk.riskLevel === 'high'
                ? 'Alerta alta'
                : mokoRisk.riskLevel === 'medium'
                ? 'Vigilar'
                : 'Condición estable'}
            </div>
            <div className="sigatoka-metrics">
              <div>
                <strong>{formatNumber(mokoRisk.avgTemp)} °C</strong>
                <span>Temp. media (28 días)</span>
              </div>
              <div>
                <strong>{formatNumber(mokoRisk.avgMin)} °C</strong>
                <span>Noches (prom.)</span>
              </div>
              <div>
                <strong>{formatNumber(mokoRisk.rainLast4Weeks)} mm</strong>
                <span>Lluvia últimas 4 semanas</span>
              </div>
              <div>
                <strong>{formatNumber(mokoRisk.surplus)} mm</strong>
                <span>Exceso hídrico</span>
              </div>
            </div>
            <div className="sigatoka-factors">
              <span className="sigatoka-factors__title">Factores observados</span>
              <ul className="sigatoka-factor-list">
                {mokoRisk.factors.map((factor, index) => (
                  <li className="sigatoka-factor" key={`moko-factor-${index}`}>
                    <div className="sigatoka-factor__info">
                      <strong>{factor.label}</strong>
                      <span className="sigatoka-factor__hint">{factor.hint}</span>
                    </div>
                    <div className="sigatoka-factor__value">
                      <strong>
                        {formatNumber(factor.value)}
                        {factor.unit ? ` ${factor.unit}` : ''}
                      </strong>
                      <span
                        className={`sigatoka-factor__badge sigatoka-factor__badge-${factor.pressure}`}
                      >
                        {factor.pressure === 'high'
                          ? 'Alta'
                          : factor.pressure === 'medium'
                          ? 'Media'
                          : 'Baja'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ul className="sigatoka-advice">
            {mokoRisk.recommendations.map((item, index) => (
              <li key={`moko-advice-${index}`}>
                <Icon name="CheckCircle2" size={14} />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {floodRisk && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="Waves" size={20} />
            <div>
              <h2>Riesgo de inundación</h2>
              <p>
                Estimado meteorológico basado en lluvia y excedente hídrico recientes. No sustituye monitoreo de campo.
              </p>
            </div>
          </div>
          <div className={`flood-status flood-${floodRisk.riskLevel}`}>
            <div className="flood-badge">
              {floodRisk.riskLevel === 'high'
                ? 'Alta presión'
                : floodRisk.riskLevel === 'medium'
                ? 'Presión moderada'
                : 'Presión baja'}
            </div>
            <div className="flood-metrics">
              <div>
                <strong>{formatNumber(floodRisk.rainOneWeek)} mm</strong>
                <span>Lluvia última semana</span>
              </div>
              <div>
                <strong>{formatNumber(floodRisk.rainFourWeeks)} mm</strong>
                <span>Lluvia últimas 4 semanas</span>
              </div>
              <div>
                <strong>{formatNumber(floodRisk.surplus)} mm</strong>
                <span>Excedente hídrico vs ET₀</span>
              </div>
            </div>
          </div>
          <ul className="flood-advice">
            {floodRisk.riskLevel !== 'low' ? (
              <>
                <li>
                  <Icon name="CheckCircle2" size={14} />
                  Verifica drenajes, desagües y bombas antes de nuevos eventos.
                </li>
                <li>
                  <Icon name="CheckCircle2" size={14} />
                  Prioriza lotes bajos y zonas con antecedentes de anegamiento.
                </li>
              </>
            ) : (
              <li>
                <Icon name="CheckCircle2" size={14} />
                Condiciones normales. Mantén inspecciones rutinarias.
              </li>
            )}
          </ul>
        </section>
      )}

      {weeklyTableRows.length > 0 && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="Table2" size={20} />
            <div>
              <h2>Últimas seis semanas</h2>
              <p>Resumen semanal (ISO-week) del año en curso.</p>
            </div>
          </div>
          <div className="producer-climate__table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>T° máx (°C)</th>
                  <th>T° mín (°C)</th>
                  <th>Precipitación (mm)</th>
                  <th>ET₀ (mm)</th>
                  <th>Viento máx (km/h)</th>
                </tr>
              </thead>
              <tbody>
                {weeklyTableRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td>{row.tmax ? formatNumber(row.tmax) : '—'}</td>
                    <td>{row.tmin ? formatNumber(row.tmin) : '—'}</td>
                    <td>{formatNumber(row.rain)}</td>
                    <td>{formatNumber(row.et0)}</td>
                    <td>{formatNumber(row.wind)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {rainfallChartOptions && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="CloudRainWind" size={20} />
            <div>
              <h2>Lluvia semanal</h2>
              <p>Analiza campañas anteriores o compara diferencias semana a semana.</p>
            </div>
          </div>
          {availableYears.length > 0 && (
            <div className="producer-climate__chart-toolbar">
              {renderYearSelector('rain', rainViewMode, rainSelectedYears)}
              <div className="producer-climate__view-toggle">
                <button
                  type="button"
                  className={rainViewMode === 'absolute' ? 'is-active' : ''}
                  onClick={() => setRainViewMode('absolute')}
                >
                  Serie histórica
                </button>
                <button
                  type="button"
                  className={rainViewMode === 'delta' ? 'is-active' : ''}
                  onClick={() => setRainViewMode('delta')}
                  disabled={!canShowDelta}
                >
                  Diferencia semanal
                </button>
              </div>
              {rainViewMode === 'delta' && canShowDelta && (
                <div className="producer-climate__delta-selects">
                  <label>
                    Año principal
                    <select
                      value={rainPrimaryYear ?? ''}
                      onChange={(e) =>
                        setRainPrimaryYear(Number(e.target.value))
                      }
                    >
                      {availableYears.map((year) => (
                        <option key={`primary-${year}`} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Vs
                    <select
                      value={rainComparisonYear ?? ''}
                      onChange={(e) =>
                        setRainComparisonYear(Number(e.target.value))
                      }
                    >
                      {availableYears.map((year) => (
                        <option key={`comparison-${year}`} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          )}
          <HighchartsReact highcharts={Highcharts} options={rainfallChartOptions} />
        </section>
      )}

      {temperatureChartOptions && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="Thermometer" size={20} />
            <div>
              <h2>Temperatura máxima semanal</h2>
              <p>Evalúa tendencias térmicas o diferencias por campaña.</p>
            </div>
          </div>
          {availableYears.length > 0 && (
            <div className="producer-climate__chart-toolbar">
              {renderYearSelector('temp', tempViewMode, tempSelectedYears)}
              <div className="producer-climate__view-toggle">
                <button
                  type="button"
                  className={tempViewMode === 'absolute' ? 'is-active' : ''}
                  onClick={() => setTempViewMode('absolute')}
                >
                  Serie histórica
                </button>
                <button
                  type="button"
                  className={tempViewMode === 'delta' ? 'is-active' : ''}
                  onClick={() => setTempViewMode('delta')}
                  disabled={!canShowDelta}
                >
                  Diferencia semanal
                </button>
              </div>
              {tempViewMode === 'delta' && canShowDelta && (
                <div className="producer-climate__delta-selects">
                  <label>
                    Año principal
                    <select
                      value={tempPrimaryYear ?? ''}
                      onChange={(e) =>
                        setTempPrimaryYear(Number(e.target.value))
                      }
                    >
                      {availableYears.map((year) => (
                        <option key={`temp-primary-${year}`} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Vs
                    <select
                      value={tempComparisonYear ?? ''}
                      onChange={(e) =>
                        setTempComparisonYear(Number(e.target.value))
                      }
                    >
                      {availableYears.map((year) => (
                        <option key={`temp-comparison-${year}`} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          )}
          <HighchartsReact highcharts={Highcharts} options={temperatureChartOptions} />
        </section>
      )}

      {lightChartOptions && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="Sunrise" size={20} />
            <div>
              <h2>Horas luz estimadas</h2>
              <p>
                Conversión de radiación solar (shortwave) a horas luz promedio por día. Se asume
                1.2 MJ/m² ≈ 1 hora efectiva.
              </p>
            </div>
          </div>
          {availableYears.length > 0 && (
            <div className="producer-climate__chart-toolbar">
              {renderYearSelector('light', 'absolute', lightSelectedYears)}
            </div>
          )}
          <HighchartsReact highcharts={Highcharts} options={lightChartOptions} />
        </section>
      )}

      {meteogramOptions && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="CloudSunRain" size={20} />
            <div>
              <h2>Meteorograma (7 días)</h2>
              <p>
                Proyección diaria de lluvia, temperaturas extremas y viento máximo para planificar
                cuadrillas y labores.
              </p>
            </div>
          </div>
          <HighchartsReact highcharts={Highcharts} options={meteogramOptions} />
        </section>
      )}

      {irrigationChartOptions && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="Droplets" size={20} />
            <div>
              <h2>Lámina de riego semanal</h2>
              <p>
                Aplicamos la guía FAO-56: ETc = Kc × ET₀ y restamos la lluvia efectiva
                (1 mm ≈ 10 m³/ha) para estimar la lámina neta a reponer.
              </p>
            </div>
          </div>
          <div className="producer-climate__chart-toolbar">
            <div>
              <span className="producer-climate__chart-label">
                Etapa del cultivo (Kc)
              </span>
              <div className="producer-climate__chip-group">
                {STAGE_OPTIONS.map((stage) => (
                  <button
                    key={stage.value}
                    type="button"
                    className={`producer-climate__chip-button ${
                      stage.value === kcStage ? 'is-active' : ''
                    }`}
                    onClick={() => setKcStage(stage.value)}
                  >
                    {stage.label} · Kc {stage.kc}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {irrigationSummary && (
            <>
              <div className="producer-climate__irrigation-summary">
                <div>
                  <span>Acumulado {currentIsoInfo.isoYear}</span>
                  <strong>{formatNumber(irrigationSummary.currentTotal)} mm</strong>
                  {irrigationSummary.mmPerDayCurrent !== null && (
                    <small>
                      {formatNumber(irrigationSummary.mmPerDayCurrent, {
                        maximumFractionDigits: 2,
                      })}{' '}
                      mm/día promedio
                    </small>
                  )}
                  {irrigationSummary.m3PerHaCurrent !== null && (
                    <small>
                      {formatNumber(irrigationSummary.m3PerHaCurrent, {
                        maximumFractionDigits: 0,
                      })}{' '}
                      m³/ha/mes
                    </small>
                  )}
                </div>
                <div>
                  <span>Acumulado {previousIsoYear}</span>
                  <strong>{formatNumber(irrigationSummary.previousTotal)} mm</strong>
                  {irrigationSummary.mmPerDayPrevious !== null && (
                    <small>
                      {formatNumber(irrigationSummary.mmPerDayPrevious, {
                        maximumFractionDigits: 2,
                      })}{' '}
                      mm/día promedio
                    </small>
                  )}
                  {irrigationSummary.m3PerHaPrevious !== null && (
                    <small>
                      {formatNumber(irrigationSummary.m3PerHaPrevious, {
                        maximumFractionDigits: 0,
                      })}{' '}
                      m³/ha/mes
                    </small>
                  )}
                </div>
                <div>
                  <span>Diferencia</span>
                  <strong
                    className={
                      irrigationSummary.delta >= 0 ? 'positive-text' : 'negative-text'
                    }
                  >
                    {irrigationSummary.delta >= 0 ? '+' : ''}
                    {formatNumber(irrigationSummary.delta)} mm
                  </strong>
                  {irrigationSummary.mmPerDayDelta !== null && (
                    <small
                      className={
                        irrigationSummary.mmPerDayDelta >= 0
                          ? 'positive-text'
                          : 'negative-text'
                      }
                    >
                      {irrigationSummary.mmPerDayDelta >= 0 ? '+' : ''}
                      {formatNumber(irrigationSummary.mmPerDayDelta, {
                        maximumFractionDigits: 2,
                      })}{' '}
                      mm/día
                    </small>
                  )}
                  {irrigationSummary.m3PerHaDelta !== null && (
                    <small
                      className={
                        irrigationSummary.m3PerHaDelta >= 0
                          ? 'positive-text'
                          : 'negative-text'
                      }
                    >
                      {irrigationSummary.m3PerHaDelta >= 0 ? '+' : ''}
                      {formatNumber(irrigationSummary.m3PerHaDelta, {
                        maximumFractionDigits: 0,
                      })}{' '}
                      m³/ha/mes
                    </small>
                  )}
                </div>
              </div>
              <div className="producer-climate__irrigation-volume">
                <div>
                  <span>ETc acumulada {currentIsoInfo.isoYear}</span>
                  <strong>
                    {irrigationSummary.etcCurrent !== null
                      ? `${formatNumber(irrigationSummary.etcCurrent)} mm`
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span>Lluvia considerada {currentIsoInfo.isoYear}</span>
                  <strong>
                    {irrigationSummary.rainCurrent !== null
                      ? `${formatNumber(irrigationSummary.rainCurrent)} mm`
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span>ETc acumulada {previousIsoYear}</span>
                  <strong>
                    {irrigationSummary.etcPrevious !== null
                      ? `${formatNumber(irrigationSummary.etcPrevious)} mm`
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span>Lluvia considerada {previousIsoYear}</span>
                  <strong>
                    {irrigationSummary.rainPrevious !== null
                      ? `${formatNumber(irrigationSummary.rainPrevious)} mm`
                      : '—'}
                  </strong>
                </div>
                <p>
                  La lámina neta se calcula como ETc (Kc × ET₀) menos la lluvia efectiva sin
                  permitir valores negativos. Usa estos totales como referencia; 1 mm equivale
                  a ~10 m³/ha y el promedio mensual (m³/ha/mes) considera 4 semanas operativas.
                </p>
              </div>
            </>
          )}
          <HighchartsReact highcharts={Highcharts} options={irrigationChartOptions} />
        </section>
      )}

      {gddChartOptions && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="ThermometerSun" size={20} />
            <div>
              <h2>Grados día acumulados</h2>
              <p>Evalúa el avance térmico del cultivo comparando campañas.</p>
            </div>
          </div>
          <div className="producer-climate__chart-toolbar">
            <div>
              <span className="producer-climate__chart-label">Base térmica</span>
              <div className="producer-climate__chip-group">
                {GDD_BASE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`producer-climate__chip-button ${
                      option.value === gddBase ? 'is-active' : ''
                    }`}
                    onClick={() => setGddBase(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {gddSummary && (
            <div className="producer-climate__irrigation-summary">
              <div>
                <span>{currentIsoInfo.isoYear}</span>
                <strong>{formatNumber(gddSummary.currentTotal)} GDD</strong>
              </div>
              <div>
                <span>{previousIsoYear}</span>
                <strong>{formatNumber(gddSummary.previousTotal)} GDD</strong>
              </div>
              <div>
                <span>Diferencia</span>
                <strong
                  className={gddSummary.delta >= 0 ? 'positive-text' : 'negative-text'}
                >
                  {gddSummary.delta >= 0 ? '+' : ''}
                  {formatNumber(gddSummary.delta)} GDD
                </strong>
              </div>
            </div>
          )}
          <HighchartsReact highcharts={Highcharts} options={gddChartOptions} />
        </section>
      )}

      {stressMonitor && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="ThermometerSnowflake" size={20} />
            <div>
              <h2>Monitoreo estrés térmico/hídrico</h2>
              <p>Combinamos GDD y balance hídrico para adelantarnos a desbalances del cultivo.</p>
            </div>
          </div>
          <div className="stress-grid">
            <article className={`stress-card stress-${stressMonitor.thermalStatus}`}>
              <span>Velocidad térmica</span>
              <strong>
                {stressMonitor.thermalStatus === 'accelerated'
                  ? 'Acelerada'
                  : stressMonitor.thermalStatus === 'slow'
                  ? 'Lenta'
                  : 'Normal'}
              </strong>
              <small>
                Δ GDD vs. campaña pasada:{' '}
                {stressMonitor.thermalDelta >= 0 ? '+' : ''}
                {formatNumber(stressMonitor.thermalDelta)} GDD
              </small>
            </article>
            <article className={`stress-card stress-${stressMonitor.hydricStatus}`}>
              <span>Balance hídrico</span>
              <strong>
                {stressMonitor.hydricStatus === 'deficit'
                  ? 'Déficit'
                  : stressMonitor.hydricStatus === 'surplus'
                  ? 'Excedente'
                  : 'Balanceado'}
              </strong>
              <small>
                Δ (Lluvia - ET₀) + lámina:{' '}
                {formatNumber(stressMonitor.hydricDelta + stressMonitor.irrigationDelta)} mm
              </small>
            </article>
          </div>
          <ul className="sigatoka-advice">
            {stressMonitor.recommendations.map((item, index) => (
              <li key={`stress-advice-${index}`}>
                <Icon name="CheckCircle2" size={14} />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {baggingCohorts.length > 0 && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="Layers" size={20} />
            <div>
              <h2>Seguimiento de enfundes</h2>
              <p>
                Avance semanal hacia corte (meta {gddTarget} GDD · base {gddBase} °C). Se estiman
                semanas restantes usando el promedio térmico reciente.
              </p>
            </div>
          </div>
          <div className="bagging-table-wrapper">
            {overTargetCohorts.length > 0 && (
              <div className="producer-climate__banner producer-climate__banner--warning">
                <Icon name="AlertOctagon" size={18} />
                {overTargetCohorts.length === 1
                  ? `1 enfunde superó la meta térmica por más de 10 %.`
                  : `${overTargetCohorts.length} enfundes superaron la meta térmica por más de 10 %.`}{" "}
                Programa corte para evitar sobre-maduración.
              </div>
            )}
            <table className="bagging-table">
              <thead>
                <tr>
                  <th>Semana de enfunde</th>
                  <th>GDD acumulados</th>
                  <th>Progreso</th>
                  <th>Semanas estimadas restantes</th>
                </tr>
              </thead>
              <tbody>
                {baggingCohorts.map((cohort) => (
                  <tr key={cohort.key}>
                    <td>{cohort.weekLabel}</td>
                    <td>{formatNumber(cohort.cumulative)} GDD</td>
                    <td>
                      <div className={`bagging-progress ${cohort.progress >= 110 ? 'is-over' : ''}`}>
                        <div className="bagging-progress__bar">
                          <span style={{ width: `${Math.min(cohort.progress, 150)}%` }} />
                        </div>
                        <div className="bagging-progress__legend">
                          <small>
                            {cohort.progress >= 100
                              ? cohort.progress >= 110
                                ? `${Math.round(cohort.progress)}% · Sobre meta`
                                : 'Listo'
                              : `${Math.round(cohort.progress)}%`}
                          </small>
                          {cohort.weeksSinceTarget > 0 && (
                            <small className="over-target-note">
                              {formatNumber(cohort.weeksSinceTarget, { maximumFractionDigits: 1 })}{' '}
                              sem post-meta
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {cohort.weeksRemaining > 0
                        ? `≈ ${formatNumber(cohort.weeksRemaining, {
                            maximumFractionDigits: 1,
                          })} sem`
                        : 'Listo para corte'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {forecastOperations.length > 0 && (
        <section className="producer-climate__card">
          <div className="producer-climate__card-header">
            <Icon name="CalendarClock" size={20} />
            <div>
              <h2>Planificador de labores (7 días)</h2>
              <p>
                Estados sugeridos para riego, aplicaciones foliares y cosecha según el pronóstico.
              </p>
            </div>
          </div>
          {dryWindow ? (
            <div className="producer-climate__forecast-banner">
              <Icon name="CheckCircle2" size={18} />
              Ventana seca sugerida:{' '}
              {formatDateShort(dryWindow.start)} – {formatDateShort(dryWindow.end)}
            </div>
          ) : (
            <div className="producer-climate__forecast-banner warning">
              <Icon name="Info" size={18} />
              Sin ventana seca (≥3 días) en los próximos 7 días.
            </div>
          )}
          <div className="forecast-info">
            <Icon name="Info" size={16} />
            <span>
              Foliar ideal: lluvia &lt; 1 mm y viento &lt; 18 km/h. Riego recomendado si la lluvia &lt; 5 mm.
              Labores culturales en campo se suspenden con lluvias &gt; 10 mm o vientos &gt; 38 km/h.
            </span>
          </div>
          <div className="forecast-table-wrapper">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>T° máx</th>
                  <th>T° mín</th>
                  <th>Lluvia</th>
                  <th>Viento</th>
                  <th>Aplicación foliar</th>
                  <th>Riego</th>
                  <th>Labores culturales</th>
                </tr>
              </thead>
              <tbody>
                {forecastOperations.map(day => (
                  <tr key={day.date}>
                    <td>{formatDateShort(day.date)}</td>
                    <td>{formatNumber(day.max)}°C</td>
                    <td>{formatNumber(day.min)}°C</td>
                    <td>{formatNumber(day.rain)} mm</td>
                    <td>{formatNumber(day.wind)} km/h</td>
                    <td>
                      <span className={`operation-pill status-${day.spraying}`}>
                        {day.spraying === 'ideal'
                          ? 'Ideal'
                          : day.spraying === 'caution'
                          ? 'Precaución'
                          : 'No recomendado'}
                      </span>
                    </td>
                    <td>
                      <span className={`operation-pill status-${day.irrigation}`}>
                        {day.irrigation === 'ideal'
                          ? 'Programar'
                          : day.irrigation === 'caution'
                          ? 'Verificar suelo'
                          : 'No necesario'}
                      </span>
                    </td>
                    <td>
                      <span className={`operation-pill status-${day.cultural}`}>
                        {day.cultural === 'ideal'
                          ? 'OK'
                          : day.cultural === 'caution'
                          ? 'Precaución'
                          : 'Evitar'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {error && (
        <div className="producer-climate__banner producer-climate__banner--error">
          <Icon name="AlertTriangle" size={18} /> {error}
        </div>
      )}
    </div>
  );
};

export default ProducerClimateLab;
