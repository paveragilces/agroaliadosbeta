import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, LayersControl } from 'react-leaflet';
import * as turf from '@turf/turf';
import Icon from '../Icon';
import { ICONS } from '../../../config/icons';
import './ParcelDesigner.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

const DEFAULT_CENTER = [-2.170998, -79.922356];
const COLOR_PALETTE = ['#0F9F6E', '#0D9488', '#0891B2', '#6366F1', '#F97316', '#DC2626', '#8B5CF6'];
const DEFAULT_DENSITY = 1700; // Banano promedio por ha

const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(15, 107, 70, ${alpha})`;
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  if (Number.isNaN(bigint)) return `rgba(15, 107, 70, ${alpha})`;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const safeAreaHa = geojson => {
  if (!geojson) return 0;
  try {
    return turf.area(geojson) / 10000;
  } catch {
    return 0;
  }
};

const buildLatLngStructure = geojson => {
  if (!geojson?.geometry) return null;
  const { type, coordinates } = geojson.geometry;

  const mapRing = ring =>
    ring
      .map(([lng, lat]) => (Number.isFinite(lat) && Number.isFinite(lng) ? L.latLng(lat, lng) : null))
      .filter(Boolean);

  const convertPolygon = polygonCoords =>
    polygonCoords
      .map(mapRing)
      .filter(ring => ring.length);

  if (type === 'Polygon') {
    const polygon = convertPolygon(coordinates);
    return polygon.length ? { latLngs: polygon, isMulti: false } : null;
  }

  if (type === 'MultiPolygon') {
    const multi = coordinates
      .map(convertPolygon)
      .filter(polygon => polygon.length);
    return multi.length ? { latLngs: multi, isMulti: true } : null;
  }

  return null;
};

const ParcelDesigner = ({
  boundary,
  initialLots = [],
  initialGuide = null,
  onChange,
  densityPerHectare = DEFAULT_DENSITY,
}) => {
  const [lots, setLots] = useState([]);
  const [guideData, setGuideData] = useState(initialGuide);
  const [statusMessage, setStatusMessage] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [autoSeedSignature, setAutoSeedSignature] = useState(null);
  const mapRef = useRef(null);
  const featureGroupRef = useRef(null);
  const guideLayerRef = useRef(null);
  const prevBoundarySignatureRef = useRef(null);

  const boundaryFeature = boundary?.geojson || boundary || null;
  const boundarySignature = useMemo(
    () =>
      boundaryFeature
        ? JSON.stringify(boundaryFeature.geometry || boundaryFeature)
        : null,
    [boundaryFeature]
  );

  const center = useMemo(() => {
    if (boundary?.centroid?.lat && boundary?.centroid?.lon) {
      return [boundary.centroid.lat, boundary.centroid.lon];
    }
    if (boundaryFeature) {
      try {
        const centroid = turf.centerOfMass(boundaryFeature);
        const [lon, lat] = centroid?.geometry?.coordinates || [];
        if (lat && lon) return [lat, lon];
      } catch {
        // ignorar y usar default
      }
    }
    return DEFAULT_CENTER;
  }, [boundary, boundaryFeature]);

  const setLayerStyle = useCallback((layer, color) => {
    if (!layer?.setStyle) return;
    layer.setStyle({
      color,
      weight: 2,
      opacity: 0.9,
      fillColor: hexToRgba(color, 0.25),
      fillOpacity: 0.35,
    });
  }, []);

  const syncLotsWithLayers = useCallback(() => {
    if (!featureGroupRef.current) {
      setLots([]);
      return;
    }
    const updatedLots = [];
    featureGroupRef.current.eachLayer(layer => {
      const meta = layer.__lotMeta;
      if (!meta || meta.isGuide) return;
      const geojson = layer.toGeoJSON();
      const areaHa = safeAreaHa(geojson);
      updatedLots.push({
        ...meta,
        areaHectares: areaHa,
        areaSqMeters: areaHa * 10000,
        geojson,
      });
    });
    setLots(updatedLots);
  }, []);

  const applyGuideLayer = useCallback(
    geojson => {
      if (!featureGroupRef.current) return;
      if (guideLayerRef.current) {
        featureGroupRef.current.removeLayer(guideLayerRef.current);
        guideLayerRef.current = null;
      }
      if (!geojson) return;
      const structure = buildLatLngStructure(geojson);
      if (!structure) return;
      const layer = L.polygon(structure.latLngs, {
        color: '#0f6b46',
        weight: 2,
        dashArray: '6 4',
        fillColor: 'rgba(15, 107, 70, 0.08)',
        fillOpacity: 0.12,
      });
      layer.__lotMeta = { id: 'guide', isGuide: true };
      featureGroupRef.current.addLayer(layer);
      guideLayerRef.current = layer;
    },
    []
  );

  const seedInitialLots = useCallback(() => {
    if (!featureGroupRef.current) return;
    featureGroupRef.current.clearLayers();
    initialLots.forEach((lot, index) => {
      if (!lot?.geojson) return;
      const areaHa = lot.areaHectares ?? safeAreaHa(lot.geojson);
      const meta = {
        id: lot.id || `lot-${Date.now()}-${index}`,
        name: lot.name || `Lote ${String(index + 1).padStart(2, '0')}`,
        color: lot.color || COLOR_PALETTE[index % COLOR_PALETTE.length],
        plantCount:
          typeof lot.plantCount === 'number'
            ? lot.plantCount
            : Math.round(areaHa * densityPerHectare),
      };
      const geoLayer = L.geoJSON(lot.geojson, {
        style: {
          color: meta.color,
          weight: 2,
          fillColor: hexToRgba(meta.color, 0.25),
          fillOpacity: 0.35,
        },
      });
      geoLayer.eachLayer(layer => {
        layer.__lotMeta = meta;
        featureGroupRef.current.addLayer(layer);
      });
    });
    syncLotsWithLayers();
  }, [densityPerHectare, initialLots, syncLotsWithLayers]);

  useEffect(() => {
    seedInitialLots();
  }, [seedInitialLots]);

  useEffect(() => {
    if (!mapReady) return;
    applyGuideLayer(guideData);
  }, [applyGuideLayer, guideData, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    const prevSignature = prevBoundarySignatureRef.current;
    if (prevSignature === boundarySignature) return;

    if (!boundarySignature) {
      featureGroupRef.current?.clearLayers();
      setLots([]);
      setGuideData(null);
      guideLayerRef.current = null;
      setAutoSeedSignature(null);
      setStatusMessage('Contorno eliminado. Dibuja el perímetro para activar la parcelación.');
    } else if (prevSignature && boundarySignature !== prevSignature) {
      featureGroupRef.current?.clearLayers();
      setLots([]);
      setGuideData(null);
      guideLayerRef.current = null;
      setAutoSeedSignature(null);
      setStatusMessage('Actualizaste el contorno. Importa el nuevo perímetro antes de parcelar.');
    }
    prevBoundarySignatureRef.current = boundarySignature;
  }, [boundarySignature, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !boundaryFeature) return;
    const boundaryLayer = L.geoJSON(boundaryFeature);
    const bounds = boundaryLayer.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [24, 24] });
    }
  }, [boundaryFeature]);

  const isInsideBoundary = useCallback(
    geojson => {
      if (!boundaryFeature) return true;
      try {
        return (
          turf.booleanWithin(geojson, boundaryFeature) ||
          turf.booleanContains(boundaryFeature, geojson)
        );
      } catch {
        return true;
      }
    },
    [boundaryFeature]
  );

  const trimAgainstExistingLots = useCallback(
    geojson => {
      if (!featureGroupRef.current) return { geojson, trimmed: false };
      let current = geojson;
      let trimmed = false;
      const layers = featureGroupRef.current.getLayers();
      for (const layer of layers) {
        if (!current) break;
        if (!layer.__lotMeta || layer.__lotMeta.isGuide) continue;
        try {
          const layerGeo = layer.toGeoJSON();
          const beforeArea = safeAreaHa(current);
          const diff = turf.difference(current, layerGeo);
          if (!diff) {
            current = null;
            trimmed = true;
            break;
          }
          const afterArea = safeAreaHa(diff);
          if (afterArea > 0 && Math.abs(afterArea - beforeArea) > 0.0001) {
            current = diff;
            trimmed = true;
          }
        } catch {
          // ignorar intersecciones invalidas
        }
      }
      return { geojson: current, trimmed };
    },
    []
  );

  const importBoundaryPolygon = useCallback(
    (options = {}) => {
      const { auto = false, asGuide = auto, resetExisting = false } = options;
      if (!boundaryFeature || !featureGroupRef.current) return;
      const areaHa = safeAreaHa(boundaryFeature);
      if (!areaHa) {
        setStatusMessage('No pudimos calcular el área del contorno. Intenta dibujarlo nuevamente.');
        return;
      }
      if (resetExisting) {
        featureGroupRef.current.clearLayers();
        setLots([]);
        guideLayerRef.current = null;
      }
      const existingLots = featureGroupRef.current
        .getLayers()
        .filter(layer => layer.__lotMeta && !layer.__lotMeta.isGuide);
      const color = COLOR_PALETTE[existingLots.length % COLOR_PALETTE.length];
      const meta = {
        id: `lot-${Date.now()}`,
        name: asGuide ? 'Guía del contorno' : `Lote ${String(existingLots.length + 1).padStart(2, '0')}`,
        color,
        plantCount: Math.round(areaHa * densityPerHectare),
        isGuide: asGuide,
      };
      if (asGuide && guideLayerRef.current) {
        featureGroupRef.current.removeLayer(guideLayerRef.current);
        guideLayerRef.current = null;
      }
      const layerStyle = asGuide
        ? {
            color: '#0f6b46',
            weight: 2,
            dashArray: '6 4',
            fillColor: 'rgba(15, 107, 70, 0.08)',
            fillOpacity: 0.12,
          }
        : {
            color,
            weight: 2,
            fillColor: hexToRgba(color, 0.25),
            fillOpacity: 0.35,
          };
      const boundaryLayer = L.geoJSON(boundaryFeature, {
        style: layerStyle,
      });
      let inserted = false;
      boundaryLayer.eachLayer(layer => {
        inserted = true;
        layer.__lotMeta = meta;
        if (!asGuide) {
          setLayerStyle(layer, color);
        }
        featureGroupRef.current.addLayer(layer);
        if (asGuide) {
          guideLayerRef.current = layer;
        }
      });
      if (!inserted) return;
      if (asGuide) {
        setGuideData(boundaryFeature);
        setStatusMessage(
          auto
            ? 'Contorno importado como guía. Dibuja tus lotes dentro de esta silueta.'
            : 'El contorno se marcó como guía. Puedes duplicarlo o trazar lotes más pequeños dentro.'
        );
      } else {
        setStatusMessage('Contorno duplicado como lote. Ajusta los vértices según necesites.');
        syncLotsWithLayers();
      }
    },
    [boundaryFeature, densityPerHectare, setLayerStyle, syncLotsWithLayers]
  );

  useEffect(() => {
    if (!boundaryFeature || !boundarySignature || !mapReady) return;
    if (autoSeedSignature === boundarySignature) return;
    importBoundaryPolygon({ auto: true, asGuide: true });
    setAutoSeedSignature(boundarySignature);
  }, [autoSeedSignature, boundaryFeature, boundarySignature, importBoundaryPolygon, mapReady]);

  const handleLotCreated = useCallback(
    event => {
      let layer = event.layer;
      if (!boundaryFeature) {
        featureGroupRef.current?.removeLayer(layer);
        setStatusMessage('Dibuja primero el contorno de la finca para añadir lotes internos.');
        return;
      }
      let geojson = layer.toGeoJSON();
      let clippedToBoundary = false;
      if (!isInsideBoundary(geojson)) {
        const clipped = boundaryFeature ? turf.intersect(geojson, boundaryFeature) : null;
        const clippedArea = safeAreaHa(clipped);
        if (clipped && clippedArea > 0) {
          const structure = buildLatLngStructure(clipped);
          if (structure) {
            layer.setLatLngs(structure.latLngs);
            layer.redraw();
            geojson = clipped;
            clippedToBoundary = true;
          }
        }
        if (!clippedToBoundary) {
          featureGroupRef.current?.removeLayer(layer);
          setStatusMessage('El lote debe permanecer dentro del polígono del predio.');
          return;
        }
      }
      const { geojson: nonOverlapping, trimmed: trimmedByLots } = trimAgainstExistingLots(geojson);
      if (!nonOverlapping || safeAreaHa(nonOverlapping) <= 0) {
        featureGroupRef.current?.removeLayer(layer);
        setStatusMessage('Este lote ya está cubierto por otro. Prueba reducir el área a una zona libre.');
        return;
      }
      if (trimmedByLots) {
        const structure = buildLatLngStructure(nonOverlapping);
        if (structure) {
          layer.setLatLngs(structure.latLngs);
          layer.redraw();
        }
        geojson = nonOverlapping;
      }
      const areaHa = safeAreaHa(geojson);
      const layerCount = featureGroupRef.current
        ? featureGroupRef.current
            .getLayers()
            .filter(l => l.__lotMeta && !l.__lotMeta.isGuide).length
        : 0;
      const color = COLOR_PALETTE[layerCount % COLOR_PALETTE.length];
      const meta = {
        id: `lot-${Date.now()}`,
        name: `Lote ${String(layerCount + 1).padStart(2, '0')}`,
        color,
        plantCount: Math.round(areaHa * densityPerHectare),
      };
      layer.__lotMeta = meta;
      setLayerStyle(layer, color);
      setStatusMessage(
        clippedToBoundary || trimmedByLots
          ? 'Ajustamos el lote para cumplir con el perímetro y los lotes existentes.'
          : 'Lote registrado. Ajusta nombre o plantas desde la lista inferior.'
      );
      syncLotsWithLayers();
    },
    [boundaryFeature, densityPerHectare, isInsideBoundary, setLayerStyle, syncLotsWithLayers, trimAgainstExistingLots]
  );

  const handleRemoveLot = useCallback(lotId => {
    if (!featureGroupRef.current) return;
    featureGroupRef.current.eachLayer(layer => {
      if (layer.__lotMeta?.id === lotId) {
        featureGroupRef.current.removeLayer(layer);
      }
    });
    syncLotsWithLayers();
      setStatusMessage('Lote eliminado del plano.');
    }, [syncLotsWithLayers]);

  const handleLotsEdited = useCallback(() => {
    syncLotsWithLayers();
    setStatusMessage('Actualizaste los vértices del lote. Revisa el número de plantas estimadas.');
  }, [syncLotsWithLayers]);

  const handleLotsDeleted = useCallback(() => {
    syncLotsWithLayers();
    setStatusMessage('Se eliminaron los lotes seleccionados. Importa el contorno si necesitas empezar de cero.');
  }, [syncLotsWithLayers]);

  const handleNameChange = useCallback((lotId, value) => {
    setLots(prev =>
      prev.map(lot => (lot.id === lotId ? { ...lot, name: value || lot.name } : lot))
    );
    featureGroupRef.current?.eachLayer(layer => {
      if (layer.__lotMeta?.id === lotId) {
        layer.__lotMeta = { ...layer.__lotMeta, name: value || layer.__lotMeta.name };
      }
    });
  }, []);

  const handlePlantChange = useCallback((lotId, value) => {
    const parsed = parseInt(value, 10);
    const nextValue = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setLots(prev =>
      prev.map(lot => (lot.id === lotId ? { ...lot, plantCount: nextValue } : lot))
    );
    featureGroupRef.current?.eachLayer(layer => {
      if (layer.__lotMeta?.id === lotId) {
        layer.__lotMeta = { ...layer.__lotMeta, plantCount: nextValue };
      }
    });
  }, []);

  const handleDuplicateLot = useCallback(
    lotId => {
      const target = lots.find(lot => lot.id === lotId);
      if (!target || !featureGroupRef.current) return;
      const structure = buildLatLngStructure(target.geojson);
      if (!structure) return;
      const offsetLatLngs = structure.latLngs.map(ring =>
        ring.map(point => L.latLng(point.lat + 0.00002, point.lng + 0.00002))
      );
      const newLayer = L.polygon(offsetLatLngs, { color: target.color });
      featureGroupRef.current.addLayer(newLayer);
      handleLotCreated({ layer: newLayer });
      setStatusMessage(`Duplicaste ${target.name}. Ajusta la copia para delimitar el nuevo bloque.`);
    },
    [handleLotCreated, lots]
  );

  useEffect(() => {
    onChange?.({ lots, guide: guideData });
  }, [guideData, lots, onChange]);

  const handleClearLots = useCallback(() => {
    if (!featureGroupRef.current) return;
    featureGroupRef.current.eachLayer(layer => {
      if (layer.__lotMeta && !layer.__lotMeta.isGuide) {
        featureGroupRef.current.removeLayer(layer);
      }
    });
    setLots([]);
    setStatusMessage('Se vaciaron los lotes digitales. Usa el contorno guía para comenzar de nuevo.');
  }, []);

  const stats = useMemo(() => {
    const totalHa = lots.reduce((sum, lot) => sum + (lot.areaHectares || 0), 0);
    const totalPlants = lots.reduce((sum, lot) => sum + (lot.plantCount || 0), 0);
    const coverage = boundary?.areaHectares
      ? (totalHa / boundary.areaHectares) * 100
      : null;
    return {
      totalHa,
      totalPlants,
      coverage,
      count: lots.length,
    };
  }, [boundary, lots]);

  const hasGuide = Boolean(guideLayerRef.current);
  const hasLots = lots.length > 0;

  const mapDisabled = !boundaryFeature;

  return (
    <div className="parcelDesigner">
      <div className="parcelDesigner__toolbar">
        <div className="parcelDesigner__chip">
          <Icon path={ICONS.shape} size={16} />
          Lotes productivos dentro del predio oficial
        </div>
        <span className="parcelDesigner__density">
          Densidad sugerida: {densityPerHectare.toLocaleString('es-EC')} plantas/ha (banano premium)
        </span>
        {boundaryFeature && (
          <button
            type="button"
            className="parcelDesigner__toolbarButton"
            onClick={() => importBoundaryPolygon({ auto: false, asGuide: false })}
          >
            <Icon path={ICONS.shape} size={14} />
            Usar contorno del predio
          </button>
        )}
      </div>
      <div className="parcelDesigner__actionsRow">
        <button
          type="button"
          className="parcelDesigner__ghostButton"
          onClick={() => importBoundaryPolygon({ auto: false, asGuide: true, resetExisting: false })}
          disabled={!boundaryFeature}
        >
          <Icon path={ICONS.shape} size={14} />
          Mostrar contorno guía
        </button>
        <button
          type="button"
          className="parcelDesigner__ghostButton"
          onClick={handleClearLots}
          disabled={!hasLots}
        >
          <Icon path={ICONS.reject} size={14} />
          Limpiar lotes
        </button>
        <span className="parcelDesigner__actionsHint">
          {hasGuide ? 'Guía activa: dibuja dentro de la silueta verde o duplícala como lote.' : 'Activa la guía del contorno para calcar rápidamente tu perímetro.'}
        </span>
      </div>

      <div className="parcelDesigner__mapWrapper">
        <MapContainer
          center={center}
          zoom={16}
          className="parcelDesigner__map"
          whenCreated={mapInstance => {
            mapRef.current = mapInstance;
            setMapReady(true);
          }}
        >
          <LayersControl position="bottomleft">
            <LayersControl.BaseLayer checked name="Mapa base">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satélite">
              <TileLayer
                attribution='Tiles &copy; Esri — Source: Esri, USGS, NOAA'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {boundaryFeature && (
            <GeoJSON
              data={boundaryFeature}
              style={{
                color: '#0f6b46',
                weight: 2,
                dashArray: '6 4',
                fillOpacity: 0,
                opacity: 0.7,
              }}
            />
          )}

          <FeatureGroup ref={featureGroupRef}>
            {!mapDisabled && (
              <EditControl
                position="topright"
                onCreated={handleLotCreated}
                onEdited={handleLotsEdited}
                onDeleted={handleLotsDeleted}
                draw={{
                  polygon: {
                    allowIntersection: false,
                    showArea: true,
                    guidelineDistance: 25,
                    shapeOptions: { color: '#0f9f6e' },
                    drawError: { color: '#b91c1c', timeout: 2500 },
                  },
                  rectangle: false,
                  polyline: false,
                  circle: false,
                  marker: false,
                  circlemarker: false,
                }}
                edit={{
                  edit: true,
                  remove: true,
                }}
              />
            )}
          </FeatureGroup>
        </MapContainer>
        {mapDisabled && (
          <div className="parcelDesigner__mapOverlay">
            <Icon path={ICONS.info} size={18} />
            Dibuja primero el perímetro de la finca en “Ubicación geográfica” para activar estas
            herramientas.
          </div>
        )}
        {!mapDisabled && !hasLots && (
          <div className="parcelDesigner__mapHint">
            <div>
              <strong>¿Cómo empiezo?</strong>
              <ol>
                <li>Activa la guía del contorno si aún no aparece.</li>
                <li>Usa el botón verde del mapa para trazar polígonos dentro del perímetro.</li>
                <li>Asigna nombre y plantas a cada lote desde la lista inferior.</li>
              </ol>
            </div>
          </div>
        )}
        {hasLots && (
          <div className="parcelDesigner__legend">
            <strong>Referencia</strong>
            <ul>
              {lots.map(lot => (
                <li key={lot.id}>
                  <span className="parcelDesigner__legendColor" style={{ backgroundColor: lot.color }} />
                  <div>
                    <span>{lot.name}</span>
                    <small>{lot.areaHectares?.toFixed(2) || '0.00'} ha</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="parcelDesigner__statusRow">
        <p>
          {mapDisabled
            ? 'El diseñador se activa automáticamente cuando se registra el contorno del predio.'
            : 'Dibuja cada lote en el mapa y completa los datos para el registro agronómico.'}
        </p>
        {stats.coverage !== null && (
          <span className="parcelDesigner__coverage">
            Cobertura: {Math.min(stats.coverage, 100).toFixed(1)}% del predio
          </span>
        )}
      </div>

      {statusMessage && (
        <div className="parcelDesigner__statusMessage">
          <Icon path={ICONS.checkCircle} size={16} />
          {statusMessage}
        </div>
      )}

      <div className="parcelDesigner__helper">
        <article>
          <strong>1. Calca tu perímetro</strong>
          <p>Presiona “Usar contorno del predio” para traer el polígono que dibujaste en el paso anterior.</p>
        </article>
        <article>
          <strong>2. Ajusta con precisión</strong>
          <p>Arrastra los vértices o usa el modo edición del mapa para delimitar cada lote sin perder exactitud.</p>
        </article>
        <article>
          <strong>3. Registra densidades</strong>
          <p>Captura las plantas estimadas por lote para preparar reportes productivos y visitas técnicas.</p>
        </article>
      </div>

      <div className="parcelDesigner__statsGrid">
        <div>
          <small>Total de lotes</small>
          <strong>{stats.count}</strong>
        </div>
        <div>
          <small>Área parcelada</small>
          <strong>{stats.totalHa.toFixed(2)} ha</strong>
        </div>
        <div>
          <small>Plantas proyectadas</small>
          <strong>{stats.totalPlants.toLocaleString('es-EC')}</strong>
        </div>
      </div>

      <div className="parcelDesigner__lotList">
        {lots.length === 0 && (
          <div className="parcelDesigner__lotEmpty">
            <Icon path={ICONS.shape} size={22} />
            <div>
              <strong>Sin lotes registrados</strong>
              <p>
                Usa la herramienta de polígono sobre el mapa para digitalizar cada lote de banano.
              </p>
            </div>
          </div>
        )}

        {lots.map(lot => (
          <article key={lot.id} className="parcelDesigner__lotCard">
            <div className="parcelDesigner__lotHeader">
              <span
                className="parcelDesigner__lotSwatch"
                style={{ backgroundColor: lot.color }}
              />
              <input
                type="text"
                value={lot.name}
                onChange={e => handleNameChange(lot.id, e.target.value)}
                className="parcelDesigner__lotName"
                placeholder="Nombre del lote"
              />
              <button
                type="button"
                className="parcelDesigner__lotDuplicate"
                onClick={() => handleDuplicateLot(lot.id)}
                title="Duplicar lote"
              >
                <Icon path={ICONS.layers} size={14} />
              </button>
              <button
                type="button"
                className="parcelDesigner__lotDelete"
                onClick={() => handleRemoveLot(lot.id)}
                aria-label={`Eliminar ${lot.name}`}
              >
                <Icon path={ICONS.reject} size={16} />
              </button>
            </div>
            <div className="parcelDesigner__lotMetrics">
              <div>
                <small>Área</small>
                <strong>{lot.areaHectares?.toFixed(2) || '0.00'} ha</strong>
                <span>{(lot.areaSqMeters || 0).toLocaleString('es-EC')} m²</span>
              </div>
              <div>
                <small>Plantas</small>
                <input
                  type="number"
                  className="parcelDesigner__plantInput"
                  min="0"
                  value={lot.plantCount ?? 0}
                  onChange={e => handlePlantChange(lot.id, e.target.value)}
                />
                <span>{densityPerHectare.toLocaleString('es-EC')} ref.</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ParcelDesigner;
