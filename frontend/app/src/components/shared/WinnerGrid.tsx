import { forwardRef, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import type { WinnerPublic } from '../../api/winners'

interface Props {
  winners: WinnerPublic[]
  gap?: number
  renderCard: (winner: WinnerPublic) => ReactNode
}

const MIN_COL = 320
const MAX_COL = 440

/**
 * Uniform wall. Cards in a row share one height (the story area is capped at six lines, so rows
 * stay close to equal), and a partly-filled last row is centred rather than left-aligned.
 * When a card is expanded via "Read more", every card's current height is locked first, so only
 * the opened card grows — its neighbours keep exactly the size they had. The locks are released
 * once everything is collapsed again.
 *
 * Golden Ticket winners are full-width feature cards above the grid.
 */
const WinnerGrid = forwardRef<HTMLDivElement, Props>(function WinnerGrid(
  { winners, gap = 24, renderCard },
  ref,
) {
  const holder = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  const [locked, setLocked] = useState<Record<number, number>>({})

  useEffect(() => {
    const el = holder.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const featured = winners.filter((w) => w.golden_ticket)
  const regular = winners.filter((w) => !w.golden_ticket)

  const columnCount = Math.max(
    1,
    Math.min(regular.length || 1, Math.floor((width + gap) / (MIN_COL + gap)) || 1),
  )

  /* Runs before the card's own toggle handler: on expand, freeze every cell at its current height. */
  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest('button[aria-expanded]')
    if (!button || !holder.current) return
    if (button.getAttribute('aria-expanded') === 'false') {
      const next: Record<number, number> = {}
      holder.current.querySelectorAll<HTMLElement>('[data-cell]').forEach((cell) => {
        next[Number(cell.dataset.cell)] = cell.offsetHeight
      })
      setLocked((prev) => ({ ...next, ...prev }))
    } else {
      window.setTimeout(() => {
        if (!holder.current?.querySelector('[aria-expanded="true"]')) setLocked({})
      }, 400)
    }
  }

  const setRefs = (node: HTMLDivElement | null) => {
    holder.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  return (
    <div ref={setRefs} className="flex flex-col" style={{ gap }} onClickCapture={handleClickCapture}>
      {featured.map((w) => renderCard(w))}
      <div
        className="mx-auto flex w-full flex-wrap justify-center has-[[aria-expanded=true]]:items-start"
        style={{ gap, maxWidth: columnCount * MAX_COL + (columnCount - 1) * gap }}
      >
        {regular.map((w) => (
          <div
            key={w.id}
            data-cell={w.id}
            className="flex min-w-0 flex-col"
            style={{
              flex: `0 0 calc((100% - ${gap * (columnCount - 1)}px) / ${columnCount})`,
              minHeight: locked[w.id],
            }}
          >
            {renderCard(w)}
          </div>
        ))}
      </div>
    </div>
  )
})

export default WinnerGrid
