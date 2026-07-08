import { useEffect, useRef, type DependencyList } from 'react'
import gsap from 'gsap'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Stagger-reveals every descendant matching `selector` whenever `deps` change.
 * Attach the returned ref to the container. Elements start hidden and rise in.
 */
export function useStaggerReveal<T extends HTMLElement>(
  selector: string,
  deps: DependencyList,
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const targets = container.querySelectorAll(selector)
    if (!targets.length) return

    if (prefersReducedMotion()) {
      gsap.set(targets, { clearProps: 'all' })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          ease: 'power3.out',
          stagger: 0.06,
          clearProps: 'transform,opacity,visibility',
          overwrite: 'auto',
        },
      )
    }, container)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

/**
 * Fades and slides the container in whenever `key` changes.
 * Used for tab-panel transitions.
 */
export function usePanelTransition<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity,visibility' },
    )
    return () => {
      tween.kill()
    }
  }, [key])

  return ref
}

/** Pops an element in with a springy scale — for checkmarks and badges appearing. */
export function popIn(el: Element | null) {
  if (!el || prefersReducedMotion()) return
  gsap.fromTo(
    el,
    { scale: 0.5, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(2.2)', clearProps: 'transform,opacity,visibility' },
  )
}
