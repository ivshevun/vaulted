import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12);

export function generateSlug(filename: string): string {
  const rawExt = filename.match(/\.[^.]+$/)?.[0] ?? '';
  const ext = rawExt.length <= 10 ? rawExt : '';
  const base = filename
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  const safeBase = base || 'file';
  return `${safeBase}-${nanoid()}${ext}`;
}
