/** Browser entry: register the locale, sidebar entry and full-page panel. */
import React from 'react'
import { SkillhubApi } from './api.ts'
import { makeTranslator, en, zh, type Translate } from './locale.ts'
import { Page } from './page.tsx'
import { Icon } from './ui.tsx'

const PANEL_ID = 'skillhub-market'
const NS = 'skillhub-market'

interface Disposable {
  (): void
}

interface LocaleService {
  register: (namespace: string, dictionaries: Record<string, Record<string, string>>) => Disposable
  bind: (namespace: string) => (key: string) => string
}

interface SlotsService {
  inject: (slot: string, callback: () => Disposable) => Disposable
  register: (options: Record<string, unknown>, component: unknown) => Disposable
}

interface ClientContext {
  slots?: SlotsService
  locale?: LocaleService
  effect?: (callback: () => Disposable | void, label?: string) => Disposable | void
  logger?: { warn?: (message: string) => void }
}

/** Sidebar glyph; the row itself is provided by the host. */
function PanelIcon({ size = 18 }: { size?: number; active?: boolean }): React.ReactElement {
  return (
    <span data-dsh-panel-entry={PANEL_ID} style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
      <Icon name="layers" size={size} />
    </span>
  )
}

/** Register everything inside apply so the host can dispose it cleanly. */
function apply(ctx: ClientContext): void {
  const disposers: Disposable[] = []
  const warn = (message: string): void => { ctx.logger?.warn?.(message) }

  let translate: Translate = makeTranslator((key) => zh[key as keyof typeof zh] ?? key)
  const locale = ctx.locale
  if (locale !== undefined) {
    const register = (): Disposable => {
      try {
        return locale.register(NS, { zh, en })
      } catch (error) {
        warn(`skillhub-market: 注册语言包失败：${error instanceof Error ? error.message : String(error)}`)
        return () => {}
      }
    }
    if (typeof ctx.effect === 'function') ctx.effect(register, 'skillhub-market: dictionaries')
    else disposers.push(register())
    try {
      const bound = locale.bind(NS)
      translate = makeTranslator(bound)
    } catch {
      /* keep Chinese fallback */
    }
  }

  const slots = ctx.slots
  if (slots === undefined) {
    warn('skillhub-market: 当前宿主未提供 slots，面板未注册')
    for (const dispose of disposers) { try { dispose() } catch { /* ignore */ } }
    return
  }

  const api = new SkillhubApi()

  const registerSidebar = (): Disposable => {
    try {
      return slots.inject('sidebar.panellist', () => slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 40,
        label: () => translate('entry.label'),
      }, PanelIcon))
    } catch (error) {
      warn(`skillhub-market: 注册侧边栏入口失败：${error instanceof Error ? error.message : String(error)}`)
      return () => {}
    }
  }

  const registerPage = (): Disposable => {
    try {
      return slots.inject('main', () => slots.register({
        name: 'main',
        key: PANEL_ID,
        inject: () => ({ api, t: translate }),
      }, Page as never))
    } catch (error) {
      warn(`skillhub-market: 注册主面板失败：${error instanceof Error ? error.message : String(error)}`)
      return () => {}
    }
  }

  if (typeof ctx.effect === 'function') {
    ctx.effect(registerSidebar, 'skillhub-market: sidebar entry')
    ctx.effect(registerPage, 'skillhub-market: main panel')
  } else {
    disposers.push(registerSidebar(), registerPage())
  }

  // The host owns disposal through ctx.effect; this is only a safety net for
  // hosts without effect support.
  void disposers
}

const inject = ['slots', 'locale', 'layout']
export { apply, inject }
