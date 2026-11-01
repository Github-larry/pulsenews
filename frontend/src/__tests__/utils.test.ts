// src/__tests__/utils.test.ts — Frontend utility function tests
// Run with: npm test (frontend)
import {
  cn,
  timeAgo,
  formatDate,
  getInitials,
  truncate,
  formatCount,
  buildQuery,
  validateImageFile,
  getCategoryColor,
} from '../lib/utils';

// ── cn (class merge) ──────────────────────────────────────────
describe('cn()', () => {
  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'skipped', 'included')).toBe('base included');
  });

  it('resolves Tailwind conflicts — last wins', () => {
    // tailwind-merge: p-4 overrides p-2
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles undefined and null gracefully', () => {
    expect(() => cn(undefined, null as unknown as string, 'valid')).not.toThrow();
  });
});

// ── getInitials ───────────────────────────────────────────────
describe('getInitials()', () => {
  it('returns two initials from full name', () => {
    expect(getInitials('Jane Mwangi')).toBe('JM');
  });

  it('returns single initial for single name', () => {
    expect(getInitials('Admin')).toBe('A');
  });

  it('uppercases result', () => {
    expect(getInitials('jane doe')).toBe('JD');
  });

  it('handles hyphenated names', () => {
    expect(getInitials('Jean-Pierre Dubois')).toBe('JD');
  });

  it('returns max 2 characters', () => {
    expect(getInitials('A B C D').length).toBeLessThanOrEqual(2);
  });
});

// ── formatCount ───────────────────────────────────────────────
describe('formatCount()', () => {
  it('returns plain number for values under 1000', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(999)).toBe('999');
    expect(formatCount(500)).toBe('500');
  });

  it('formats thousands with k suffix', () => {
    expect(formatCount(1000)).toBe('1.0k');
    expect(formatCount(1500)).toBe('1.5k');
    expect(formatCount(12300)).toBe('12.3k');
  });

  it('formats millions with M suffix', () => {
    expect(formatCount(1_000_000)).toBe('1.0M');
    expect(formatCount(2_500_000)).toBe('2.5M');
  });
});

// ── truncate ──────────────────────────────────────────────────
describe('truncate()', () => {
  it('returns string unchanged when within limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates and appends ellipsis when over limit', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('handles exact length boundary', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
});

// ── buildQuery ────────────────────────────────────────────────
describe('buildQuery()', () => {
  it('builds query string from object', () => {
    const q = buildQuery({ page: 1, limit: 10 });
    expect(q).toBe('?page=1&limit=10');
  });

  it('omits undefined values', () => {
    const q = buildQuery({ page: 1, category: undefined });
    expect(q).toBe('?page=1');
    expect(q).not.toContain('category');
  });

  it('omits empty string values', () => {
    const q = buildQuery({ page: 1, search: '' });
    expect(q).not.toContain('search');
  });

  it('returns empty string when all values are undefined', () => {
    expect(buildQuery({ category: undefined, search: undefined })).toBe('');
  });
});

// ── validateImageFile ─────────────────────────────────────────
describe('validateImageFile()', () => {
  function makeFile(type: string, size: number): File {
    const blob = new Blob(['x'.repeat(size)], { type });
    return new File([blob], 'test.jpg', { type });
  }

  it('returns null for valid JPEG file', () => {
    const file = makeFile('image/jpeg', 1024);
    expect(validateImageFile(file)).toBeNull();
  });

  it('returns null for valid PNG file', () => {
    const file = makeFile('image/png', 1024 * 100);
    expect(validateImageFile(file)).toBeNull();
  });

  it('returns null for valid WebP file', () => {
    const file = makeFile('image/webp', 1024 * 500);
    expect(validateImageFile(file)).toBeNull();
  });

  it('returns error string for non-image type', () => {
    const file = makeFile('application/pdf', 1024);
    const err = validateImageFile(file);
    expect(typeof err).toBe('string');
    expect(err).toContain('JPEG');
  });

  it('returns error string for file over 10MB', () => {
    const file = makeFile('image/jpeg', 11 * 1024 * 1024);
    const err = validateImageFile(file);
    expect(typeof err).toBe('string');
    expect(err).toContain('10MB');
  });

  it('accepts file at exactly 10MB', () => {
    const file = makeFile('image/jpeg', 10 * 1024 * 1024);
    expect(validateImageFile(file)).toBeNull();
  });
});

// ── getCategoryColor ──────────────────────────────────────────
describe('getCategoryColor()', () => {
  it('returns a non-empty Tailwind class string for all valid categories', () => {
    const categories = [
      'Politics', 'Business', 'Technology', 'Health',
      'Sports', 'Culture', 'Environment', 'Crime', 'Other',
    ];
    categories.forEach((cat) => {
      const color = getCategoryColor(cat);
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    });
  });

  it('returns fallback class for unknown category', () => {
    const color = getCategoryColor('Unknown');
    expect(typeof color).toBe('string');
    expect(color).toContain('paper-warm'); // fallback
  });

  it('returns different colors for different categories', () => {
    const politics = getCategoryColor('Politics');
    const tech = getCategoryColor('Technology');
    expect(politics).not.toBe(tech);
  });
});
