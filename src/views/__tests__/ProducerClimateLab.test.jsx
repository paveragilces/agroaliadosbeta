import { render, screen, waitFor } from '@testing-library/react';

jest.mock('react-leaflet', () => {
  const React = require('react');
  const MockComponent = ({ children }) => <>{children}</>;
  const LayersControl = ({ children }) => <div>{children}</div>;
  LayersControl.BaseLayer = ({ children }) => <div>{children}</div>;
  return {
    MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
    TileLayer: MockComponent,
    LayersControl,
    GeoJSON: MockComponent,
    CircleMarker: MockComponent,
    Tooltip: MockComponent,
    useMap: () => ({ fitBounds: jest.fn(), setView: jest.fn() }),
  };
});

import ProducerClimateLab from '../ProducerClimateLab/ProducerClimateLab';

const sampleHistory = {
  daily: {
    time: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04'],
    temperature_2m_max: [30, 31, 32, 33],
    temperature_2m_min: [20, 21, 22, 23],
    precipitation_sum: [5, 10, 4, 8],
    et0_fao_evapotranspiration: [3, 3, 3, 3],
    windspeed_10m_max: [12, 15, 10, 11],
    shortwave_radiation_sum: [6, 6, 6, 6],
  },
};

const sampleForecast = {
  daily: {
    time: ['2024-01-05'],
    temperature_2m_max: [34],
    temperature_2m_min: [24],
    precipitation_sum: [7],
    et0_fao_evapotranspiration: [3],
    windspeed_10m_max: [12],
    shortwave_radiation_sum: [6],
  },
};

describe('ProducerClimateLab', () => {
  beforeEach(() => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => sampleHistory })
      .mockResolvedValueOnce({ ok: true, json: async () => sampleForecast });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders climate hero after fetching data', async () => {
    render(
      <ProducerClimateLab
        producer={{
          id: 'p1',
          fincas: [
            {
              id: 'f1',
              name: 'Finca clima',
              location: { lat: -2.1, lon: -79.9 },
              lotes: ['Lote 1'],
            },
          ],
        }}
        onNavigate={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(
        screen.getByText('Laboratorio de clima del productor')
      ).toBeInTheDocument()
    );
  });
});
