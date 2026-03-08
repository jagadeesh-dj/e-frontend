export type CsvRow = Record<string, string>

const parseCsvLine = (line: string): string[] => {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

export const parseCsv = (input: string): CsvRow[] => {
  const lines = input
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((header) => header.trim())
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i])
    const row: CsvRow = {}

    headers.forEach((header, index) => {
      row[header] = (cells[index] || '').trim()
    })

    rows.push(row)
  }

  return rows
}

const normalizeKey = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, '_')

export const getCsvField = (row: CsvRow, key: string): string => {
  const target = normalizeKey(key)
  const matchedKey = Object.keys(row).find((rowKey) => normalizeKey(rowKey) === target)
  return matchedKey ? row[matchedKey] : ''
}

const toCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) {
    return JSON.stringify(value)
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  const raw = String(value)
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

export const downloadCsv = (
  filename: string,
  rows: Array<Record<string, unknown>>,
  columns?: string[]
) => {
  if (rows.length === 0) return

  const headers = columns && columns.length > 0 ? columns : Object.keys(rows[0])
  const headerLine = headers.join(',')
  const bodyLines = rows.map((row) => headers.map((header) => toCsvCell(row[header])).join(','))
  const csv = [headerLine, ...bodyLines].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

