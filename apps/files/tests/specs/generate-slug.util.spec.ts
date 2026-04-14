import { generateSlug } from '../../src/utils/generate-slug.util';

describe('generateSlug', () => {
  const SLUG_PATTERN = /^[a-z0-9-]+-[a-z0-9]{12}(\.[a-z0-9]+)?$/;

  it('generates slug with sanitized name and extension', () => {
    const slug = generateSlug('my-budget-2024.xlsx');
    expect(slug).toMatch(/^my-budget-2024-[a-z0-9]{12}\.xlsx$/);
  });

  it('replaces spaces and special chars with hyphens', () => {
    const slug = generateSlug('My Budget (Final)!.pdf');
    expect(slug).toMatch(/^my-budget-final-[a-z0-9]{12}\.pdf$/);
  });

  it('handles filename with no extension', () => {
    const slug = generateSlug('README');
    expect(slug).toMatch(/^readme-[a-z0-9]{12}$/);
  });

  it('truncates base to 50 chars and preserves extension', () => {
    const longName = 'a'.repeat(100) + '.txt';
    const slug = generateSlug(longName);
    const base = slug.replace(/-[a-z0-9]{12}\.txt$/, '');
    expect(base.length).toBeLessThanOrEqual(50);
    expect(slug).toMatch(/\.txt$/);
  });

  it('strips extension longer than 10 chars', () => {
    const slug = generateSlug('file.verylongextension');
    expect(slug).not.toContain('.');
    expect(slug).toMatch(SLUG_PATTERN);
  });

  it('falls back to "file" base for unsanitizable filenames', () => {
    const slug = generateSlug('!!!.pdf');
    expect(slug).toMatch(/^file-[a-z0-9]{12}\.pdf$/);
  });

  it('handles non-ASCII characters', () => {
    const slug = generateSlug('документ.docx');
    expect(slug).toMatch(/^[a-z0-9-]+-[a-z0-9]{12}\.docx$/);
  });

  it('generates unique slugs for same filename', () => {
    const slug1 = generateSlug('report.pdf');
    const slug2 = generateSlug('report.pdf');
    expect(slug1).not.toBe(slug2);
  });
});
