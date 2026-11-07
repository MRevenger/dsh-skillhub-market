/** Online Skillhub market: search, sort, filters, detail and install. */
import React from 'react'
import type {
  ApiKeyFilter,
  CategoryOption,
  RemoteSkill,
  SkillListResult,
  SkillQuery,
  SortKey,
  SourceKey,
} from '../shared/types.ts'
import { ApiError, SkillhubApi } from './api.ts'
import { errorText, formatCount, formatDate, initials, sourceLabel } from './format.ts'
import type { Translate } from './locale.ts'
import { Markdown } from './markdown.tsx'
import { Badge, Button, Icon, Modal, Spinner } from './ui.tsx'

const PAGE_SIZE = 24

const SORTS: SortKey[] = ['all', 'trending', 'downloads', 'newest']
const SOURCES: SourceKey[] = ['all', 'community', 'clawhub', 'enterprise']
const API_KEYS: ApiKeyFilter[] = ['all', 'required', 'none']

export interface Notify {
  (tone: 'info' | 'success' | 'error', message: string): void
}

interface MarketProps {
  api: SkillhubApi
  t: Translate
  notify: Notify
  onInstalled: () => void
}

/** Avatar with a graceful fallback when the remote image fails. */
function Avatar({ src, label }: { src: string | undefined; label: string }): React.ReactElement {
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => setFailed(false), [src])
  if (src === undefined || src === '' || failed) return <div className="shm-avatar">{initials(label)}</div>
  return (
    <div className="shm-avatar">
      <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
    </div>
  )
}

/** Translate a category key using live options, falling back to the raw key. */
function categoryName(key: string | undefined, options: CategoryOption[]): string {
  if (key === undefined || key === '') return ''
  return options.find(option => option.key === key)?.name ?? key
}

/** The online market tab. */
export function MarketTab({ api, t, notify, onInstalled }: MarketProps): React.ReactElement {
  const [keywordInput, setKeywordInput] = React.useState('')
  const [keyword, setKeyword] = React.useState('')
  const [sort, setSort] = React.useState<SortKey>('all')
  const [source, setSource] = React.useState<SourceKey>('all')
  const [category, setCategory] = React.useState('all')
  const [apiKey, setApiKey] = React.useState<ApiKeyFilter>('all')
  const [page, setPage] = React.useState(1)
  const [reload, setReload] = React.useState(0)
  const [result, setResult] = React.useState<SkillListResult | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [categories, setCategories] = React.useState<CategoryOption[]>([])
  const [categoryFallback, setCategoryFallback] = React.useState(false)
  const [installed, setInstalled] = React.useState<Set<string>>(new Set())
  const [detailSkill, setDetailSkill] = React.useState<RemoteSkill | null>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [detailError, setDetailError] = React.useState<string | null>(null)
  const [busySlug, setBusySlug] = React.useState<string | null>(null)
  const [overwrite, setOverwrite] = React.useState<RemoteSkill | null>(null)
  const detailAbort = React.useRef<AbortController | null>(null)

  // Debounced search: the URL query only changes after 350 ms of typing.
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(keywordInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [keywordInput])

  // Load live category names once.
  React.useEffect(() => {
    const controller = new AbortController()
    api.categories(controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return
        setCategories(response.items)
        setCategoryFallback(response.fallback === true)
      })
      .catch(() => { /* filters remain usable with category keys */ })
    return () => controller.abort()
  }, [api])

  // Keep "已下载" badges in sync with the local skills directory.
  React.useEffect(() => {
    const controller = new AbortController()
    api.installed(controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setInstalled(new Set(response.skills.map(skill => skill.slug)))
      })
      .catch(() => { /* badge is optional */ })
    return () => controller.abort()
  }, [api])

  // Fetch the current page.
  React.useEffect(() => {
    const controller = new AbortController()
    const query: SkillQuery = {
      keyword,
      page,
      pageSize: PAGE_SIZE,
      sort,
      source,
      category,
      apiKey,
    }
    setLoading(true)
    setError(null)
    api.list(query, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return
        setResult(response)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(errorText(reason, t))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [api, keyword, sort, source, category, apiKey, page, reload])

  React.useEffect(() => () => detailAbort.current?.abort(), [])

  const total = result?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeFilters = keyword !== '' || sort !== 'all' || source !== 'all' || category !== 'all' || apiKey !== 'all'

  const resetFilters = (): void => {
    setKeywordInput('')
    setKeyword('')
    setSort('all')
    setSource('all')
    setCategory('all')
    setApiKey('all')
    setPage(1)
  }

  const openDetail = (skill: RemoteSkill): void => {
    detailAbort.current?.abort()
    const controller = new AbortController()
    detailAbort.current = controller
    setDetailSkill(skill)
    setDetailError(null)
    setDetailLoading(true)
    api.detail(skill.slug, skill.namespaceHandle, controller.signal)
      .then((detail) => {
        if (!controller.signal.aborted) setDetailSkill(detail)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        notify('error', t('toast.detailFailed', { message: errorText(reason, t) }))
        setDetailError(errorText(reason, t))
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false)
      })
  }

  const closeDetail = (): void => {
    detailAbort.current?.abort()
    setDetailSkill(null)
    setDetailError(null)
    setDetailLoading(false)
  }

  const install = async (skill: RemoteSkill, overwriteExisting: boolean): Promise<void> => {
    setBusySlug(skill.slug)
    try {
      const result = await api.install(
        skill.slug,
        overwriteExisting,
        skill.githubUrl ?? skill.homepage ?? undefined,
      )
      setInstalled(previous => new Set(previous).add(result.slug))
      setOverwrite(null)
      notify('success', t('toast.installSuccess', { name: skill.displayName || skill.name || skill.slug }))
      if (result.metaWarning !== undefined) notify('info', t('toast.installMetaWarning', { message: result.metaWarning }))
      onInstalled()
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        setOverwrite(skill)
      } else {
        notify('error', t('toast.installFailed', { message: errorText(reason, t) }))
      }
    } finally {
      setBusySlug(null)
    }
  }

  const detailName = detailSkill === null ? '' : detailSkill.displayName || detailSkill.name || detailSkill.slug
  const detailDescription = detailSkill === null ? '' : detailSkill.description || detailSkill.descriptionZh || ''

  return (
    <div className="shm-pane">
      <div className="shm-toolbar">
        <div className="shm-search">
          <Icon name="search" size={16} />
          <input
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
            spellCheck={false}
          />
          {keywordInput === '' ? null : (
            <button type="button" className="shm-iconbtn" aria-label={t('search.clear')} onClick={() => setKeywordInput('')}>
              <Icon name="close" size={15} />
            </button>
          )}
        </div>
        <div className="shm-sort" role="group" aria-label={t('sort.label')}>
          {SORTS.map(option => (
            <button
              key={option}
              type="button"
              className="shm-sortbtn"
              aria-pressed={sort === option}
              title={option === 'trending' ? t('sort.trendingHint') : undefined}
              onClick={() => { setSort(option); setPage(1) }}
            >
              {t(`sort.${option}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="shm-filters">
        <div className="shm-field">
          <label htmlFor="shm-source">{t('filter.source')}</label>
          <select id="shm-source" className="shm-select" value={source} onChange={(event) => { setSource(event.target.value as SourceKey); setPage(1) }}>
            {SOURCES.map(option => <option key={option} value={option}>{option === 'all' ? t('filter.all') : t(`source.${option}`)}</option>)}
          </select>
        </div>
        <div className="shm-field">
          <label htmlFor="shm-category">{t('filter.category')}</label>
          <select
            id="shm-category"
            className="shm-select"
            value={category}
            title={categoryFallback ? t('list.error') : undefined}
            onChange={(event) => { setCategory(event.target.value); setPage(1) }}
          >
            <option value="all">{t('filter.all')}</option>
            {categories.map(option => <option key={option.key} value={option.key}>{option.name}</option>)}
          </select>
        </div>
        <div className="shm-field">
          <label htmlFor="shm-apikey">{t('filter.apiKey')}</label>
          <select id="shm-apikey" className="shm-select" value={apiKey} onChange={(event) => { setApiKey(event.target.value as ApiKeyFilter); setPage(1) }}>
            {API_KEYS.map(option => (
              <option key={option} value={option}>
                {option === 'all' ? t('filter.all') : option === 'required' ? t('apiKey.required') : t('apiKey.none')}
              </option>
            ))}
          </select>
        </div>
        {activeFilters ? <button type="button" className="shm-reset" onClick={resetFilters}>{t('filter.reset')}</button> : null}
      </div>

      <div className="shm-summary" aria-live="polite">
        <span className="shm-count">
          {loading && result === null ? t('list.loading') : t('list.total', { total })}
          {' · '}
          {t('list.pageSize', { size: PAGE_SIZE })}
        </span>
        {loading && result !== null ? <Spinner size={12} /> : null}
      </div>

      {error !== null ? (
        <div className="shm-error" role="alert">
          <div className="shm-error-icon"><Icon name="alert" size={22} /></div>
          <h3>{t('list.error')}</h3>
          <p>{error}</p>
          <Button icon="refresh" onClick={() => setReload(value => value + 1)}>{t('list.retry')}</Button>
        </div>
      ) : loading && result === null ? (
        <div className="shm-skeletons" aria-label={t('list.loading')}>
          {Array.from({ length: 6 }, (_, index) => <div className="shm-skeleton" key={index} />)}
        </div>
      ) : result !== null && result.items.length === 0 ? (
        <div className="shm-empty">
          <div className="shm-empty-icon"><Icon name="search" size={22} /></div>
          <h3>{t('list.empty')}</h3>
          <p>{t('list.emptyHint')}</p>
          {activeFilters ? <Button icon="refresh" onClick={resetFilters}>{t('filter.reset')}</Button> : null}
        </div>
      ) : result !== null ? (
        <>
          <div className="shm-grid">
            {result.items.map(skill => {
              const name = skill.displayName || skill.name || skill.slug
              const description = skill.description || skill.descriptionZh || ''
              const isInstalled = installed.has(skill.slug)
              const busy = busySlug === skill.slug
              return (
                <article className="shm-card" key={skill.slug}>
                  <div className="shm-card-head">
                    <Avatar src={skill.iconUrl} label={name} />
                    <div className="shm-card-title">
                      <h3 className="shm-card-name" title={name}>{name}</h3>
                      <p className="shm-card-sub">
                        {sourceLabel(skill.source, t)}
                        {skill.category === undefined || skill.category === '' ? '' : ` · ${categoryName(skill.category, categories)}`}
                      </p>
                    </div>
                    {isInstalled ? <Badge tone="green">{t('card.installed')}</Badge> : null}
                  </div>
                  <p className="shm-card-desc" title={description}>{description === '' ? '—' : description}</p>
                  <div className="shm-badges">
                    {skill.requiresApiKey === true ? <Badge tone="warn">{t('card.apiKeyRequired')}</Badge> : null}
                    {skill.requiresApiKey === false ? <Badge>{t('card.apiKeyNone')}</Badge> : null}
                    {skill.version === undefined || skill.version === '' ? null : <Badge>{skill.version}</Badge>}
                    {(skill.tags ?? []).slice(0, 2).map(tag => <Badge key={tag}>#{tag}</Badge>)}
                  </div>
                  <div className="shm-card-meta">
                    <span><Icon name="download" size={13} />{formatCount(skill.downloads)}</span>
                    <span><Icon name="spark" size={13} />{formatCount(skill.stars)}</span>
                    <span><Icon name="clock" size={13} />{formatDate(skill.updatedAt)}</span>
                  </div>
                  <div className="shm-card-foot">
                    <Button variant="soft" onClick={() => openDetail(skill)}>{t('card.view')}</Button>
                    {skill.githubUrl !== undefined ? (
                      <a className="shm-btn" href={skill.githubUrl} target="_blank" rel="noreferrer noopener">
                        <Icon name="github" size={14} />{t('card.github')}
                      </a>
                    ) : (
                      <a className="shm-btn" href={skill.skillhubUrl} target="_blank" rel="noreferrer noopener">
                        <Icon name="external" size={14} />{t('card.skillhub')}
                      </a>
                    )}
                    <span className="shm-spacer" />
                    {skill.githubUrl === undefined ? null : (
                      <a className="shm-iconbtn" href={skill.skillhubUrl} target="_blank" rel="noreferrer noopener" title={t('card.skillhub')} aria-label={t('card.skillhub')}>
                        <Icon name="external" size={15} />
                      </a>
                    )}
                    <Button
                      variant="primary"
                      loading={busy}
                      disabled={busySlug !== null}
                      onClick={() => { void install(skill, false) }}
                    >
                      {busy ? t('card.downloading') : isInstalled ? t('card.redownload') : t('card.download')}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
          {pages > 1 ? (
            <div className="shm-pagination">
              <Button icon="chevron-left" disabled={page <= 1 || loading} onClick={() => setPage(value => Math.max(1, value - 1))}>{t('list.prev')}</Button>
              <span className="shm-page-info">{t('list.page', { page, pages })}</span>
              <Button disabled={page >= pages || loading} onClick={() => setPage(value => Math.min(pages, value + 1))}>
                {t('list.next')}<Icon name="chevron-right" size={14} />
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="shm-footer">{t('footer.sourceApi')}</div>

      {detailSkill === null ? null : (
        <Modal
          title={detailName}
          subtitle={detailSkill.slug}
          size="wide"
          onClose={closeDetail}
          footer={
            <>
              <Button variant="ghost" onClick={closeDetail}>{t('common.close')}</Button>
              <span className="shm-spacer" />
              <a className="shm-btn" href={detailSkill.skillhubUrl} target="_blank" rel="noreferrer noopener">
                <Icon name="external" size={14} />{t('detail.skillhub')}
              </a>
              {detailSkill.githubUrl === undefined ? null : (
                <a className="shm-btn" href={detailSkill.githubUrl} target="_blank" rel="noreferrer noopener">
                  <Icon name="github" size={14} />{t('detail.github')}
                </a>
              )}
              <Button
                variant="primary"
                loading={busySlug === detailSkill.slug}
                disabled={busySlug !== null}
                onClick={() => { void install(detailSkill, false) }}
              >
                {busySlug === detailSkill.slug ? t('detail.installing') : t('detail.install')}
              </Button>
            </>
          }
        >
          {detailLoading ? (
            <div className="shm-loading"><span className="shm-loading-title"><Spinner />{t('detail.loading')}</span></div>
          ) : null}
          {detailError === null ? null : <div className="shm-warnbox"><Icon name="alert" size={15} />{t('detail.error')}</div>}
          {detailDescription === '' ? null : (
            <section className="shm-section">
              <h3 className="shm-section-title">{t('detail.overview')}</h3>
              <p className="shm-overview">{detailDescription}</p>
            </section>
          )}
          <section className="shm-section">
            <h3 className="shm-section-title">{t('detail.meta')}</h3>
            <dl className="shm-kv">
              <div><dt>{t('detail.source')}</dt><dd>{sourceLabel(detailSkill.source, t)}</dd></div>
              <div><dt>{t('detail.category')}</dt><dd>{categoryName(detailSkill.category, categories) || '—'}</dd></div>
              <div><dt>{t('detail.version')}</dt><dd>{detailSkill.version ?? '—'}</dd></div>
              <div><dt>{t('detail.updated')}</dt><dd>{formatDate(detailSkill.updatedAt)}</dd></div>
              <div><dt>{t('detail.downloads')}</dt><dd>{formatCount(detailSkill.downloads)}</dd></div>
              <div><dt>{t('detail.stars')}</dt><dd>{formatCount(detailSkill.stars)}</dd></div>
              <div><dt>{t('detail.installs')}</dt><dd>{formatCount(detailSkill.installs)}</dd></div>
              <div>
                <dt>{t('detail.requiresApiKey')}</dt>
                <dd>{detailSkill.requiresApiKey === undefined ? '—' : detailSkill.requiresApiKey ? t('detail.yes') : t('detail.no')}</dd>
              </div>
            </dl>
          </section>
          {(detailSkill.tags ?? []).length === 0 ? null : (
            <section className="shm-section">
              <h3 className="shm-section-title">{t('detail.tags')}</h3>
              <div className="shm-taglist">{detailSkill.tags.map(tag => <Badge key={tag}>#{tag}</Badge>)}</div>
            </section>
          )}
          {detailSkill.overviewMd === undefined || detailSkill.overviewMd === '' ? null : (
            <section className="shm-section">
              <h3 className="shm-section-title">{t('detail.overview')}</h3>
              <Markdown source={detailSkill.overviewMd} />
            </section>
          )}
        </Modal>
      )}

      {overwrite === null ? null : (
        <Modal
          title={t('overwrite.title')}
          size="sm"
          onClose={() => { if (busySlug === null) setOverwrite(null) }}
          footer={
            <>
              <Button variant="ghost" disabled={busySlug !== null} onClick={() => setOverwrite(null)}>{t('overwrite.cancel')}</Button>
              <Button
                variant="danger"
                loading={busySlug === overwrite.slug}
                disabled={busySlug !== null}
                onClick={() => { void install(overwrite, true) }}
              >
                {t('overwrite.confirm')}
              </Button>
            </>
          }
        >
          <p className="shm-overview">
            {t('overwrite.body', {
              name: overwrite.displayName || overwrite.name || overwrite.slug,
              path: 'DSH skills/' + overwrite.slug,
            })}
          </p>
        </Modal>
      )}
    </div>
  )
}
