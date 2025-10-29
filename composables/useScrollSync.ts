import { onMounted, onUnmounted, type Ref } from 'vue'

// Simple scroll sync: master <-> slaves (horizontal only by default).
// Avoids loops by checking current values before setting.
export function useScrollSync(
  master: Ref<HTMLElement | null>,
  slaves: Ref<HTMLElement | null>[],
  opts?: { vertical?: boolean; horizontal?: boolean; onChange?: (left:number, top:number) => void }
) {
  const vertical = opts?.vertical ?? false
  const horizontal = opts?.horizontal ?? true

  function onMasterScroll() {
    const m = master.value
    if (!m) return
    const l = horizontal ? m.scrollLeft : 0
    const t = vertical ? m.scrollTop : 0
    for (const s of slaves) {
      const el = s.value
      if (!el) continue
      if (horizontal && el.scrollLeft !== l) el.scrollLeft = l
      if (vertical && el.scrollTop !== t) el.scrollTop = t
    }
    opts?.onChange?.(l, t)
  }

  function onSlaveScroll(ev: Event) {
    const m = master.value
    const s = ev.currentTarget as HTMLElement
    if (!m || !s) return
    if (horizontal && m.scrollLeft !== s.scrollLeft) m.scrollLeft = s.scrollLeft
    if (vertical && m.scrollTop !== s.scrollTop) m.scrollTop = s.scrollTop
    opts?.onChange?.(horizontal ? s.scrollLeft : 0, vertical ? s.scrollTop : 0)
  }

  function setLeft(px: number) {
    const m = master.value
    if (!m) return
    if (m.scrollLeft !== px) m.scrollLeft = px
    for (const s of slaves) s.value && (s.value.scrollLeft = px)
  }

  onMounted(() => {
    if (master.value) master.value.addEventListener('scroll', onMasterScroll, { passive: true })
    for (const s of slaves) s.value && s.value.addEventListener('scroll', onSlaveScroll, { passive: true })
  })
  onUnmounted(() => {
    if (master.value) master.value.removeEventListener('scroll', onMasterScroll)
    for (const s of slaves) s.value && s.value.removeEventListener('scroll', onSlaveScroll)
  })

  return { setLeft }
}

