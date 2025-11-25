import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, LayersControl } from 'react-leaflet';
import Icon from '../Icon';
import { ICONS } from '../../../config/icons';
import './MapPinSelector.css';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import * as turf from '@turf/turf';

const defaultCenter = [-2.170998, -79.922356];
const defaultZoom = 13;

const MapPinSelector = ({
  onLocationSet,
  initialLocation,
  enablePolygonDrawing = false,
  onBoundarySet,
  initialBoundary = null,
}) => {
  const mapRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const [position, setPosition] = useState(initialLocation ? [initialLocation.lat, initialLocation.lon] : defaultCenter);
  const [locationFixed, setLocationFixed] = useState(Boolean(initialLocation));
  const [statusMessage, setStatusMessage] = useState('');
  const [boundarySummary, setBoundarySummary] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.L = L;
    }
  }, []);

  const initialPolygon = useMemo(() => {
    const coords = initialBoundary?.geojson?.geometry?.coordinates?.[0];
    if (Array.isArray(coords) && coords.length >= 3) {
      return coords;
    }
    return null;
  }, [initialBoundary]);

  const updateBoundaryState = useCallback(
    geojson => {
      if (!geojson) {
        setBoundarySummary(null);
        onBoundarySet?.(null);
        return;
      }
      let areaSqMeters = null;
      let areaHectares = null;
      try {
        areaSqMeters = turf.area(geojson);
        areaHectares = areaSqMeters / 10000;
      } catch (error) {
        console.warn('No se pudo calcular el área del polígono', error);
      }
      setBoundarySummary({ areaSqMeters, areaHectares });
      onBoundarySet?.({ geojson, areaSqMeters, areaHectares });
    },
    [onBoundarySet]
  );

  const handleFixLocation = () => {
    const finalCoords = {
      lat: parseFloat(position[0].toFixed(6)),
      lon: parseFloat(position[1].toFixed(6)),
    };
    onLocationSet(finalCoords);
    setLocationFixed(true);
    setStatusMessage('Ubicación fijada correctamente.');
  };

  const handleResetLocation = () => {
    onLocationSet(null);
    setLocationFixed(false);
    setStatusMessage('Arrastra el mapa para ubicar el pin nuevamente.');
  };

  const clearPolygon = useCallback(() => {
    const map = mapRef.current;
    if (map && polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    updateBoundaryState(null);
    setStatusMessage('Contorno limpiado.');
  }, [updateBoundaryState]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !enablePolygonDrawing) return;

    try {
      map.pm?.addControls({
        position: 'topright',
        drawMarker: false,
        drawCircle: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: false,
        drawText: false,
        drawPolygon: true,
        editMode: true,
        dragMode: false,
        cutPolygon: false,
        removalMode: true,
      });

      const handleCreate = e => {
        const layer = e?.layer;
        if (!layer?.toGeoJSON) return;
        if (polygonLayerRef.current) {
          map.removeLayer(polygonLayerRef.current);
        }
        polygonLayerRef.current = layer;
        updateBoundaryState(layer.toGeoJSON());
        setStatusMessage('Polígono registrado.');
        map.pm?.disableDraw();
      };

      const handleEdit = e => {
        const layers = e?.layers;
        if (!layers) return;
        layers.eachLayer(layer => {
          if (layer?.toGeoJSON) {
            polygonLayerRef.current = layer;
            updateBoundaryState(layer.toGeoJSON());
          }
        });
        setStatusMessage('Contorno actualizado.');
      };

      const handleRemove = () => {
        clearPolygon();
        setStatusMessage('Contorno eliminado.');
      };

      map.on('pm:create', handleCreate);
      map.on('pm:edit', handleEdit);
      map.on('pm:remove', handleRemove);

      if (initialPolygon) {
        const layer = L.polygon(initialPolygon, { color: '#0f9f6e', weight: 2 });
        layer.addTo(map);
        polygonLayerRef.current = layer;
        updateBoundaryState(layer.toGeoJSON());
        map.fitBounds(layer.getBounds(), { padding: [24, 24] });
      }

      return () => {
        map.off('pm:create', handleCreate);
        map.off('pm:edit', handleEdit);
        map.off('pm:remove', handleRemove);
        map.pm?.removeControls();
        clearPolygon();
      };
    } catch (error) {
      console.error('Error inicializando Geoman', error);
      setStatusMessage('Dibujo deshabilitado temporalmente.');
    }
  }, [enablePolygonDrawing, initialPolygon, updateBoundaryState, clearPolygon, mapReady]);

  const onMoveEnd = useCallback(e => {
    const newCenter = e.target.getCenter();
    setPosition([newCenter.lat, newCenter.lng]);
  }, []);

  const areaLabel = useMemo(() => {
    if (!boundarySummary?.areaSqMeters) return null;
    return `${boundarySummary.areaSqMeters.toLocaleString('es-EC', { maximumFractionDigits: 0 })} m² · ${boundarySummary.areaHectares?.toFixed(2)} ha`;
  }, [boundarySummary]);

  const handleStartDraw = () => {
    const map = mapRef.current;
    if (map?.pm) {
      map.pm.enableDraw('Polygon', { snappable: true, snapDistance: 15, allowSelfIntersection: false });
      setStatusMessage('Modo dibujo activo: haz clic en el mapa para trazar el contorno. Botones arriba a la derecha.');
    } else {
      setStatusMessage('Controles de dibujo no disponibles.');
    }
  };

  return (
    <div className="mapPinContainer">
      <div className="mapTopBar">
        <div className="mapStatusChip">
          <Icon path={locationFixed ? ICONS.checkCircle : ICONS.location} size={16} />
          <span>
            {locationFixed
              ? `Ubicación fijada: Lat ${position[0].toFixed(4)}, Lon ${position[1].toFixed(4)}`
              : 'Arrastra el mapa hasta la entrada de tu finca y presiona "Fijar ubicación".'}
          </span>
        </div>
        {locationFixed && (
          <button type="button" className="button button-secondary button-compact" onClick={handleResetLocation}>
            Reubicar
          </button>
        )}
      </div>

      <MapContainer
        center={position}
        zoom={defaultZoom}
        className="leaflet-container"
        onMoveEnd={onMoveEnd}
        whenCreated={mapInstance => {
          mapRef.current = mapInstance;
          mapInstance.getContainer().style.cursor = enablePolygonDrawing ? 'crosshair' : '';
          setMapReady(true);
        }}
      >
        <LayersControl position="bottomleft">
          <LayersControl.BaseLayer checked name="Mapa base">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Vista satelital">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
      </MapContainer>

      <div className="mapPinCenter">
        <Icon path={ICONS.location} size={48} color="#d9534f" />
      </div>

      <div className="mapInstructions">
        <p>
          Arrastra el mapa hasta la entrada principal. {enablePolygonDrawing ? 'Usa las herramientas del mapa (arriba a la derecha) para dibujar, editar o eliminar el contorno.' : ''}
        </p>
      </div>

      {enablePolygonDrawing && (
        <div className="polygonSummary">
          <div className="polygonSummary__info">
            <Icon path={ICONS.shape} size={20} />
            <div>
              <strong>Contorno del predio</strong>
              <p>
                {areaLabel
                  ? areaLabel
                  : 'Dibuja el perímetro de la finca con la herramienta de polígono para calcular el área.'}
              </p>
            </div>
          </div>
          <div className="polygonSummary__actions">
            <button
              type="button"
              className="button button-secondary button-compact"
              onClick={handleStartDraw}
              disabled={!mapReady}
            >
              Dibujar polígono
            </button>
            <button type="button" className="button button-secondary button-compact" onClick={clearPolygon}>
              Limpiar contorno
            </button>
          </div>
        </div>
      )}

      <div className="mapActions">
        <button
          type="button"
          className="button btn-primary"
          onClick={handleFixLocation}
        >
          {locationFixed ? 'Actualizar ubicación' : 'Fijar ubicación'}
        </button>
        {statusMessage && (
          <div className="mapStatusMessage">
            <Icon path={ICONS.info} size={16} /> {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPinSelector;
