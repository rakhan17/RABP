const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_MAP: Record<string, number> = {
  januari: 0, jan: 0,
  februari: 1, feb: 1,
  maret: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  agustus: 7, agu: 7, ags: 7,
  september: 8, sep: 8,
  oktober: 9, okt: 9,
  november: 10, nov: 10,
  desember: 11, des: 11
};

/**
 * Parses various date formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, 25 Oktober 2026)
 * into a standardized "YYYY-MM-DD" string.
 */
export function parseFlexDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const cleaned = dateStr.trim();
  if (!cleaned) return '';

  // Format YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleaned)) {
    const [y, m, d] = cleaned.split('-').map(Number);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // Format DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
  if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(cleaned)) {
    const parts = cleaned.split(/[\/\-\.]/).map(p => p.trim());
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    if (year < 100) {
      year += 2000;
    }

    if (day > 0 && day <= 31 && month > 0 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Format "25 Oktober 2026"
  const wordParts = cleaned.toLowerCase().split(/\s+/);
  if (wordParts.length === 3) {
    const day = parseInt(wordParts[0], 10);
    const monthName = wordParts[1];
    const year = parseInt(wordParts[2], 10);

    if (!isNaN(day) && !isNaN(year) && MONTH_MAP[monthName] !== undefined) {
      const month = MONTH_MAP[monthName] + 1;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Standard JS Date parse fallback
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return cleaned;
}

/**
 * Converts any date string (DD/MM/YYYY, YYYY-MM-DD, or Indonesian text)
 * into a formatted Indonesian date text e.g., "25 Oktober 2026".
 */
export function formatIndoFullDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const cleaned = dateStr.trim();
  if (!cleaned) return '';

  const yyyymmdd = parseFlexDate(cleaned);
  if (/^\d{4}-\d{2}-\d{2}$/.test(yyyymmdd)) {
    const [y, m, d] = yyyymmdd.split('-').map(Number);
    const monthName = INDO_MONTHS[m - 1];
    if (monthName) {
      return `${d} ${monthName} ${y}`;
    }
  }

  return cleaned;
}
