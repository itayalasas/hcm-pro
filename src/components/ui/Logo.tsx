interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { width: 90, height: 24, iconSize: 24, fontSize: 14, subFontSize: 5 },
    md: { width: 140, height: 38, iconSize: 32, fontSize: 18, subFontSize: 6 },
    lg: { width: 180, height: 48, iconSize: 36, fontSize: 20, subFontSize: 7 },
    xl: { width: 240, height: 64, iconSize: 48, fontSize: 28, subFontSize: 9 },
  };

  const { width, height, iconSize, fontSize, subFontSize } = sizes[size];
  const iconPadding = (height - iconSize) / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="2"
        y={iconPadding}
        width={iconSize}
        height={iconSize}
        rx={iconSize * 0.22}
        fill="url(#gradient1)"
      />

      <path
        d={`M${8 + iconSize * 0.11} ${iconPadding + iconSize * 0.28}h${iconSize * 0.67}v${iconSize * 0.08}h-${iconSize * 0.44}v${iconSize * 0.11}h${iconSize * 0.39}v${iconSize * 0.08}h-${iconSize * 0.39}v${iconSize * 0.14}h${iconSize * 0.44}v${iconSize * 0.08}H${8 + iconSize * 0.11}V${iconPadding + iconSize * 0.28}z`}
        fill="white"
        opacity="0.95"
      />
      <circle
        cx={2 + iconSize * 0.72}
        cy={iconPadding + iconSize * 0.39}
        r={iconSize * 0.07}
        fill="white"
        opacity="0.8"
      />
      <path
        d={`M${2 + iconSize * 0.72} ${iconPadding + iconSize * 0.5}c-${iconSize * 0.07} 0-${iconSize * 0.125} ${iconSize * 0.028}-${iconSize * 0.125} ${iconSize * 0.07}v${iconSize * 0.042}h${iconSize * 0.25}v-${iconSize * 0.042}c0-${iconSize * 0.042}-${iconSize * 0.056}-${iconSize * 0.07}-${iconSize * 0.125}-${iconSize * 0.07}z`}
        fill="white"
        opacity="0.8"
      />

      {showText && (
        <>
          <text
            x={iconSize + 8}
            y={height * 0.625}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize={fontSize}
            fontWeight="700"
            fill="#1e293b"
          >
            Emply<tspan fill="#3b82f6">Sys</tspan>
          </text>
          <text
            x={iconSize + 8}
            y={height * 0.8125}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize={subFontSize}
            fontWeight="500"
            fill="#64748b"
            letterSpacing="1"
          >
            HUMAN CAPITAL MANAGEMENT
          </text>
        </>
      )}

      <defs>
        <linearGradient
          id="gradient1"
          x1="2"
          y1={iconPadding}
          x2={2 + iconSize}
          y2={iconPadding + iconSize}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="0"
        y="0"
        width={size}
        height={size}
        rx={size * 0.22}
        fill="url(#gradient-icon)"
      />

      <path
        d={`M${size * 0.22} ${size * 0.28}h${size * 0.56}v${size * 0.08}h-${size * 0.39}v${size * 0.11}h${size * 0.33}v${size * 0.08}h-${size * 0.33}v${size * 0.14}h${size * 0.39}v${size * 0.08}H${size * 0.22}V${size * 0.28}z`}
        fill="white"
        opacity="0.95"
      />
      <circle
        cx={size * 0.67}
        cy={size * 0.39}
        r={size * 0.07}
        fill="white"
        opacity="0.8"
      />
      <path
        d={`M${size * 0.67} ${size * 0.5}c-${size * 0.07} 0-${size * 0.125} ${size * 0.028}-${size * 0.125} ${size * 0.07}v${size * 0.042}h${size * 0.25}v-${size * 0.042}c0-${size * 0.042}-${size * 0.056}-${size * 0.07}-${size * 0.125}-${size * 0.07}z`}
        fill="white"
        opacity="0.8"
      />

      <defs>
        <linearGradient
          id="gradient-icon"
          x1="0"
          y1="0"
          x2={size}
          y2={size}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
