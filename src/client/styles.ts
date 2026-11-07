/** Scoped panel styles. Rendered inside the panel root, never appended to <body>. */
export const styles = `
.shm-root {
  --shm-surface: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 92%, var(--dsw-alias-label-primary, #111) 4%);
  --shm-surface-strong: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 86%, var(--dsw-alias-label-primary, #111) 8%);
  --shm-border: color-mix(in srgb, var(--dsw-alias-border-l3, #888) 55%, transparent);
  --shm-text: var(--dsw-alias-label-primary, #111);
  --shm-muted: var(--dsw-alias-label-tertiary, #6b7280);
  --shm-accent: var(--dsw-static-blue-500, #3b82f6);
  --shm-accent-soft: color-mix(in srgb, var(--dsw-static-blue-500, #3b82f6) 12%, transparent);
  --shm-danger: var(--dsw-alias-state-error-primary, #dc2626);
  --shm-success: var(--dsw-alias-state-success-primary, #16a34a);
  --shm-warn: var(--dsw-alias-state-warn-primary, #d97706);
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--shm-text);
  background: var(--dsw-alias-bg-base, #fff);
  font-size: 14px;
  line-height: 1.55;
}
.shm-root *, .shm-root *::before, .shm-root *::after { box-sizing: border-box; }
.shm-root button, .shm-root input, .shm-root select, .shm-root textarea { font: inherit; color: inherit; }
.shm-root a { color: var(--shm-accent); text-decoration: none; }
.shm-root a:hover { text-decoration: underline; }
.shm-root ::-webkit-scrollbar { width: 10px; height: 10px; }
.shm-root ::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--shm-muted) 30%, transparent);
  border-radius: 8px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.shm-header {
  flex: none;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 16px 24px 0;
  border-bottom: 1px solid var(--shm-border);
  background: var(--dsw-alias-bg-base, #fff);
  z-index: 3;
}
.shm-brand { display: flex; align-items: center; gap: 12px; min-width: 0; padding-bottom: 14px; }
.shm-logo {
  width: 38px; height: 38px; flex: none;
  display: grid; place-items: center;
  border-radius: 12px;
  color: var(--dsw-alias-label-primary-inverted, #fff);
  background: linear-gradient(140deg, var(--dsw-static-blue-400, #60a5fa), var(--dsw-static-blue-600, #2563eb));
  box-shadow: 0 6px 18px color-mix(in srgb, var(--dsw-static-blue-500, #3b82f6) 30%, transparent);
}
.shm-title { margin: 0; font-size: 17px; font-weight: 650; letter-spacing: -0.01em; white-space: nowrap; }
.shm-sub { margin: 0; color: var(--shm-muted); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.shm-tabs { display: flex; gap: 4px; align-self: flex-end; margin-left: auto; }
.shm-tab {
  border: 0; background: transparent; cursor: pointer;
  padding: 10px 14px 12px;
  color: var(--shm-muted);
  border-bottom: 2px solid transparent;
  font-weight: 550;
  transition: color .15s, border-color .15s;
}
.shm-tab:hover { color: var(--shm-text); }
.shm-tab[aria-selected="true"] { color: var(--shm-text); border-bottom-color: var(--shm-accent); }
.shm-tab-count {
  display: inline-block; margin-left: 6px; padding: 0 6px;
  border-radius: 999px; font-size: 11px; line-height: 18px;
  background: var(--shm-surface-strong); color: var(--shm-muted);
}

.shm-main { flex: 1; min-height: 0; overflow: auto; padding: 18px 24px 32px; }
.shm-pane[hidden] { display: none !important; }
.shm-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.shm-search {
  flex: 1 1 320px; min-width: 220px;
  display: flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 10px 0 12px;
  border: 1px solid var(--shm-border); border-radius: 10px;
  background: var(--shm-surface);
  transition: border-color .15s, box-shadow .15s;
}
.shm-search:focus-within { border-color: var(--shm-accent); box-shadow: 0 0 0 3px var(--shm-accent-soft); }
.shm-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; height: 100%; }
.shm-search input::placeholder { color: var(--shm-muted); }
.shm-iconbtn {
  flex: none; display: grid; place-items: center; width: 26px; height: 26px;
  border: 0; border-radius: 7px; background: transparent; color: var(--shm-muted); cursor: pointer;
}
.shm-iconbtn:hover { background: var(--shm-surface-strong); color: var(--shm-text); }
.shm-sort { display: flex; gap: 2px; padding: 3px; border-radius: 10px; background: var(--shm-surface); border: 1px solid var(--shm-border); }
.shm-sortbtn {
  border: 0; background: transparent; border-radius: 7px; cursor: pointer;
  padding: 6px 11px; color: var(--shm-muted); font-size: 13px; font-weight: 550; white-space: nowrap;
}
.shm-sortbtn:hover { color: var(--shm-text); }
.shm-sortbtn[aria-pressed="true"] { background: var(--dsw-alias-bg-base, #fff); color: var(--shm-text); box-shadow: 0 1px 3px color-mix(in srgb, #000 14%, transparent); }
.shm-sortbtn[title] { cursor: help; }

.shm-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 12px; }
.shm-field { display: flex; align-items: center; gap: 7px; }
.shm-field > label { color: var(--shm-muted); font-size: 12.5px; white-space: nowrap; }
.shm-select, .shm-input {
  height: 34px; border: 1px solid var(--shm-border); border-radius: 8px;
  background: var(--shm-surface); padding: 0 9px; outline: 0; color: var(--shm-text);
}
.shm-select:focus, .shm-input:focus { border-color: var(--shm-accent); box-shadow: 0 0 0 3px var(--shm-accent-soft); }
.shm-select { max-width: 190px; }
.shm-summary { display: flex; align-items: center; gap: 12px; margin: 16px 0 12px; min-height: 24px; }
.shm-count { color: var(--shm-muted); font-size: 12.5px; }
.shm-reset { border: 0; background: transparent; color: var(--shm-accent); cursor: pointer; padding: 2px 4px; font-size: 12.5px; }
.shm-reset:hover { text-decoration: underline; }

.shm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.shm-card {
  display: flex; flex-direction: column; min-height: 230px;
  padding: 16px; border: 1px solid var(--shm-border); border-radius: 14px;
  background: var(--shm-surface);
  transition: border-color .15s, transform .15s, box-shadow .15s;
}
.shm-card:hover { border-color: color-mix(in srgb, var(--shm-accent) 45%, var(--shm-border)); transform: translateY(-1px); box-shadow: 0 8px 24px color-mix(in srgb, #000 8%, transparent); }
.shm-card-head { display: flex; align-items: flex-start; gap: 10px; }
.shm-avatar {
  width: 38px; height: 38px; flex: none; border-radius: 10px; object-fit: cover;
  display: grid; place-items: center; overflow: hidden;
  background: var(--shm-accent-soft); color: var(--shm-accent); font-weight: 700; font-size: 15px;
}
.shm-avatar img { width: 100%; height: 100%; object-fit: cover; }
.shm-card-title { min-width: 0; flex: 1; }
.shm-card-name { margin: 0; font-size: 15px; font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shm-card-sub { margin: 2px 0 0; color: var(--shm-muted); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shm-card-desc {
  margin: 11px 0 0; color: var(--shm-muted); font-size: 12.8px; line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.shm-card-meta { display: flex; flex-wrap: wrap; gap: 6px 12px; margin-top: 12px; color: var(--shm-muted); font-size: 12px; }
.shm-card-meta span { display: inline-flex; align-items: center; gap: 4px; }
.shm-card-foot { display: flex; align-items: center; gap: 7px; margin-top: auto; padding-top: 14px; flex-wrap: wrap; }
.shm-spacer { flex: 1; }
.shm-badges { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }
.shm-badge {
  display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px;
  border-radius: 999px; font-size: 11px; line-height: 18px; font-weight: 550;
  background: var(--shm-surface-strong); color: var(--shm-muted); white-space: nowrap;
}
.shm-badge-blue { color: var(--shm-accent); background: var(--shm-accent-soft); }
.shm-badge-green { color: var(--shm-success); background: color-mix(in srgb, var(--shm-success) 12%, transparent); }
.shm-badge-warn { color: var(--shm-warn); background: color-mix(in srgb, var(--shm-warn) 13%, transparent); }
.shm-badge-danger { color: var(--shm-danger); background: color-mix(in srgb, var(--shm-danger) 12%, transparent); }

.shm-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  height: 30px; padding: 0 10px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--shm-border); background: var(--dsw-alias-bg-base, #fff);
  color: var(--shm-text); font-size: 12.5px; font-weight: 550; white-space: nowrap;
  transition: background .15s, border-color .15s, opacity .15s;
}
.shm-btn:hover:not(:disabled) { background: var(--shm-surface-strong); border-color: color-mix(in srgb, var(--shm-accent) 35%, var(--shm-border)); }
.shm-btn:disabled { opacity: .55; cursor: not-allowed; }
.shm-btn-primary { border-color: transparent; color: var(--dsw-alias-label-primary-inverted, #fff); background: var(--shm-accent); }
.shm-btn-primary:hover:not(:disabled) { background: var(--dsw-static-blue-600, #2563eb); border-color: transparent; }
.shm-btn-soft { border-color: transparent; background: var(--shm-accent-soft); color: var(--shm-accent); }
.shm-btn-ghost { border-color: transparent; background: transparent; color: var(--shm-muted); }
.shm-btn-danger { color: var(--shm-danger); border-color: color-mix(in srgb, var(--shm-danger) 40%, transparent); }
.shm-btn-lg { height: 36px; padding: 0 15px; font-size: 13.5px; }
.shm-btn[aria-busy="true"] { cursor: progress; }

.shm-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid color-mix(in srgb, currentColor 25%, transparent);
  border-top-color: currentColor; animation: shm-spin .7s linear infinite;
}
@keyframes shm-spin { to { transform: rotate(360deg); } }
.shm-loading, .shm-empty, .shm-error {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 56px 24px; text-align: center; color: var(--shm-muted);
}
.shm-loading-title { display: flex; align-items: center; gap: 9px; color: var(--shm-text); font-weight: 550; }
.shm-empty-icon, .shm-error-icon {
  width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center;
  background: var(--shm-surface-strong); color: var(--shm-muted);
}
.shm-error-icon { color: var(--shm-danger); background: color-mix(in srgb, var(--shm-danger) 10%, transparent); }
.shm-empty h3, .shm-error h3 { margin: 2px 0 0; color: var(--shm-text); font-size: 15px; }
.shm-empty p, .shm-error p { margin: 0; max-width: 460px; font-size: 13px; }
.shm-inline-error {
  display: flex; gap: 8px; align-items: flex-start; padding: 9px 12px; margin: 0 0 12px;
  border-radius: 9px; font-size: 12.5px;
  color: var(--shm-danger); background: color-mix(in srgb, var(--shm-danger) 9%, transparent);
}
.shm-skeletons { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.shm-skeleton { height: 230px; border-radius: 14px; border: 1px solid var(--shm-border); background: linear-gradient(100deg, var(--shm-surface) 30%, var(--shm-surface-strong) 50%, var(--shm-surface) 70%); background-size: 220% 100%; animation: shm-shimmer 1.4s ease-in-out infinite; }
@keyframes shm-shimmer { from { background-position: 120% 0; } to { background-position: -120% 0; } }

.shm-pagination { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
.shm-page-info { color: var(--shm-muted); font-size: 12.5px; min-width: 120px; text-align: center; }

.shm-overlay {
  position: fixed; inset: 0; z-index: 80;
  display: flex; align-items: center; justify-content: center; padding: 24px;
  background: var(--dsw-alias-bg-mask-1, rgba(15, 23, 42, .45));
  backdrop-filter: var(--dsw-mask-blur, none);
  animation: shm-fade .15s ease-out;
}
@keyframes shm-fade { from { opacity: 0; } to { opacity: 1; } }
.shm-modal {
  display: flex; flex-direction: column; width: min(760px, 100%); max-height: min(86vh, 900px);
  border-radius: 16px; border: 1px solid var(--shm-border);
  background: var(--dsw-alias-bg-base, #fff); color: var(--shm-text);
  box-shadow: 0 24px 70px color-mix(in srgb, #000 32%, transparent);
  animation: shm-pop .18s ease-out;
}
.shm-modal-wide { width: min(920px, 100%); }
.shm-modal-sm { width: min(440px, 100%); }
@keyframes shm-pop { from { transform: translateY(6px) scale(.985); opacity: 0; } to { transform: none; opacity: 1; } }
.shm-modal-head { display: flex; align-items: flex-start; gap: 12px; padding: 18px 20px 14px; border-bottom: 1px solid var(--shm-border); }
.shm-modal-title { margin: 0; font-size: 16px; font-weight: 650; min-width: 0; overflow-wrap: anywhere; }
.shm-modal-sub { margin: 3px 0 0; color: var(--shm-muted); font-size: 12px; overflow-wrap: anywhere; }
.shm-modal-body { flex: 1; min-height: 0; overflow: auto; padding: 18px 20px; }
.shm-modal-foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 13px 20px; border-top: 1px solid var(--shm-border); flex-wrap: wrap; }
.shm-kv { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px 16px; margin: 0; }
.shm-kv > div { min-width: 0; }
.shm-kv dt { color: var(--shm-muted); font-size: 11.5px; margin: 0 0 2px; }
.shm-kv dd { margin: 0; font-size: 13px; overflow-wrap: anywhere; }
.shm-section { margin-top: 18px; }
.shm-section:first-child { margin-top: 0; }
.shm-section-title { margin: 0 0 8px; font-size: 13px; font-weight: 650; }
.shm-overview { margin: 0; color: var(--shm-muted); font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
.shm-taglist { display: flex; flex-wrap: wrap; gap: 5px; }
.shm-warnbox {
  display: flex; gap: 8px; padding: 9px 11px; border-radius: 9px; margin-bottom: 12px;
  color: var(--shm-warn); background: color-mix(in srgb, var(--shm-warn) 10%, transparent); font-size: 12.5px;
}

.shm-dl-head { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.shm-dl-path { color: var(--shm-muted); font-size: 12px; overflow-wrap: anywhere; }
.shm-dl-path code { background: var(--shm-surface-strong); padding: 1px 5px; border-radius: 5px; }
.shm-dl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.shm-dl-card { display: flex; flex-direction: column; padding: 15px; border: 1px solid var(--shm-border); border-radius: 13px; background: var(--shm-surface); }
.shm-dl-card-head { display: flex; gap: 10px; align-items: flex-start; }
.shm-dl-name { margin: 0; font-size: 14.5px; font-weight: 650; overflow-wrap: anywhere; }
.shm-dl-slug { margin: 2px 0 0; color: var(--shm-muted); font-size: 11.5px; overflow-wrap: anywhere; }
.shm-dl-desc { margin: 10px 0 0; color: var(--shm-muted); font-size: 12.5px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.shm-dl-note { margin: 9px 0 0; padding: 7px 9px; border-left: 2px solid var(--shm-accent); background: var(--shm-accent-soft); border-radius: 0 7px 7px 0; font-size: 12.5px; overflow-wrap: anywhere; }
.shm-dl-foot { display: flex; gap: 7px; align-items: center; margin-top: auto; padding-top: 12px; flex-wrap: wrap; }
.shm-editor { display: grid; gap: 12px; }
.shm-editor .shm-input { width: 100%; height: 36px; }
.shm-editor textarea.shm-input { height: 84px; padding: 8px 9px; resize: vertical; line-height: 1.5; }
.shm-field-block > label { display: block; margin-bottom: 5px; font-size: 12.5px; font-weight: 550; }
.shm-hint { margin: 4px 0 0; color: var(--shm-muted); font-size: 11.5px; }
.shm-editor-actions { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.shm-saved { color: var(--shm-success); font-size: 12px; }

.shm-md { font-size: 13.5px; line-height: 1.75; overflow-wrap: anywhere; }
.shm-md > :first-child { margin-top: 0; }
.shm-md > :last-child { margin-bottom: 0; }
.shm-md h1, .shm-md h2, .shm-md h3, .shm-md h4, .shm-md h5, .shm-md h6 { margin: 1.35em 0 .55em; line-height: 1.35; font-weight: 650; }
.shm-md h1 { font-size: 21px; } .shm-md h2 { font-size: 18px; } .shm-md h3 { font-size: 16px; }
.shm-md h4, .shm-md h5, .shm-md h6 { font-size: 14px; }
.shm-md p { margin: .7em 0; }
.shm-md ul, .shm-md ol { margin: .7em 0; padding-left: 1.6em; }
.shm-md li { margin: .22em 0; }
.shm-md li > p { margin: .2em 0; }
.shm-md code { padding: .12em .35em; border-radius: 5px; background: var(--shm-surface-strong); font-size: .9em; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.shm-md pre { margin: .9em 0; padding: 12px 14px; border-radius: 9px; overflow: auto; background: var(--shm-surface-strong); border: 1px solid var(--shm-border); }
.shm-md pre code { padding: 0; background: transparent; font-size: 12.5px; line-height: 1.6; }
.shm-md blockquote { margin: .9em 0; padding: .1em 0 .1em 12px; border-left: 3px solid var(--shm-border); color: var(--shm-muted); }
.shm-md hr { border: 0; border-top: 1px solid var(--shm-border); margin: 1.4em 0; }
.shm-md table { border-collapse: collapse; width: 100%; margin: .9em 0; font-size: 12.8px; }
.shm-md th, .shm-md td { border: 1px solid var(--shm-border); padding: 6px 9px; text-align: left; vertical-align: top; }
.shm-md th { background: var(--shm-surface-strong); font-weight: 600; }
.shm-md a { text-decoration: underline; text-underline-offset: 2px; }

.shm-toast {
  position: absolute; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 120;
  display: flex; align-items: center; gap: 9px; max-width: min(560px, calc(100% - 32px));
  padding: 9px 13px; border-radius: 10px; font-size: 13px;
  color: var(--dsw-alias-label-primary-inverted, #fff); background: color-mix(in srgb, #111 88%, transparent);
  box-shadow: 0 10px 30px color-mix(in srgb, #000 30%, transparent);
  animation: shm-toast-in .18s ease-out;
}
.shm-toast-success { background: color-mix(in srgb, var(--shm-success) 90%, #000); }
.shm-toast-error { background: color-mix(in srgb, var(--shm-danger) 90%, #000); }
@keyframes shm-toast-in { from { opacity: 0; transform: translate(-50%, 6px); } to { opacity: 1; transform: translate(-50%, 0); } }
.shm-footer { display: flex; justify-content: center; gap: 6px; padding: 12px 0 0; color: var(--shm-muted); font-size: 11.5px; }

@media (max-width: 720px) {
  .shm-header { padding: 12px 14px 0; gap: 10px; flex-wrap: wrap; }
  .shm-brand { padding-bottom: 10px; }
  .shm-sub { display: none; }
  .shm-tabs { margin-left: 0; width: 100%; }
  .shm-main { padding: 14px 14px 26px; }
  .shm-grid, .shm-dl-grid, .shm-skeletons { grid-template-columns: 1fr; }
  .shm-select { max-width: 150px; }
  .shm-overlay { padding: 10px; }
  .shm-modal { max-height: 92vh; }
  .shm-modal-body { padding: 14px; }
  .shm-modal-head, .shm-modal-foot { padding-left: 14px; padding-right: 14px; }
}
`
