/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Core } from './core.js'
import { Exception } from './exception/exception.js'
import { InvalidArgumentsExceptions } from './exception/invalid-arguments.exception.js'
import { isBlob } from './is/is-blob.js'
import { isFile } from './is/is-file.js'
import { isFormData } from './is/is-form-data.js'
import { isHeaders } from './is/is-headers.js'
import { isBuffer } from './is/is-buffer.js'
import { isUrlSearchParams } from './is/is-url-search-params.js'
import { KeqFlowControl, KeqFlowControlMode, KeqFlowControlSignal } from './types/keq-flow-control.js'
import { mergeKeqRequestBody } from './util/merge-keq-request-body.js'
import { base64Encode } from './util/base64.js'
import { fixContentType } from './util/fix-content-type.js'

import type { KeqRetryOn, KeqRetryDelay } from './types/keq-retry.js'
import type { KeqMiddleware } from './types/keq-middleware.js'
import type { KeqOptionsParameter, KeqOptionsReturnType } from './types/keq-options.js'
import type { KeqQueryValue } from './types/keq-query-value.js'
import type { KeqResolveMethod } from './types/keq-resolve-with-mode.js'
import type { CommonContentType, ShorthandContentType } from './types/content-type.js'
import type { KeqContextOptions } from './types/keq-context.js'
import type { ExtractFields, ExtractFiles, KeqBaseOperation, KeqOperation } from './types/keq-operation.js'
import type { KeqContextRequestBody } from './types/keq-context-request.js'
import { isValidHeaderValue } from './util/is-valid-header-value.js'
import { isReadableStream } from './is/is-readable-stream.js'
import { isArrayBuffer } from './is/is-array-buffer.js'


/**
 * @description Keq 扩展 API，人性化的常用的API
 */
export class Keq<
  OUTPUT,
  OPERATION extends Omit<KeqOperation, 'responseBody'> = KeqBaseOperation,
> extends Core<OUTPUT> {
  use(...middlewares: KeqMiddleware[]): this {
    return this.prependMiddlewares(...middlewares)
  }


  option<K extends keyof KeqOptionsReturnType<OUTPUT>>(key: K, value?: KeqOptionsParameter[K]): KeqOptionsReturnType<OUTPUT>[K]
  option(key: string, value?: any): this
  option(key: string, value: any = true): Keq<any> {
    this.__options__[key] = value
    return this
  }

  options(opts: KeqContextOptions): this {
    for (const [key, value] of Object.entries(opts)) {
      this.__options__[key] = value
    }
    return this
  }

  /**
   * Set request header
   *
   * @description 设置请求头
   */
  set<K extends 'strict'>(headers: OPERATION['requestHeaders']): this
  set<K extends 'strict', T extends keyof OPERATION['requestHeaders']>(name: T, value: OPERATION['requestHeaders'][T]): this
  set<T extends keyof KeqBaseOperation['requestHeaders']>(name: T, value: KeqBaseOperation['requestHeaders'][T]): this
  set(headers: Headers): this
  set(headers: Record<string, string>): this
  set(name: string, value: string | number): this
  set(
    headersOrName: OPERATION['requestHeaders'] | KeqOperation['requestHeaders'] | string | Record<string, string> | Headers,
    value?: string | number,
  ): this {
    if (isHeaders(headersOrName)) {
      headersOrName.forEach((value, key) => {
        this.requestContext.headers.set(key, value)
      })
    } else if (typeof headersOrName === 'string' && value) {
      if (!isValidHeaderValue(value)) {
        throw new Exception(`[Invalid header] Key: ${headersOrName} Value: ${value}`)
      }

      this.requestContext.headers.set(headersOrName, String(value))
    } else if (typeof headersOrName === 'object') {
      for (const [key, value] of Object.entries(headersOrName)) {
        if (!isValidHeaderValue(value)) {
          throw new Exception(`[Invalid header] Key: ${key} Value: ${value}`)
        }

        this.requestContext.headers.set(key, String(value))
      }
    }
    return this
  }


  /**
   * Set request query/searchParams
   */
  query<K extends 'strict'>(key: OPERATION['requestQuery']): this
  query<K extends 'strict', T extends keyof OPERATION['requestQuery']>(key: T, value: OPERATION['requestQuery'][T]): this
  query(key: Record<string, KeqQueryValue | KeqQueryValue[]>): this
  query(key: string, value: KeqQueryValue | KeqQueryValue[]): this
  query(key: string | OPERATION['requestQuery'] | Record<string, KeqQueryValue | KeqQueryValue[]>, value?: KeqQueryValue | KeqQueryValue[]): this {
    if (typeof key === 'object') {
      for (const [k, v] of Object.entries(key)) {
        if (v === undefined) continue
        this.query(k, v)
      }
      return this
    }

    if (typeof key === 'string') {
      if (Array.isArray(value)) {
        for (const item of value) {
          this.query(key, item)
        }
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
        this.requestContext.url.searchParams.append(key, String(value))
      } else if (value === 'undefined' || value === null || value === undefined) {
        // skip
      } else {
        console.warn(`query value type(${typeof value}) is invalid, key: ${key}`)
      }

      return this
    }

    throw new TypeError('typeof key is invalid')
  }

  /**
   * Set request route params
   */
  params<K extends 'strict'>(key: OPERATION['requestParams']): this
  params<K extends 'strict', T extends keyof OPERATION['requestParams']>(key: T, value: OPERATION['requestParams'][T]): this
  params(key: Record<string, string | number>): this
  params(key: string, value: string | number): this
  params(key: string | OPERATION['requestParams'] | Record<string, string | number>, value?: string | number): this {
    if (typeof key === 'string') {
      this.requestContext.routeParams[key] = String(value)
    } else if (typeof key === 'object') {
      for (const [k, v] of Object.entries(key)) {
        this.requestContext.routeParams[k] = String(v)
      }
    } else {
      throw new TypeError('Invalid Arguments for .params()')
    }

    return this
  }

  /**
   * Set request body
   */
  body(value: KeqContextRequestBody): this {
    this.requestContext.body = value
    return this
  }


  /**
   * Setting the Content-Type
   */
  type(contentType: ShorthandContentType): this
  type(contentType: CommonContentType): this
  type(contentType: string): this
  type(contentType: string): this {
    const type = fixContentType(contentType)
    this.set('Content-Type', type)
    return this
  }


  /**
   * Http Basic Authentication
   */
  auth(username: string, password: string): this {
    this.set('Authorization', `Basic ${base64Encode(`${username}:${password}`)}`)
    return this
  }

  private setTypeIfEmpty(contentType: ShorthandContentType): void
  private setTypeIfEmpty(contentType: CommonContentType): void
  private setTypeIfEmpty(contentType: string): void
  private setTypeIfEmpty(contentType: string): void {
    if (!this.requestContext.headers.has('Content-Type')) void this.type(contentType)
  }

  /**
   * set request body
   */
  send<K extends 'strict'>(value: OPERATION['requestBody']): this
  send(value: object): this
  send(value: FormData): this
  send(value: URLSearchParams): this
  send(value: Array<any>): this
  send(value: string): this
  send(value: KeqContextRequestBody): this {
    this.requestContext.body = mergeKeqRequestBody(this.requestContext.body, value)

    if (isUrlSearchParams(value)) {
      this.setTypeIfEmpty('form')
    } else if (isFormData(value)) {
      this.setTypeIfEmpty('form-data')
    } else if (isBlob(value) || isReadableStream(value) || isArrayBuffer(value)) {
      // don't set content-type
    } else if (typeof value === 'object') {
      this.setTypeIfEmpty('json')
    }

    return this
  }


  field<T extends keyof ExtractFields<OPERATION>>(arg1: T, value: ExtractFields<OPERATION>[T]): this
  field(arg1: ExtractFields<OPERATION>): this
  field(arg1: string, value: string | string[]): this
  field(arg1: Record<string, string>): this
  field(arg1: ExtractFields<OPERATION> | string | Record<string, string>, arg2?: any): this {
    if (typeof arg1 === 'object') {
      this.requestContext.body = mergeKeqRequestBody(this.requestContext.body, arg1)
    } else if (arg2) {
      this.requestContext.body = mergeKeqRequestBody(this.requestContext.body, { [arg1]: arg2 })
    } else {
      throw new InvalidArgumentsExceptions()
    }

    this.setTypeIfEmpty('form-data')
    return this
  }


  attach<T extends keyof ExtractFiles<OPERATION>>(key: T, value: Blob | File | Buffer, filename: string): this
  attach<T extends keyof ExtractFiles<OPERATION>>(key: T, value: Blob | File | Buffer): this
  attach(key: string, value: Blob | File | Buffer, filename: string): this
  attach(key: string, value: Blob | File | Buffer): this
  attach(key: string, value: Blob | File | Buffer, arg3 = 'file'): this {
    let file: File

    if (isBlob(value)) {
      const formData = new FormData()
      formData.set(key, value, arg3)
      file = formData.get(key) as File
    } else if (isFile(value)) {
      file = value
    } else if (isBuffer(value)) {
      const formData = new FormData()
      formData.set(key, new Blob([value]), arg3)
      file = formData.get(key) as File
    } else {
      throw new InvalidArgumentsExceptions()
    }

    this.requestContext.body = mergeKeqRequestBody(this.requestContext.body, { [key]: file })
    this.setTypeIfEmpty('form-data')
    return this
  }

  /**
   *
   * @param retryTimes Max number of retries per call
   * @param retryDelay Initial value used to calculate the retry in milliseconds (This is still randomized following the randomization factor)
   * @param retryCallback Will be called after request failed
   */
  retry(retryTimes: number, retryDelay: KeqRetryDelay = 0, retryOn: KeqRetryOn = (attempt, error) => !!error): Keq<OUTPUT> {
    this.option('retryTimes', retryTimes)
    this.option('retryDelay', retryDelay)
    this.option('retryOn', retryOn)

    return this
  }


  redirect(mod: RequestRedirect): this {
    this.requestContext.redirect = mod
    return this
  }

  credentials(mod: RequestCredentials): this {
    this.requestContext.credentials = mod
    return this
  }

  mode(mod: RequestMode): this {
    this.requestContext.mode = mod
    return this
  }

  flowControl(mode: KeqFlowControlMode, signal?: KeqFlowControlSignal): this {
    const sig = signal ? signal : this.__identifier__

    if (!sig) {
      throw new Exception('please set signal to .flowControl()')
    }

    const flowControl: KeqFlowControl = {
      mode,
      signal: sig,
    }

    this.option('flowControl', flowControl)
    return this
  }

  timeout(milliseconds: number): this {
    this.option('timeout', { millisecond: milliseconds })
    return this
  }

  resolveWith(m: 'response'): Keq<Response>
  resolveWith(m: 'array-buffer'): Keq<ArrayBuffer>
  resolveWith(m: 'blob'): Keq<Blob>
  resolveWith(m: 'text'): Keq<string>
  resolveWith<U = any>(m: 'json' | 'form-data'): Keq<U>
  resolveWith<U = any>(m: KeqResolveMethod): Keq<U> | Keq<string> | Keq<Blob> | Keq<ArrayBuffer> | Keq<Response> {
    this.option('resolveWith', m)

    return this as any
  }
}
