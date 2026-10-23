// Tatá, the app's bot: a shopping bag whose handle is her antenna (docs/rascunhos/identidade-visual.html).
// Decorative: what she says goes in the text next to her, so the drawing is hidden from screen readers.

export type TataMood = 'attentive' | 'happy' | 'listening' | 'thinking' | 'sleeping';

/** Every mood, in the order of the identity draft. */
export const TATA_MOODS: readonly TataMood[] = ['attentive', 'happy', 'listening', 'thinking', 'sleeping'];

const BODY = 'var(--color-brand)';
const FACE = 'var(--color-on-brand)';
const CHEEK = 'var(--color-blush)';
const AROUND = 'var(--color-text-muted)';

// Moods that draw something beside the bag (sound waves, thought dots, z's) need a wider canvas.
const hasExtra = (mood: TataMood) => mood === 'listening' || mood === 'thinking' || mood === 'sleeping';

function Face({ mood }: { mood: TataMood }) {
  const line = { fill: 'none', stroke: FACE, strokeLinecap: 'round' as const };
  switch (mood) {
    case 'happy':
      return (
        <>
          <path d="M21 38Q25 32 29 38M35 38Q39 32 43 38" {...line} strokeWidth={3} />
          <path d="M27 45Q32 51 37 45" {...line} strokeWidth={2.6} />
        </>
      );
    case 'sleeping':
      return (
        <>
          <path d="M21 37Q25 40 29 37M35 37Q39 40 43 37" {...line} strokeWidth={2.6} />
          <path d="M30 46H34" {...line} strokeWidth={2.4} />
          <path d="M50 10H55L50 16H55M58 3H61L58 7H61" {...line} stroke={AROUND} strokeWidth={1.8} />
        </>
      );
    case 'thinking':
      return (
        <>
          <ellipse cx={26} cy={34} rx={3.2} ry={4.2} fill={FACE} />
          <ellipse cx={40} cy={34} rx={3.2} ry={4.2} fill={FACE} />
          <path d="M29 46Q32 44 35 46" {...line} strokeWidth={2.4} />
          <circle cx={53} cy={14} r={2} fill={AROUND} />
          <circle cx={58} cy={8} r={2.6} fill={AROUND} />
        </>
      );
    case 'listening':
      return (
        <>
          <ellipse cx={25} cy={37} rx={3.2} ry={4.2} fill={FACE} />
          <ellipse cx={39} cy={37} rx={3.2} ry={4.2} fill={FACE} />
          <ellipse cx={32} cy={47} rx={2.6} ry={3} fill={FACE} />
          <path d="M57 30Q61 37 57 44M61 26Q67 37 61 48" fill="none" stroke={BODY} strokeWidth={2.4} strokeLinecap="round" />
        </>
      );
    default:
      return (
        <>
          <ellipse cx={25} cy={37} rx={3.2} ry={4.2} fill={FACE} />
          <ellipse cx={39} cy={37} rx={3.2} ry={4.2} fill={FACE} />
          <path d="M28 45Q32 49 36 45" {...line} strokeWidth={2.4} />
        </>
      );
  }
}

export function Tata({ mood = 'attentive', size = 40 }: { mood?: TataMood; size?: number }) {
  const width = hasExtra(mood) ? 68 : 64;
  return (
    <svg
      className="tata"
      data-mood={mood}
      width={Math.round((size * width) / 64)}
      height={size}
      viewBox={`0 0 ${width} 64`}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M23 21V16Q23 8 32 8Q41 8 41 16V21" fill="none" stroke={BODY} strokeWidth={4} strokeLinecap="round" />
      <rect x={9} y={19} width={46} height={40} rx={13} fill={BODY} />
      <circle cx={18} cy={45} r={3.6} fill={CHEEK} />
      <circle cx={46} cy={45} r={3.6} fill={CHEEK} />
      <Face mood={mood} />
    </svg>
  );
}
