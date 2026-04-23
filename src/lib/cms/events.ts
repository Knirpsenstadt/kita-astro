import rawBaselineEvents from '../../content/events/events.json'
import { toYMD } from '../../utils/date'
import type { CmsEvent, CmsEventType } from './types'

const EVENT_TYPES: CmsEventType[] = ['parent', 'family', 'child', 'closure']
const LEGACY_TYPE_MAP: Record<string, CmsEventType> = {
  event: 'parent',
  festivity: 'family',
}

function normalizeType(value: unknown): CmsEventType {
  if (typeof value === 'string' && EVENT_TYPES.includes(value as CmsEventType)) {
    return value as CmsEventType
  }

  if (typeof value === 'string' && LEGACY_TYPE_MAP[value]) {
    return LEGACY_TYPE_MAP[value]
  }

  return 'parent'
}

function toEventId(value: string, index: number): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (cleaned) {
    return cleaned
  }

  return `event-${index + 1}`
}

export function normalizeEvents(value: unknown, limit = 300): CmsEvent[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index): CmsEvent | null => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const source = item as Partial<CmsEvent>
      const label = typeof source.label === 'string' ? source.label.trim() : ''
      const start = toYMD(source.start)
      const end = toYMD(source.end)
      if (!label || !start) {
        return null
      }

      const explicitId = typeof source.id === 'string' ? source.id.trim() : ''
      const id = toEventId(explicitId || `${label}-${start}`, index)
      const normalized: CmsEvent = {
        id,
        label,
        type: normalizeType(source.type),
        start,
      }

      if (end) {
        normalized.end = end
      }

      return normalized
    })
    .filter((item): item is CmsEvent => !!item)
    .slice(0, limit)
}

export function cloneEvents(events: CmsEvent[]): CmsEvent[] {
  return events.map((event) => ({ ...event }))
}

export function getBaselineEvents(): CmsEvent[] {
  return normalizeEvents(rawBaselineEvents)
}
