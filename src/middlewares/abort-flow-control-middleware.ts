import type { KeqMiddleware } from '~/types/keq-middleware.js'


export function abortFlowControlMiddleware(): KeqMiddleware {
  return async function abortFlowControlMiddleware(ctx, next) {
    if (!ctx.options.flowControl || ctx.options.flowControl.mode !== 'abort') {
      await next()
      return
    }

    if (ctx.request.signal) {
      console.warn('[keq] request signal had be set manual, abort follow control will not take effect')
      await next()
      return
    }

    const { signal } = ctx.options.flowControl

    const key = typeof signal === 'string' ? signal : signal(ctx)

    if (!ctx.global.abortFlowControl) ctx.global.abortFlowControl = {}

    if (ctx.global.abortFlowControl[key]) {
      const abortController: AbortController = ctx.global.abortFlowControl[key]
      abortController.abort(
        new DOMException('The previous request was not completed, so keq flowControl abort this request.', 'AbortError')
      )
    }

    const abortController = new AbortController()
    ctx.global.abortFlowControl[key] = abortController

    ctx.request.signal = abortController.signal

    await next()

    ctx.global.abortFlowControl[key] = undefined
  }
}
