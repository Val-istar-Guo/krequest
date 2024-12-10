/* eslint-disable @typescript-eslint/no-explicit-any */
import mitt from 'mitt'
import { Exception } from './exception/exception.js'
import { cloneBody } from './util/clone-body.js'
import { ABORT_PROPERTY, OUTPUT_PROPERTY } from './constant.js'
import { composeMiddleware } from './util/compose-middleware.js'
import { shallowClone } from './util/shallow-clone.js'
import { compileUrl } from './util/compile-url.js'

import type { KeqContext, KeqContextOptions } from './types/keq-context.js'
import type { KeqMiddleware } from './types/keq-middleware.js'
import type { KeqInit } from './types/keq-init.js'
import type { KeqEvents, KeqListeners } from './types/keq-events.js'
import type { KeqContextRequest } from './types/keq-context-request.js'


/**
 * @description Keq 核心 API，发送请求必要的原子化的API
 */
export class Core<OUTPUT> {
  /**
   * The unique identifier of the request's location in the code
   */
  __identifier__: string

  private requestPromise?: Promise<OUTPUT>

  protected requestContext: Omit<KeqContextRequest, 'abort' | '__url__'>

  protected __listeners__: KeqListeners = {}

  protected __global__: Record<string, any>
  protected __prepend_middlewares__: KeqMiddleware[] = []
  protected __append_middlewares__: KeqMiddleware[] = []

  protected __options__: KeqContextOptions = {
    resolveWithFullResponse: false,
    resolveWith: 'intelligent',
  }

  public constructor(url: URL, init: KeqInit, identifier: string, global: Record<string, any> = {}) {
    this.__global__ = global
    this.__identifier__ = identifier

    this.requestContext = {
      method: 'get',
      headers: new Headers(),
      routeParams: {},
      body: undefined,
      ...init,
      url: new URL(url.href),
    }
  }

  prependMiddlewares(...middlewares: KeqMiddleware[]): this {
    this.__prepend_middlewares__.push(...middlewares)
    return this
  }

  appendMiddlewares(...middlewares: KeqMiddleware[]): this {
    this.__append_middlewares__.unshift(...middlewares)
    return this
  }

  on<K extends keyof KeqEvents>(event: K, listener: (data: KeqEvents[K]) => void): this {
    this.__listeners__[event] = this.__listeners__[event] || []
    this.__listeners__[event]!.push(listener)
    return this
  }

  private async run(): Promise<OUTPUT> {
    const headers = new Headers()

    for (const [key, value] of this.requestContext.headers.entries()) {
      headers.append(key, value)
    }

    const requestContext: KeqContextRequest = {
      url: new URL(this.requestContext.url.href),
      routeParams: shallowClone(this.requestContext.routeParams),

      get __url__() {
        return compileUrl(this.url, this.routeParams)
      },

      method: this.requestContext.method,
      headers,
      body: cloneBody(this.requestContext.body),

      cache: this.requestContext.cache,
      credentials: this.requestContext.credentials,
      integrity: this.requestContext.integrity,
      keepalive: this.requestContext.keepalive,
      mode: this.requestContext.mode,
      redirect: this.requestContext.redirect,
      referrer: this.requestContext.referrer,
      referrerPolicy: this.requestContext.referrerPolicy,
    }

    const options = shallowClone(this.__options__)

    const emitter = mitt<Omit<KeqEvents, never>>()
    for (const eventName in this.__listeners__) {
      const listeners = this.__listeners__[eventName]
      for (const listener of listeners) {
        emitter.on(eventName as keyof KeqEvents, listener)
      }
    }

    const ctx: KeqContext = {
      metadata: {
        finished: false,
        entryNextTimes: 0,
        outNextTimes: 0,
      },

      identifier: this.__identifier__,

      emitter,

      request: requestContext,
      options,
      global: this.__global__,

      get output() {
        throw new Exception('output property is write-only')
      },

      set output(value) {
        this[OUTPUT_PROPERTY] = value
      },

      [ABORT_PROPERTY]: undefined,
      abort(reason) {
        const abortController = this[ABORT_PROPERTY]

        if (abortController) {
          abortController.abort(reason)
        }
      },
    }

    Object.defineProperty(ctx, 'identifier', {
      value: this.__identifier__,
      writable: false,
    })

    Object.defineProperty(ctx, 'request', {
      value: requestContext,
      writable: false,
    })

    Object.defineProperty(ctx, 'emitter', {
      value: emitter,
      writable: false,
    })

    Object.defineProperty(ctx, 'global', {
      value: this.__global__,
      writable: false,
    })

    const middleware = composeMiddleware([...this.__prepend_middlewares__, ...this.__append_middlewares__])


    await middleware(ctx, async function emptyNext() {})


    const output: any = ctx[OUTPUT_PROPERTY]

    if (ctx.options.resolveWithFullResponse || ctx.options.resolveWith === 'response') {
      return ctx.response as OUTPUT
    }

    const response = ctx.response
    if (!response) {
      return (OUTPUT_PROPERTY in ctx) ? output as OUTPUT : undefined as unknown as OUTPUT
    }

    if (ctx.options.resolveWith === 'text') {
      return await response.text() as OUTPUT
    } else if (ctx.options.resolveWith === 'json') {
      return await response.json() as OUTPUT
    } else if (ctx.options.resolveWith === 'form-data') {
      return await response.formData() as OUTPUT
    } else if (ctx.options.resolveWith === 'blob') {
      return await response.blob() as OUTPUT
    } else if (ctx.options.resolveWith === 'array-buffer') {
      return await response.arrayBuffer() as OUTPUT
    }

    if (OUTPUT_PROPERTY in ctx) {
      return output as OUTPUT
    }

    if (response.status === 204) {
      // 204: NO CONTENT
      return undefined as unknown as OUTPUT
    }

    const contentType = response.headers.get('content-type') || ''
    try {
      if (contentType.includes('application/json')) {
        return await response.json() as OUTPUT
      } else if (contentType.includes('multipart/form-data')) {
        return await response.formData() as OUTPUT
      } else if (contentType.includes('plain/text')) {
        return await response.text() as OUTPUT
      }
    } catch (e) {
      console.warn('Failed to auto parse response body', e)
    }

    /**
     * Unable to parse response body
     * Return undefined
     * Enable users to discover the problem
     * And modify the method of parsing response
     */
    return undefined as unknown as OUTPUT
  }

  async end(): Promise<OUTPUT> {
    return this.run()
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = OUTPUT, TResult2 = never>(onfulfilled?: ((value: OUTPUT) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
    if (!this.requestPromise) this.requestPromise = this.end()
    return this.requestPromise.then(onfulfilled, onrejected)
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<OUTPUT | TResult> {
    return this.end().catch(onrejected)
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<OUTPUT> {
    return this.end().finally(onfinally)
  }
}
