import type { ReactNode } from 'react';
import { Tata, type TataMood } from '../Tata';

/** Tatá's speech balloon; the only peach on screen is hers (identity draft). */
export function Say({ children, mood, size = 30 }: { children: ReactNode; mood?: TataMood; size?: number }) {
  if (!mood) {
    return (
      <p className="say" role="status">
        {children}
      </p>
    );
  }
  return (
    <div className="say-with-tata">
      <Tata mood={mood} size={size} />
      <p className="say" role="status">
        {children}
      </p>
    </div>
  );
}
