const dn = new Intl.DisplayNames(['en'], { type: 'region' });
const skip = new Set(['EU', 'UN', 'XA', 'XB', 'ZZ', 'EZ', 'QO', 'AC', 'CP', 'DG', 'EA', 'IC', 'TA']);
const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const COUNTRIES: string[] = L.flatMap((a) => L.map((b) => a + b))
  .filter((c) => !skip.has(c))
  .map((c) => { try { return dn.of(c) || c; } catch { return c; } })
  .filter((n, i, all) => n.length > 2 && !/^Unknown/.test(n) && all.indexOf(n) === i)
  .sort((a, b) => a.localeCompare(b));
