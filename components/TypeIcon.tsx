interface Props {
  type: string;
  size?: number;
  color?: string;
}

const icons: Record<string, React.ReactElement> = {
  normal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  fire: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C10 6 6 7 6 12a6 6 0 0012 0c0-3-2-5-3-7-1 2-1 3-2 3s-1-1-1-6z" />
      <path d="M9 17c0 2 1.5 3 3 3s3-1 3-3c0-1.5-1-2.5-2-3 0 1.5-0.5 2-1 2s-1-0.5-1-2c-1 0.5-2 1.5-2 3z" />
    </svg>
  ),
  water: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L6 10a6 6 0 0012 0L12 2z" />
    </svg>
  ),
  electric: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13,2 5,14 11,14 11,22 19,10 13,10" />
    </svg>
  ),
  grass: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22V12M12 12C12 12 6 10 4 4c4 0 8 3 8 8M12 12C12 12 18 10 20 4c-4 0-8 3-8 8" />
    </svg>
  ),
  ice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
      <line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  ),
  fighting: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 6c0-2 1-3 2-3s2 1 2 3l-1 6h-2L8 6zM14 6c0-2 1-3 2-3s2 1 2 3l-1 6h-2L14 6z" />
      <rect x="6" y="12" width="12" height="6" rx="2" /><rect x="9" y="18" width="6" height="4" rx="1" />
    </svg>
  ),
  poison: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="11" r="5" />
      <path d="M9 16v4a3 3 0 006 0v-4" />
      <circle cx="9" cy="8" r="1.5" fill="white" /><circle cx="14" cy="9" r="1" fill="white" />
    </svg>
  ),
  ground: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="15" rx="9" ry="4" />
      <path d="M5 15 L3 8 Q12 4 21 8 L19 15" />
    </svg>
  ),
  flying: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 8C8 6 4 8 2 12h8l2-4zM12 8C16 6 20 8 22 12h-8l-2-4z" />
      <circle cx="12" cy="14" r="3" />
    </svg>
  ),
  psychic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2" strokeDasharray="4 3" />
      <path d="M4 12a8 8 0 0 1 16 0" />
    </svg>
  ),
  bug: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="13" rx="4" ry="5" /><ellipse cx="12" cy="8" rx="2" ry="2" />
      <path d="M8 13 Q4 11 4 8M16 13 Q20 11 20 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M8 16 Q5 18 5 21M16 16 Q19 18 19 21" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M9 9 Q7 7 7 5M15 9 Q17 7 17 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),
  rock: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12,3 20,9 18,19 6,19 4,9" />
    </svg>
  ),
  ghost: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3a7 7 0 00-7 7v10l2.5-2.5 2.5 2.5 2.5-2.5 2.5 2.5 2.5-2.5 2.5 2.5V10a7 7 0 00-7-7z" />
      <circle cx="9" cy="10" r="1.5" fill="white" /><circle cx="15" cy="10" r="1.5" fill="white" />
    </svg>
  ),
  dragon: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4 Q8 2 12 6 Q16 2 20 4 Q22 8 18 10 Q22 14 18 18 Q14 22 12 18 Q10 22 6 18 Q2 14 6 10 Q2 8 4 4z" />
      <circle cx="9" cy="10" r="1" fill="white" /><circle cx="15" cy="10" r="1" fill="white" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3a9 9 0 108.66 12A7 7 0 0112 3z" />
    </svg>
  ),
  steel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="currentColor" opacity="0.7" />
      <polygon points="12,6 16,8.5 16,13.5 12,16 8,13.5 8,8.5" fill="currentColor" />
    </svg>
  ),
  fairy: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.5 4.5L18 5l-3 3.5 1.5 4.5L12 11l-4.5 2 1.5-4.5L6 5l4.5 1.5z" />
      <circle cx="12" cy="16" r="3" opacity="0.6" />
    </svg>
  ),
};

const fallback = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export default function TypeIcon({ type, size = 18, color }: Props) {
  const icon = icons[type.toLowerCase()] ?? fallback;
  return (
    <span
      style={{ width: size, height: size, display: "inline-flex", color: color ?? "currentColor" }}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}
