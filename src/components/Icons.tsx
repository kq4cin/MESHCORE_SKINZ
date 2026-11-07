import type { SVGProps } from 'react';
import type { WeatherIcon as WeatherKind } from '../lib/weather';

type P = SVGProps<SVGSVGElement>;
const base = (p: P): P => ({ viewBox: '0 0 48 48', 'aria-hidden': true, focusable: false, ...p });

const Star = ({ x, y, r = 3, fill = 'var(--gold)' }: { x: number; y: number; r?: number; fill?: string }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} />;
};

/** Eagle crest: spread wings, stars-and-stripes shield, gold star. */
export function Crest(p: P) {
  return (
    <svg viewBox="0 0 120 100" aria-hidden focusable={false} {...p}>
      <g stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round">
        <path d="M58 40 L8 18 L14 30 L4 32 L16 42 L8 48 L24 54 L20 60 L44 60 Z" fill="var(--cream)" />
        <path d="M62 40 L112 18 L106 30 L116 32 L104 42 L112 48 L96 54 L100 60 L76 60 Z" fill="var(--cream)" />
        <path d="M56 44 L16 30 L22 40 L14 44 L30 50 L26 56 L46 58 Z" fill="var(--red)" />
        <path d="M64 44 L104 30 L98 40 L106 44 L90 50 L94 56 L74 58 Z" fill="var(--red)" />
        <path d="M60 6 C70 6 74 14 72 22 L82 22 L72 28 L60 30 L48 28 L48 18 C48 10 52 6 60 6 Z" fill="var(--cream)" />
        <path d="M72 22 L82 22 L74 28 Z" fill="var(--gold)" />
        <path d="M40 34 H80 V62 C80 78 70 88 60 94 C50 88 40 78 40 62 Z" fill="var(--cream)" />
        <path d="M40 34 H80 V48 H40 Z" fill="var(--navy)" />
      </g>
      <g fill="var(--red)">
        <rect x="45" y="50" width="5" height="34" />
        <rect x="55" y="50" width="5" height="42" />
        <rect x="65" y="50" width="5" height="38" />
        <rect x="75" y="50" width="3" height="20" />
      </g>
      <path d="M40 34 H80 V62 C80 78 70 88 60 94 C50 88 40 78 40 62 Z" fill="none" stroke="var(--ink)" strokeWidth="3" />
      <circle cx="64" cy="14" r="2" fill="var(--ink)" />
      <Star x={50} y={41} r={4} fill="var(--cream)" />
      <Star x={60} y={41} r={4} fill="var(--cream)" />
      <Star x={70} y={41} r={4} fill="var(--cream)" />
    </svg>
  );
}

export function MessagesIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M5 8 H31 A3 3 0 0 1 34 11 V27 A3 3 0 0 1 31 30 H16 L8 37 V30 H5 A3 3 0 0 1 2 27 V11 A3 3 0 0 1 5 8 Z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M22 21 H43 A3 3 0 0 1 46 24 V36 A3 3 0 0 1 43 39 H40 V45 L33 39 H22 A3 3 0 0 1 19 36 V24 A3 3 0 0 1 22 21 Z" fill="var(--red)" stroke="var(--ink)" strokeWidth="2.5" />
      <Star x={10} y={19} r={3.4} fill="var(--navy)" />
      <Star x={18} y={19} r={3.4} fill="var(--navy)" />
      <Star x={26} y={19} r={3.4} fill="var(--navy)" />
    </svg>
  );
}

export function NetworkIcon(p: P) {
  const nodes: Array<[number, number]> = [[8, 10], [40, 8], [42, 40], [8, 38], [24, 6]];
  return (
    <svg {...base(p)}>
      {nodes.map(([x, y]) => <line key={`${x}${y}`} x1="24" y1="24" x2={x} y2={y} stroke="var(--cream)" strokeWidth="2" />)}
      <circle cx="24" cy="24" r="7" fill="var(--navy)" stroke="var(--cream)" strokeWidth="2.5" />
      <Star x={8} y={10} r={5} />
      <Star x={42} y={40} r={5} />
      <Star x={8} y={38} r={5} fill="var(--red)" />
      <circle cx="40" cy="8" r="4" fill="var(--red)" stroke="var(--cream)" strokeWidth="1.5" />
      <circle cx="24" cy="6" r="3" fill="var(--cream)" />
    </svg>
  );
}

export function SettingsIcon(p: P) {
  const teeth = Array.from({ length: 8 }, (_, i) => (
    <rect key={i} x="21" y="3" width="6" height="8" rx="1" fill="var(--cream)" transform={`rotate(${i * 45} 24 24)`} />
  ));
  return (
    <svg {...base(p)}>
      {teeth}
      <circle cx="24" cy="24" r="14" fill="var(--cream)" />
      <circle cx="24" cy="24" r="6" fill="var(--navy)" />
      <path d="M10 30 C18 20 30 14 46 12 C38 18 34 20 30 22 C36 22 40 22 44 20 C38 28 30 30 22 30 Z" fill="var(--red)" stroke="var(--ink)" strokeWidth="1.5" />
    </svg>
  );
}

export function WeatherTabIcon(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="17" cy="17" r="9" fill="var(--gold)" />
      <path d="M14 40 A9 9 0 0 1 15 22 A12 12 0 0 1 37 24 A8 8 0 0 1 38 40 Z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2.5" />
      <Star x={26} y={32} r={5} fill="var(--red)" />
    </svg>
  );
}

export function WeatherGlyph({ kind, ...p }: P & { kind: WeatherKind }) {
  const cloud = <path d="M12 38 A8 8 0 0 1 13 22 A11 11 0 0 1 34 23 A7.5 7.5 0 0 1 35 38 Z" fill="var(--cream)" />;
  const sun = (r = 9, cx = 24, cy = 22) => (
    <g>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={cx - 1.5} y={cy - r - 7} width="3" height="5" rx="1.5" fill="var(--gold)" transform={`rotate(${i * 45} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="var(--gold)" />
    </g>
  );
  const drops = (color: string) => [14, 22, 30].map((x) => <line key={x} x1={x + 2} y1="40" x2={x} y2="46" stroke={color} strokeWidth="2.5" strokeLinecap="round" />);
  const body = {
    sun: sun(10),
    cloud: <>{sun(7, 32, 16)}{cloud}</>,
    rain: <>{cloud}{drops('#6fb7ff')}</>,
    storm: <>{cloud}<path d="M24 36 L18 46 H24 L21 52 L31 40 H25 L28 36 Z" fill="var(--gold)" /></>,
    snow: <>{cloud}{[14, 22, 30].map((x) => <circle key={x} cx={x + 1} cy="44" r="2.2" fill="#fff" />)}</>,
    fog: <>{cloud}{[40, 45].map((y) => <line key={y} x1="10" y1={y} x2="38" y2={y} stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />)}</>,
    wind: [16, 24, 32].map((y, i) => <path key={y} d={`M6 ${y} H${30 + i * 4} a5 5 0 1 0 -5 -5`} fill="none" stroke="var(--cream)" strokeWidth="3" strokeLinecap="round" />),
    unknown: <>{cloud}<Star x={24} y={30} r={6} fill="var(--red)" /></>,
  }[kind];
  return <svg viewBox="0 0 48 52" aria-hidden focusable={false} {...p}>{body}</svg>;
}

export function StarGlyph(p: P) {
  return <svg viewBox="0 0 10 10" aria-hidden focusable={false} {...p}><Star x={5} y={5.4} r={5} fill="currentColor" /></svg>;
}

export const BackIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const SendIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><path d="M3 11.5 L21 3 L14.5 21 L11.5 13 Z" fill="currentColor" /></svg>
);

export const BluetoothIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><path d="M7 7 L17 16 L12 21 V3 L17 8 L7 17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const UsbIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><path d="M12 2 V18 M12 18 m-2.5 0 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0 M12 13 L7 9 V6 M12 11 L17 8 V5 M5.5 4 H8.5 V7 H5.5 Z M17 3 l1.5 2.5 h-3 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
);

export const RefreshIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><path d="M20 11 A8 8 0 0 0 5.5 6.5 L4 8 M4 13 A8 8 0 0 0 18.5 17.5 L20 16 M4 3 V8 H9 M20 21 V16 H15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const BroadcastIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><circle cx="12" cy="12" r="2.5" fill="currentColor" /><path d="M7.8 7.8 a6 6 0 0 0 0 8.4 M16.2 7.8 a6 6 0 0 1 0 8.4 M4.9 4.9 a10 10 0 0 0 0 14.2 M19.1 4.9 a10 10 0 0 1 0 14.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
