/**
 * Export an array of objects to a browser CSV download.
 * @param {object[]} data
 * @param {string}   filename   — without .csv extension
 * @param {string[]} [keys]     — column keys to include (defaults: all keys of first row)
 * @param {object}   [labels]   — { key: 'Header Label' } overrides
 */
export function exportCsv(data, filename = 'export', keys, labels = {}) {
  if (!data?.length) return

  const cols   = keys ?? Object.keys(data[0])
  const header = cols.map(k => labels[k] ?? k)

  const escape = (v) => {
    if (v == null) return ''
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const rows = [
    header.join(','),
    ...data.map(row => cols.map(k => escape(row[k])).join(',')),
  ]

  const blob = new Blob(['﻿' + rows.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
