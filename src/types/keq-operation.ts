/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtractProperty } from './extract-property.js'
import { KeqContextRequestMethod } from './keq-context-request.js'
import { KeqQueryObject } from './keq-query-value.js'

export interface KeqOperation {

  requestParams: {
    [key: string]: string | number
  }

  requestQuery: KeqQueryObject

  requestHeaders: {
    [key: string]: string | number
  }

  requestBody: FormData | URLSearchParams | object | Array<any> | string

  responseBody: any
}

export type ExtractFields<T extends Pick<KeqOperation, 'requestBody'>> = ExtractProperty<Exclude<Extract<T['requestBody'], object>, FormData | URLSearchParams | Array<any>>, string>
export type ExtractFiles<T extends Pick<KeqOperation, 'requestBody'>> = ExtractProperty<Exclude<Extract<T['requestBody'], object>, FormData | URLSearchParams | Array<any>>, Buffer | Blob | File>


export type KeqOperations = {
  [url: string]: {
    [method in KeqContextRequestMethod]?: KeqOperation
  }
}


export type FlattenOperations<T extends KeqOperations, M extends KeqContextRequestMethod> = {
  [P in keyof T as T[P][M] extends KeqOperation ? P : never ]: T[P][M] extends KeqOperation ? T[P][M] : never
}


export interface KeqBaseOperation extends KeqOperation {
  url: string
  method: KeqContextRequestMethod
  output: any

  requestParams: {
    [key: string]: string
  }

  requestQuery: KeqQueryObject

  requestHeaders: {
    'content-type': string
    cookie: string
    host: string
    authorization: string
    'cache-control': string
    'content-encoding': string
    referer: string
    'user-agent': string
  }

  requestBody: FormData | URLSearchParams | object | Array<any> | string
}
