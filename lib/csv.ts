/**
 * RFC 4180 compliant CSV parser and generator for products and catalog data.
 * Zero external dependencies.
 */

export function parseCSV(text: string): Record<string, string>[] {
  // Strip BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentCell += '"';
          i++;
        } else {
          // End of quoted cell
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++;
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== "")) rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== "")) rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  // Final cell & row if not flushed
  if (currentCell !== "" || inQuotes || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== "")) rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  // Normalize header keys: lowercase, remove non-alphanumeric except underscore
  const rawHeaders = rows[0];
  const headers = rawHeaders.map((h) =>
    h
      .toLowerCase()
      .trim()
      .replace(/[\s\-_]+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
  );

  const results: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const item: Record<string, string> = {};
    let hasValue = false;
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      const val = row[j] !== undefined ? row[j].trim() : "";
      if (val) hasValue = true;
      item[key] = val;
    }
    if (hasValue) results.push(item);
  }

  return results;
}

export function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSV(
  rows: Record<string, any>[],
  columns: { key: string; label: string }[]
): string {
  const headerLine = columns.map((col) => escapeCSVCell(col.label)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCSVCell(row[col.key])).join(",")
  );

  // Prepend UTF-8 BOM (\uFEFF) so Excel on Windows parses accents/special characters properly
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
}

