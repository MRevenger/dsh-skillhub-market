/** Downloaded skills: scan $DSH_HOME/skills, inspect SKILL.md, edit local metadata. */
import React from 'react'
import type { CustomSkillMeta, InstalledListResult, InstalledSkill } from '../shared/types.ts'
import { SkillhubApi } from './api.ts'
import { errorText, formatDate, frontmatterText, initials, sourceLabel } from './format.ts'
import type { Translate } from './locale.ts'
import { Markdown } from './markdown.tsx'
import { Badge, Button, Icon, Modal, Spinner } from './ui.tsx'
import type { Notify } from './market.tsx'

interface DownloadedProps {
  api: SkillhubApi
  t: Translate
  notify: Notify
  version: number
  onGoMarket: () => void
}

/** Category label from frontmatter or fallback. */
function metaText(value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  return frontmatterText(value)
}

/** The downloaded-skills tab. */
function metaSignature(displayName: string, note: string): string {
  return JSON.stringify([displayName.trim(), note.trim()])
}

export function DownloadedTab({ api, t, notify, version, onGoMarket }: DownloadedProps): React.ReactElement {
  const [data, setData] = React.useState<InstalledListResult | null>(null)
  const [meta, setMeta] = React.useState<Record<string, CustomSkillMeta>>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [reload, setReload] = React.useState(0)
  const [selected, setSelected] = React.useState<InstalledSkill | null>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [detailError, setDetailError] = React.useState<string | null>(null)
  const [displayName, setDisplayName] = React.useState('')
  const [note, setNote] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [savedSignature, setSavedSignature] = React.useState('')
  const savingRef = React.useRef(false)
  const [busyFolder, setBusyFolder] = React.useState<string | null>(null)
  const detailAbort = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    Promise.all([
      api.installed(controller.signal),
      api.custom(controller.signal).catch(() => ({ data: {} as Record<string, CustomSkillMeta> })),
    ])
      .then(([list, custom]) => {
        if (controller.signal.aborted) return
        setData(list)
        setMeta(custom.data)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(errorText(reason, t))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [api, t, version, reload])

  React.useEffect(() => () => detailAbort.current?.abort(), [])

  const openSkill = (skill: InstalledSkill): void => {
    detailAbort.current?.abort()
    const controller = new AbortController()
    detailAbort.current = controller
    setSelected(skill)
    setDetailError(null)
    setDetailLoading(true)
    setSaved(false)
    const savedMeta = meta[skill.slug] ?? meta[skill.name] ?? {}
    setDisplayName(savedMeta.displayName ?? '')
    setNote(savedMeta.note ?? '')
    setSavedSignature(metaSignature(savedMeta.displayName ?? '', savedMeta.note ?? ''))
    api.installedDetail(skill.slug, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted) return
        setSelected(detail)
        const freshMeta = meta[detail.slug] ?? meta[detail.name] ?? {}
        setDisplayName(freshMeta.displayName ?? '')
        setNote(freshMeta.note ?? '')
        setSavedSignature(metaSignature(freshMeta.displayName ?? '', freshMeta.note ?? ''))
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setDetailError(errorText(reason, t))
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false)
      })
  }

  const closeSkill = (): void => {
    detailAbort.current?.abort()
    setSelected(null)
    setDetailError(null)
    setDetailLoading(false)
  }

  const saveMeta = async (): Promise<void> => {
    if (selected === null || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      await api.saveCustom(selected.slug, displayName.trim(), note.trim())
      const effectiveName = displayName.trim() || selected.name || selected.slug
      setSelected(previous => previous === null ? null : {
        ...previous,
        displayName: effectiveName,
        ...(note.trim() === '' ? { note: undefined } : { note: note.trim() }),
      })
      setData(previous => previous === null ? null : {
        ...previous,
        skills: previous.skills.map(skill => skill.slug === selected.slug
          ? { ...skill, displayName: effectiveName, ...(note.trim() === '' ? { note: undefined } : { note: note.trim() }) }
          : skill),
      })
      setSaved(true)
      setSavedSignature(metaSignature(displayName, note))
      notify('success', t('toast.saved'))
      setReload(value => value + 1)
    } catch (reason) {
      notify('error', t('toast.saveFailed', { message: errorText(reason, t) }))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const saveOnBlur = (): void => {
    if (selected === null || savingRef.current) return
    if (metaSignature(displayName, note) !== savedSignature) void saveMeta()
  }

  const openFolder = async (skill: InstalledSkill): Promise<void> => {
    setBusyFolder(skill.slug)
    try {
      await api.openFolder(skill.slug)
    } catch (reason) {
      notify('error', t('toast.openFailed', { message: errorText(reason, t) }))
    } finally {
      setBusyFolder(null)
    }
  }

  const total = data?.skills.length ?? 0
  const selName = selected === null ? '' : selected.displayName || selected.name || selected.slug
  const selDescription = selected === null ? '' : selected.description || selected.descriptionZh || ''

  return (
    <div className="shm-pane">
      <div className="shm-dl-head">
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="shm-dl-path">
            {t('downloaded.root')}：<code>{data?.skillsRoot ?? '$DSH_HOME/skills'}</code>
          </div>
          <div className="shm-count" style={{ marginTop: 4 }}>
            {loading && data === null ? t('downloaded.loading') : t('downloaded.count', { count: total })}
          </div>
        </div>
        <Button icon="refresh" loading={loading} onClick={() => setReload(value => value + 1)}>{t('downloaded.refresh')}</Button>
      </div>

      {data?.metaError === undefined ? null : (
        <div className="shm-warnbox">
          <Icon name="alert" size={15} />
          {t('downloaded.metaError', { message: data.metaError })}
        </div>
      )}

      {error !== null ? (
        <div className="shm-error" role="alert">
          <div className="shm-error-icon"><Icon name="alert" size={22} /></div>
          <h3>{t('downloaded.error')}</h3>
          <p>{error}</p>
          <Button icon="refresh" onClick={() => setReload(value => value + 1)}>{t('common.retry')}</Button>
        </div>
      ) : loading && data === null ? (
        <div className="shm-skeletons">
          {Array.from({ length: 3 }, (_, index) => <div className="shm-skeleton" key={index} style={{ height: 190 }} />)}
        </div>
      ) : data !== null && data.skills.length === 0 ? (
        <div className="shm-empty">
          <div className="shm-empty-icon"><Icon name="package" size={22} /></div>
          <h3>{t('downloaded.empty')}</h3>
          <p>{t('downloaded.emptyHint')}</p>
          <Button variant="primary" icon="search" onClick={onGoMarket}>{t('tab.market')}</Button>
        </div>
      ) : data !== null ? (
        <div className="shm-dl-grid">
          {data.skills.map(skill => {
            const name = skill.displayName || skill.name || skill.slug
            const description = skill.description || skill.descriptionZh || skill.slug
            const custom = meta[skill.slug]?.displayName !== undefined && meta[skill.slug]?.displayName !== ''
            return (
              <article className="shm-dl-card" key={skill.slug}>
                <div className="shm-dl-card-head">
                  <div className="shm-avatar">{initials(name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="shm-dl-name" title={name}>{name}</h3>
                    <p className="shm-dl-slug">{skill.slug}{skill.version === undefined ? '' : ` · v${skill.version}`}</p>
                  </div>
                  {custom ? <Badge tone="blue">{t('downloaded.displayName')}</Badge> : null}
                </div>
                {skill.error === undefined ? null : <div className="shm-badges"><Badge tone="danger">{skill.error}</Badge></div>}
                <p className="shm-dl-desc">{description === '' ? '—' : description}</p>
                {skill.note === undefined || skill.note === '' ? null : <p className="shm-dl-note">{skill.note}</p>}
                <div className="shm-badges">
                  {skill.category === undefined || skill.category === '' ? null : <Badge>{skill.category}</Badge>}
                  {skill.requiresApiKey === true ? <Badge tone="warn">{t('card.apiKeyRequired')}</Badge> : null}
                  {skill.updatedAt === undefined ? null : <Badge><Icon name="clock" size={11} />{formatDate(skill.updatedAt)}</Badge>}
                </div>
                <div className="shm-dl-foot">
                  <Button variant="soft" onClick={() => openSkill(skill)}>{t('downloaded.viewDetail')}</Button>
                  <Button icon="folder" loading={busyFolder === skill.slug} onClick={() => { void openFolder(skill) }}>{t('downloaded.openFolder')}</Button>
                  <span className="shm-spacer" />
                  {skill.githubUrl === undefined ? null : (
                    <a className="shm-iconbtn" href={skill.githubUrl} target="_blank" rel="noreferrer noopener" title={t('downloaded.openGithub')} aria-label={t('downloaded.openGithub')}>
                      <Icon name="github" size={15} />
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : null}

      {selected === null ? null : (
        <Modal
          title={selName}
          subtitle={`${selected.slug} · ${selected.path}`}
          size="wide"
          onClose={closeSkill}
          footer={
            <>
              <Button variant="ghost" onClick={closeSkill}>{t('common.close')}</Button>
              <span className="shm-spacer" />
              <Button icon="folder" loading={busyFolder === selected.slug} onClick={() => { void openFolder(selected) }}>{t('downloaded.openFolder')}</Button>
              {selected.githubUrl === undefined ? null : (
                <a className="shm-btn" href={selected.githubUrl} target="_blank" rel="noreferrer noopener">
                  <Icon name="github" size={14} />{t('downloaded.openGithub')}
                </a>
              )}
            </>
          }
        >
          {detailLoading ? <div className="shm-loading" style={{ padding: '8px 0' }}><span className="shm-loading-title"><Spinner />{t('common.loading')}</span></div> : null}
          {detailError === null ? null : <div className="shm-warnbox"><Icon name="alert" size={15} />{t('downloaded.detailError')}：{detailError}</div>}

          <section className="shm-section">
            <div className="shm-editor">
              <div className="shm-field-block">
                <label htmlFor="shm-display-name">{t('downloaded.displayName')}</label>
                <input
                  id="shm-display-name"
                  className="shm-input"
                  value={displayName}
                  placeholder={t('downloaded.displayNamePlaceholder')}
                  onChange={(event) => { setDisplayName(event.target.value); setSaved(false) }}
                  onBlur={saveOnBlur}
                />
                <p className="shm-hint">{t('downloaded.customNameHint')}</p>
              </div>
              <div className="shm-field-block">
                <label htmlFor="shm-note">{t('downloaded.note')}</label>
                <textarea
                  id="shm-note"
                  className="shm-input"
                  value={note}
                  placeholder={t('downloaded.notePlaceholder')}
                  onChange={(event) => { setNote(event.target.value); setSaved(false) }}
                  onBlur={saveOnBlur}
                />
                <p className="shm-hint">{t('downloaded.reinstallHint')}</p>
              </div>
              <div className="shm-editor-actions">
                <Button variant="primary" loading={saving} onClick={() => { void saveMeta() }}>{saving ? t('downloaded.saving') : t('downloaded.save')}</Button>
                {saved ? <span className="shm-saved"><Icon name="check" size={13} /> {t('toast.saved')}</span> : null}
              </div>
            </div>
          </section>

          {selDescription === '' ? null : (
            <section className="shm-section">
              <h3 className="shm-section-title">{t('downloaded.description')}</h3>
              <p className="shm-overview">{selDescription}</p>
            </section>
          )}

          <section className="shm-section">
            <h3 className="shm-section-title">{t('detail.meta')}</h3>
            <dl className="shm-kv">
              <div><dt>{t('downloaded.originalName')}</dt><dd>{selected.name || '—'}</dd></div>
              <div><dt>{t('downloaded.slug')}</dt><dd>{selected.slug}</dd></div>
              <div><dt>{t('downloaded.dir')}</dt><dd style={{ overflowWrap: 'anywhere' }}>{selected.path}</dd></div>
              <div><dt>{t('detail.version')}</dt><dd>{selected.version ?? '—'}</dd></div>
              <div><dt>{t('detail.category')}</dt><dd>{selected.category ?? '—'}</dd></div>
              <div><dt>{t('detail.source')}</dt><dd>{sourceLabel(selected.frontmatter.source as string | undefined, t)}</dd></div>
              <div><dt>{t('detail.updated')}</dt><dd>{formatDate(selected.updatedAt)}</dd></div>
              <div><dt>{t('detail.requiresApiKey')}</dt><dd>{selected.requiresApiKey === undefined ? '—' : selected.requiresApiKey ? t('detail.yes') : t('detail.no')}</dd></div>
            </dl>
          </section>

          {Object.keys(selected.frontmatter).length === 0 ? null : (
            <section className="shm-section">
              <h3 className="shm-section-title">{t('downloaded.frontmatter')}</h3>
              <dl className="shm-kv">
                {Object.entries(selected.frontmatter).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{metaText(value) || '—'}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="shm-section">
            <h3 className="shm-section-title">{t('downloaded.body')}</h3>
            {selected.body.trim() === '' ? <p className="shm-overview">{t('downloaded.noBody')}</p> : <Markdown source={selected.body} />}
          </section>
        </Modal>
      )}
    </div>
  )
}
