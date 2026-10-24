import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * An effect may return only a cleanup function. An expression body returns whatever the call
 * returns, and browser APIs change: Chrome's scrollIntoView now returns a Promise, which React
 * calls as a cleanup when the screen leaves, crashing the app into a blank page.
 */

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('effects', () => {
  it('have a block body or return a cleanup function', () => {
    const offenders = sourceFiles(__dirname).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/useEffect\(\s*\(\)\s*=>(?!\s*(\{|\(\)\s*=>))/g)].map(
        (match) => `${relative(__dirname, file)} at ${match.index}`,
      ),
    );
    expect(offenders).toEqual([]);
  });
});
