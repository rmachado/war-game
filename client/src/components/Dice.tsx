const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[25, 25]],
  2: [[12, 12], [38, 38]],
  3: [[12, 12], [25, 25], [38, 38]],
  4: [[12, 12], [38, 12], [12, 38], [38, 38]],
  5: [[12, 12], [38, 12], [25, 25], [12, 38], [38, 38]],
  6: [[12, 12], [38, 12], [12, 25], [38, 25], [12, 38], [38, 38]],
};

export function getDiceSvg(value: number, color: 'red' | 'yellow' = 'red') {
  const fill = color === 'red' ? '#dc2626' : '#eab308';
  const stroke = color === 'red' ? '#991b1b' : '#a16207';
  const dots = DOT_POSITIONS[value] || [];
  return (
    `<svg viewBox="0 0 50 50" width="56" height="56">
      <rect x="2" y="2" width="46" height="46" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      ${dots.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="4" fill="white"/>`).join('')}
    </svg>`
  );
}
