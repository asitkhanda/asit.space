/** Colorful WMO weather glyphs for the map chrome. */

type Props = {
  code: number;
  className?: string;
};

function SunGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <circle cx="12" cy="12" r="4.25" fill="#F5B942" />
      <circle cx="12" cy="12" r="3.1" fill="#FFE08A" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <rect
          key={deg}
          x="11.15"
          y="1.4"
          width="1.7"
          height="3.2"
          rx="0.85"
          fill="#F5B942"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

function PartlyCloudyGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <circle cx="9.2" cy="9" r="3.4" fill="#F5B942" />
      <circle cx="9.2" cy="9" r="2.3" fill="#FFE08A" />
      <path
        d="M8.2 18.4c-2.5 0-4.5-1.9-4.5-4.2 0-2 1.4-3.7 3.4-4.1.6-1.9 2.4-3.2 4.5-3.2 2.5 0 4.5 1.8 4.8 4.2 1.7.3 3 1.7 3 3.4 0 1.9-1.6 3.9-4.2 3.9H8.2Z"
        fill="#E8EEF5"
      />
      <path
        d="M9.1 17.2c-1.8 0-3.2-1.3-3.2-2.9 0-1.4 1-2.6 2.4-2.9.5-1.4 1.8-2.3 3.3-2.3 1.8 0 3.2 1.2 3.5 2.9 1.2.2 2.1 1.2 2.1 2.4 0 1.4-1.2 2.8-3.1 2.8H9.1Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function CloudyGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path
        d="M6.8 18.5c-2.6 0-4.7-2-4.7-4.4 0-2.1 1.5-3.9 3.6-4.3.7-2.2 2.7-3.7 5.1-3.7 2.7 0 5 1.9 5.4 4.5 1.9.2 3.4 1.8 3.4 3.6 0 2-1.7 4.3-4.6 4.3H6.8Z"
        fill="#A9B7C9"
      />
      <path
        d="M7.8 17.2c-1.9 0-3.4-1.4-3.4-3.1 0-1.5 1.1-2.8 2.6-3 .5-1.6 2-2.7 3.8-2.7 2 0 3.6 1.4 3.9 3.2 1.3.2 2.3 1.3 2.3 2.6 0 1.5-1.3 3-3.3 3H7.8Z"
        fill="#D7E0EA"
      />
    </svg>
  );
}

function FogGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path
        d="M7.5 11.2c-1.9 0-3.4-1.4-3.4-3.1S5.6 5 7.5 5c.5-1.5 1.9-2.5 3.6-2.5 1.9 0 3.5 1.3 3.8 3.1 1.3.1 2.3 1.2 2.3 2.5 0 1.4-1.2 2.9-3.2 2.9H7.5Z"
        fill="#C5CED8"
      />
      <rect x="4" y="13.2" width="16" height="1.6" rx="0.8" fill="#9AA8B8" />
      <rect x="5.5" y="16.2" width="13" height="1.6" rx="0.8" fill="#B7C2CF" />
      <rect x="4.5" y="19.2" width="15" height="1.6" rx="0.8" fill="#9AA8B8" />
    </svg>
  );
}

function DrizzleGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path
        d="M7.6 13.4c-2 0-3.6-1.5-3.6-3.3 0-1.6 1.1-2.9 2.7-3.2.5-1.6 2-2.8 3.8-2.8 2 0 3.7 1.4 4 3.3 1.4.2 2.4 1.3 2.4 2.7 0 1.6-1.3 3.3-3.4 3.3H7.6Z"
        fill="#D7E0EA"
      />
      <path d="M9 15.2c0 .9-.7 2.2-1.5 2.2S6 16.1 6 15.2 7.5 13.4 7.5 13.4s1.5.9 1.5 1.8Z" fill="#5BA4E6" />
      <path d="M13.2 16c0 .9-.7 2.2-1.5 2.2s-1.5-1.3-1.5-2.2.7-1.8 1.5-1.8 1.5.9 1.5 1.8Z" fill="#7BB8F0" />
      <path d="M17.2 15.2c0 .9-.7 2.2-1.5 2.2S14.2 16.1 14.2 15.2s1.5-1.8 1.5-1.8 1.5.9 1.5 1.8Z" fill="#5BA4E6" />
    </svg>
  );
}

function RainGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path
        d="M7.4 12.8c-2.2 0-4-1.7-4-3.7 0-1.8 1.3-3.3 3-3.6.6-1.9 2.3-3.2 4.3-3.2 2.3 0 4.2 1.6 4.5 3.8 1.6.2 2.8 1.5 2.8 3.1 0 1.8-1.5 3.6-3.9 3.6H7.4Z"
        fill="#B8C5D4"
      />
      <path d="M8.4 14.6c0 1.2-.9 2.9-2 2.9s-2-1.7-2-2.9.9-2.4 2-2.4 2 1.2 2 2.4Z" fill="#3B8FE0" />
      <path d="M13.2 15.8c0 1.2-.9 2.9-2 2.9s-2-1.7-2-2.9.9-2.4 2-2.4 2 1.2 2 2.4Z" fill="#5BA4E6" />
      <path d="M18 14.6c0 1.2-.9 2.9-2 2.9s-2-1.7-2-2.9.9-2.4 2-2.4 2 1.2 2 2.4Z" fill="#3B8FE0" />
    </svg>
  );
}

function SnowGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path
        d="M7.4 12.6c-2.2 0-4-1.7-4-3.7 0-1.8 1.3-3.3 3-3.6.6-1.9 2.3-3.2 4.3-3.2 2.3 0 4.2 1.6 4.5 3.8 1.6.2 2.8 1.5 2.8 3.1 0 1.8-1.5 3.6-3.9 3.6H7.4Z"
        fill="#D5DEE8"
      />
      <circle cx="8" cy="16.2" r="1.15" fill="#8EC8F5" />
      <circle cx="12" cy="18.4" r="1.15" fill="#B8DDF8" />
      <circle cx="16.2" cy="16" r="1.15" fill="#8EC8F5" />
      <circle cx="10.2" cy="20.2" r="0.85" fill="#B8DDF8" />
      <circle cx="14.4" cy="19.8" r="0.85" fill="#8EC8F5" />
    </svg>
  );
}

function ThunderGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path
        d="M7.4 12.2c-2.2 0-4-1.7-4-3.7 0-1.8 1.3-3.3 3-3.6.6-1.9 2.3-3.2 4.3-3.2 2.3 0 4.2 1.6 4.5 3.8 1.6.2 2.8 1.5 2.8 3.1 0 1.8-1.5 3.6-3.9 3.6H7.4Z"
        fill="#7E8B9C"
      />
      <path
        d="M13.6 11.4 10.2 17h2.1l-1.1 5.2 5.1-7.2h-2.4l1.7-3.6h-2Z"
        fill="#F5C542"
      />
      <path
        d="M13.2 12.2 10.8 16.2h1.6l-.8 3.6 3.6-5.1h-1.7l1.2-2.5h-1.5Z"
        fill="#FFE08A"
      />
    </svg>
  );
}

/** Pick a colorful glyph from an Open-Meteo / WMO weather code. */
export function WeatherGlyph({ code, className = "" }: Props) {
  let glyph = <SunGlyph />;
  if (code >= 95) glyph = <ThunderGlyph />;
  else if (code >= 71 && code < 80) glyph = <SnowGlyph />;
  else if (code >= 85) glyph = <SnowGlyph />;
  else if (code >= 61 || (code >= 80 && code < 85)) glyph = <RainGlyph />;
  else if (code >= 51) glyph = <DrizzleGlyph />;
  else if (code >= 45) glyph = <FogGlyph />;
  else if (code >= 3) glyph = <CloudyGlyph />;
  else if (code >= 1) glyph = <PartlyCloudyGlyph />;

  return (
    <span className={`inline-block shrink-0 ${className}`} aria-hidden>
      {glyph}
    </span>
  );
}
