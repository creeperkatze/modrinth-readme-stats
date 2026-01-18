import { escapeXml } from '../utils/formatters.js';

export function generateBadge(label, value, color = '#1bd96a')
{
    const labelWidth = label.length * 7 + 20;
    const valueWidth = value.length * 8 + 20;
    const totalWidth = labelWidth + valueWidth;
    const height = 20;

    const bgColor = 'transparent';
    const labelTextColor = '#8b949e';
    const valueTextColor = '#ffffff';
    const borderColor = '#E4E2E2';

    return `
<svg width="${totalWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="badge_clip">
      <rect width="${totalWidth}" height="${height}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#badge_clip)">
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="${totalWidth - 1}" height="${height - 1}" vector-effect="non-scaling-stroke"/>
    <path d="M ${labelWidth} 1 H ${labelWidth + valueWidth - 5} A 4 4 0 0 1 ${labelWidth + valueWidth - 1} 5 V ${height - 5} A 4 4 0 0 1 ${labelWidth + valueWidth - 5} ${height - 1} H ${labelWidth} Z" fill="${color}"/>
    <line x1="${labelWidth}" y1="1" x2="${labelWidth}" y2="${height - 1}" stroke="${borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>
  </g>

  <g text-anchor="middle" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" font-weight="500">
    <text x="${labelWidth / 2}" y="14.5" fill="${labelTextColor}">${escapeXml(label)}</text>
    <text x="${labelWidth + (valueWidth / 2)}" y="14.5" fill="${valueTextColor}">${escapeXml(value)}</text>
  </g>
</svg>`.trim();
}
