/** Full-page panel: brand header, tabs, toast host. */
import React from 'react'
import type { SkillhubApi } from './api.ts'
import { DownloadedTab } from './downloaded.tsx'
import type { Translate } from './locale.ts'
import { MarketTab, type Notify } from './market.tsx'
import { styles } from './styles.ts'
import { Icon, Toast } from './ui.tsx'

export interface PanelEnv {
  api: SkillhubApi
  t: Translate
}

interface ToastState {
  id: number
  tone: 'info' | 'success' | 'error'
  message: string
}

/** The panel root. Both tabs stay mounted so search state survives tab switches. */
export function Page({ api, t }: PanelEnv): React.ReactElement {
  const [tab, setTab] = React.useState<'market' | 'downloaded'>('market')
  const [version, setVersion] = React.useState(0)
  const [toast, setToast] = React.useState<ToastState | null>(null)
  const timer = React.useRef<number | null>(null)

  const notify: Notify = React.useCallback((tone, message) => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    setToast({ id: Date.now(), tone, message })
    timer.current = window.setTimeout(() => { setToast(null); timer.current = null }, 4500)
  }, [])

  React.useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  return (
    <div className="shm-root" data-dsh-plugin="skillhub-market" data-dsh-skillhub-market-view="">
      <style>{styles}</style>
      <header className="shm-header">
        <div className="shm-brand">
          <div className="shm-logo"><Icon name="layers" size={21} /></div>
          <div style={{ minWidth: 0 }}>
            <h1 className="shm-title">{t('title')}</h1>
            <p className="shm-sub">{t('subtitle')}</p>
          </div>
        </div>
        <div className="shm-tabs" role="tablist" aria-label={t('title')}>
          <button
            type="button"
            role="tab"
            className="shm-tab"
            aria-selected={tab === 'market'}
            onClick={() => setTab('market')}
          >
            {t('tab.market')}
          </button>
          <button
            type="button"
            role="tab"
            className="shm-tab"
            aria-selected={tab === 'downloaded'}
            onClick={() => setTab('downloaded')}
          >
            {t('tab.downloaded')}
            {version > 0 ? <span className="shm-tab-count">{version}</span> : null}
          </button>
        </div>
      </header>
      <main className="shm-main">
        <div hidden={tab !== 'market'}>
          <MarketTab api={api} t={t} notify={notify} onInstalled={() => setVersion(value => value + 1)} />
        </div>
        <div hidden={tab !== 'downloaded'}>
          <DownloadedTab api={api} t={t} notify={notify} version={version} onGoMarket={() => setTab('market')} />
        </div>
      </main>
      {toast === null ? null : <Toast key={toast.id} message={toast.message} tone={toast.tone} />}
    </div>
  )
}
