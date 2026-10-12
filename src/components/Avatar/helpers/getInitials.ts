export function getInitials(label: string) {
  const cleanLabel = label.replace(/^\+/, '').trim()

  if (/^\d/.test(cleanLabel)) {
    return cleanLabel.slice(-2)
  }

  return cleanLabel
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('ru') || 'ЧТ'
}
