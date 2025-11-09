// vendor/lucide-react/index.js
const React = require('react');

const toKebab = (name) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const createLucideIcon = (iconName, iconNode) => {
  const Component = React.forwardRef(function LucideIcon(
    { color = 'currentColor', size = 24, strokeWidth = 2, className = '', ...rest },
    ref
  ) {
    const svgClass = ['lucide', `lucide-${toKebab(iconName)}`, className].filter(Boolean).join(' ');
    return React.createElement(
      'svg',
      {
        ...rest,
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className: svgClass,
      },
      iconNode.map(([tag, attrs], index) =>
        React.createElement(tag, { key: `${iconName}-${index}`, ...attrs })
      )
    );
  });

  Component.displayName = iconName;
  return Component;
};

const AlertTriangle = createLucideIcon('AlertTriangle', [
  ['path', { d: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z' }],
  ['line', { x1: '12', y1: '9', x2: '12', y2: '13' }],
  ['path', { d: 'M12 17h.01' }],
]);

const ArrowDownUp = createLucideIcon('ArrowDownUp', [
  ['polyline', { points: '3 16 7 20 11 16' }],
  ['line', { x1: '7', y1: '4', x2: '7', y2: '20' }],
  ['polyline', { points: '21 8 17 4 13 8' }],
  ['line', { x1: '17', y1: '4', x2: '17', y2: '20' }],
]);

const ArrowLeft = createLucideIcon('ArrowLeft', [
  ['line', { x1: '19', y1: '12', x2: '5', y2: '12' }],
  ['polyline', { points: '12 19 5 12 12 5' }],
]);

const Calendar = createLucideIcon('Calendar', [
  ['rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }],
  ['line', { x1: '16', y1: '2', x2: '16', y2: '6' }],
  ['line', { x1: '8', y1: '2', x2: '8', y2: '6' }],
  ['line', { x1: '3', y1: '10', x2: '21', y2: '10' }],
]);

const Camera = createLucideIcon('Camera', [
  ['path', { d: 'M5 7h2l2-2h6l2 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z' }],
  ['circle', { cx: '12', cy: '13', r: '3' }],
]);

const CheckCircle2 = createLucideIcon('CheckCircle2', [
  ['path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }],
  ['polyline', { points: '22 4 12 14.01 9 11.01' }],
]);

const ClipboardList = createLucideIcon('ClipboardList', [
  ['rect', { x: '8', y: '2', width: '8', height: '4', rx: '1', ry: '1' }],
  ['path', { d: 'M9 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4' }],
  ['line', { x1: '12', y1: '11', x2: '16', y2: '11' }],
  ['line', { x1: '12', y1: '16', x2: '16', y2: '16' }],
  ['path', { d: 'M8 11h.01' }],
  ['path', { d: 'M8 16h.01' }],
]);

const Download = createLucideIcon('Download', [
  ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }],
  ['polyline', { points: '7 10 12 15 17 10' }],
  ['line', { x1: '12', y1: '15', x2: '12', y2: '3' }],
]);

const Flag = createLucideIcon('Flag', [
  ['path', { d: 'M5 5.5c2.5-1 5.5-1 8 0s5.5 1 8 0v8c-2.5 1-5.5 1-8 0s-5.5-1-8 0' }],
  ['line', { x1: '5', y1: '3', x2: '5', y2: '21' }],
]);

const Filter = createLucideIcon('Filter', [
  ['path', { d: 'M22 3H2l8 9.46V19l4 2v-8.54Z' }],
]);

const Layers = createLucideIcon('Layers', [
  ['path', { d: 'm12 2 9 5-9 5-9-5Z' }],
  ['path', { d: 'm3 12 9 5 9-5' }],
  ['path', { d: 'm3 17 9 5 9-5' }],
]);

const MapPin = createLucideIcon('MapPin', [
  ['path', { d: 'M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 1 1 18 0Z' }],
  ['circle', { cx: '12', cy: '10', r: '3' }],
]);

const Search = createLucideIcon('Search', [
  ['circle', { cx: '11', cy: '11', r: '7' }],
  ['line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65' }],
]);

const UserCog = createLucideIcon('UserCog', [
  ['circle', { cx: '10', cy: '7', r: '4' }],
  ['path', { d: 'M2 21v-1a6 6 0 0 1 6-6h4' }],
  ['circle', { cx: '19', cy: '17', r: '2' }],
  ['path', { d: 'M19 13v1' }],
  ['path', { d: 'M19 20v1' }],
  ['path', { d: 'M22 17h-1' }],
  ['path', { d: 'M17 17h-1' }],
  ['path', { d: 'm21.6 14.4-.7.7' }],
  ['path', { d: 'm16.1 19.9-.7.7' }],
  ['path', { d: 'm21.6 19.6-.7-.7' }],
  ['path', { d: 'm16.1 14.1-.7-.7' }],
]);

const X = createLucideIcon('X', [
  ['line', { x1: '18', y1: '6', x2: '6', y2: '18' }],
  ['line', { x1: '6', y1: '6', x2: '18', y2: '18' }],
]);

module.exports = {
  createLucideIcon,
  AlertTriangle,
  ArrowDownUp,
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardList,
  Download,
  Flag,
  Filter,
  Layers,
  MapPin,
  Search,
  UserCog,
  X,
};
