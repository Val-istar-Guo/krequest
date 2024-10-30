/* eslint-disable @typescript-eslint/no-explicit-any */
import { ABORT_PROPERTY, OUTPUT_PROPERTY } from '../constant.js'

import type { Emitter } from 'mitt'
import type { KeqOptionsParameter } from './keq-options.js'
import type { KeqEvents } from './keq-events.js'
import type { KeqGlobal } from './keq-global.js'
import type { KeqContextRequest } from './keq-context-request.js'


export interface KeqContextOptions extends KeqOptionsParameter {
  [key: string]: any
}

export interface KeqContext {
  /**
   * Middleware metadata
   *
   * This property does not share between middlewares
   * And will be destroyed after the middleware finish
   *
   * next: to prevent someone invoke `next()` multiple times or forgetting await
   */
  readonly metadata: {
    // Is middleware running completed
    finished: boolean
    // How many times the next() is called
    entryNextTimes: number
    // How many times the next() is returned
    outNextTimes: number
  }


  [ABORT_PROPERTY]?: AbortController
  abort: (reason: any) => void

  /**
   * The unique identifier of the request's location in the code
   * @readonly
   */
  readonly identifier: string

  readonly emitter: Emitter<Omit<KeqEvents, never>>

  options: KeqContextOptions

  /**
   * keq request context
   */
  readonly request: KeqContextRequest

  /**
   * original response
   */
  res?: Response

  /**
   * proxy response
   */
  response?: Response

  /**
   * the result get by user
   */
  output: any
  [OUTPUT_PROPERTY]?: any

  /**
   * share data between requests
   */
  readonly global: KeqGlobal

  // ===================================================
  // The following properties are extends by middleware
  // ===================================================

  /**
   * Fetch API Arguments
   */
  fetchArguments?: [RequestInfo | string, RequestInit]

  /**
   * extends by middleware
   * */
  [key: string]: any
}
