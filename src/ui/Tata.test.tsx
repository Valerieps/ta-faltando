import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TATA_MOODS, Tata } from './Tata';

describe('Tata', () => {
  it.each(TATA_MOODS)('draws the %s mood with theme tokens only', (mood) => {
    const svg = renderToStaticMarkup(<Tata mood={mood} />);
    expect(svg).toContain(`data-mood="${mood}"`);
    expect(svg).toContain('aria-hidden="true"');
    // Colors come from tokens.css, so she follows the light and dark themes.
    expect(svg).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });

  it('keeps her height and widens the canvas for what she draws beside her', () => {
    expect(renderToStaticMarkup(<Tata size={32} />)).toContain('width="32" height="32"');
    expect(renderToStaticMarkup(<Tata mood="listening" size={32} />)).toContain('width="34" height="32"');
  });
});
