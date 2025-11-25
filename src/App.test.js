import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders login hero headline', () => {
  render(<App />);
  expect(
    screen.getByText(/Impulsa la bioseguridad agrícola/i)
  ).toBeInTheDocument();
});
