// Lightweight current-month calendar. Highlights today and renders optional
// markers (e.g. last analysis, next scheduled scan) as colored dots.

export interface CalendarMarker {
  day: number
  label: string
  tone: 'indigo' | 'red' | 'emerald' | 'amber'
}

const TONE_DOT: Record<CalendarMarker['tone'], string> = {
  indigo: 'bg-indigo-500',
  red: 'bg-red-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function Calendar({ markers = [] }: { markers?: CalendarMarker[] }) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const markerByDay = new Map(markers.map((m) => [m.day, m]))
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-slate-900">{monthLabel}</div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="py-1 text-[10px] font-medium uppercase text-slate-400">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const isToday = day === today
          const marker = markerByDay.get(day)
          return (
            <div
              key={i}
              title={marker?.label}
              className={`relative flex h-8 items-center justify-center rounded-md text-xs ${
                isToday
                  ? 'bg-indigo-600 font-semibold text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {day}
              {marker && !isToday && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${TONE_DOT[marker.tone]}`}
                />
              )}
            </div>
          )
        })}
      </div>
      {markers.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-slate-100 pt-2">
          {markers.map((m, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
              <span className={`h-2 w-2 rounded-full ${TONE_DOT[m.tone]}`} />
              <span className="font-medium text-slate-700">{m.day}</span> {m.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
