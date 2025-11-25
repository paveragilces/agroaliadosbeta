// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

import { TextEncoder, TextDecoder } from 'util';

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder;
}

if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder;
}

vi.mock('react-leaflet', () => {
  const passthrough = ({ children }) => (children ? <>{children}</> : null);
  const MockContainer = ({ children }) => <div>{children}</div>;
  return {
    __esModule: true,
    MapContainer: MockContainer,
    TileLayer: () => null,
    LayersControl: {
      BaseLayer: passthrough,
      Overlay: passthrough,
    },
    GeoJSON: () => null,
    CircleMarker: passthrough,
    Tooltip: passthrough,
    useMap: () => ({ setView: () => {} }),
    useMapEvent: () => {},
    useMapEvents: () => {},
  };
});

vi.mock('react-leaflet-draw', () => ({
  __esModule: true,
  EditControl: () => null,
}));

vi.mock('@turf/turf', () => ({
  __esModule: true,
  area: () => 0,
  centerOfMass: () => ({ geometry: { coordinates: [0, 0] } }),
}));
