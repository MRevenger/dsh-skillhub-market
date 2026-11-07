/** Host entry for the Skillhub market bundle. */
import { createRoutes } from './host/routes.ts'
import { resolveDshHome } from './host/store.ts'

export const name = 'dsh-skillhub-market'
export const inject = ['connection']

/** Optional plugin configuration. */
export interface Config {
  /** Override the DSH home directory (defaults to $DSH_HOME). */
  dshHome?: string
}

/** Register the authenticated HTTP routes used by the browser panel. */
export function apply(ctx: {
  connection?: { fetch?: { register?: (route: { path: string; methods: string[]; requestBody?: 'buffered'; fetch: (request: Request) => Promise<Response> }) => () => void } }
  logger?: { warn?: (message: string) => void }
  effect?: (callback: () => () => void, label?: string) => void
}, config?: Config): void {
  const routes = createRoutes(() => resolveDshHome(config?.dshHome))
  const install = (): (() => void) => {
    const connection = ctx.connection
    const register = connection?.fetch?.register
    if (typeof register !== 'function' || connection?.fetch === undefined) {
      ctx.logger?.warn?.('skillhub-market: 当前宿主未提供 connection.fetch，市场 API 不可用')
      return () => {}
    }
    const disposers = routes.map((route) => {
      try {
        return register.call(connection.fetch, {
          path: route.path,
          methods: route.methods,
          requestBody: route.requestBody ?? 'buffered',
          fetch: route.fetch,
        })
      } catch (error) {
        ctx.logger?.warn?.(`skillhub-market: 注册路由 ${route.path} 失败：${error instanceof Error ? error.message : String(error)}`)
        return () => {}
      }
    })
    return () => {
      for (const dispose of disposers) {
        try { dispose() } catch { /* already disposed */ }
      }
    }
  }
  if (typeof ctx.effect === 'function') ctx.effect(install, 'skillhub-market: API routes')
  else install()
}
