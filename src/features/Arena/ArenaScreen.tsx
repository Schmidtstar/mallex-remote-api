import React, { useMemo, useState, useEffect } from 'react'
import { useCategories } from './categories'
import { useTranslation } from 'react-i18next'
import { useSwipe } from '@/hooks/useSwipe'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function ArenaScreen() {
  const { t } = useTranslation()
  const categories = useCategories()
  const [catId, setCatId] = useState(categories[0].id)
  const current = useMemo(() => categories.find(c => c.id === catId)!, [catId, categories])
  const [item, setItem] = useState(() => pick(current.items))

  useEffect(() => { setItem(pick(current.items)) }, [current])

  const swipe = useSwipe<HTMLDivElement>({
    onSwipeLeft: () => setItem(pick(current.items)),
    onSwipeRight: () => setItem(pick(current.items)),
    stopPropagation: true  // don't bubble to TabLayout
  })

  return (
    <section>
      <h1>{t('arena.title')}</h1>
      <select value={catId} onChange={(e)=> setCatId(e.target.value)}>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <div className="card glass" style={{ marginTop: 12 }} {...swipe}>
        <p style={{ minHeight: 64, display:'flex', alignItems:'center' }}>{item}</p>
        <small style={{opacity:.7}}>{t('arena.tip')}</small>
      </div>

      <button onClick={() => setItem(pick(current.items))} style={{ marginTop: 12 }}>
        {t('arena.new')}
      </button>
    </section>
  )
}
