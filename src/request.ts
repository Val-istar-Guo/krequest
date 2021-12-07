import { Keq } from './keq'
import {
  RequestParams,
  RequestCreator,
  Middleware,
  MiddlewareMatcher,
  Options,
} from '@/types'
import * as url from 'url'
import * as clone from 'clone'
import { matchMiddleware, matchHost } from './middleware'


const defaultOptions: Options = {}


const middlewares: Middleware[] = []

export const request: RequestCreator = function<T>(params: RequestParams, options: Options = defaultOptions): ReturnType<Keq<T>['options']> {
  const urlObj = {
    ...url.parse(params.url, true),
    params: {},
  }

  const request = new Keq<T>(urlObj, 'get', middlewares)
  return request.options(options)
}


request.get = function<T>(href: string): Keq<T> {
  const urlObj = {
    ...url.parse(href, true),
    params: {},
  }

  const request = new Keq<T>(urlObj, 'get', clone(middlewares))
  return request
}

request.put = function<T>(href: string): Keq<T> {
  const urlObj = {
    ...url.parse(href, true),
    params: {},
  }
  const request = new Keq<T>(urlObj, 'put', middlewares)
  return request
}

request.delete = function<T>(href: string): Keq<T> {
  const urlObj = {
    ...url.parse(href, true),
    params: {},
  }
  const request = new Keq<T>(urlObj, 'delete', middlewares)
  return request
}

request.del = request.delete

request.post = function<T>(href: string): Keq<T> {
  const urlObj = {
    ...url.parse(href, true),
    params: {},
  }
  const request = new Keq<T>(urlObj, 'post', middlewares)
  return request
}

request.head = function<T>(href: string): Keq<T> {
  const urlObj = {
    ...url.parse(href, true),
    params: {},
  }
  const request = new Keq<T>(urlObj, 'head', middlewares)
  return request
}

request.patch = function<T>(href: string): Keq<T> {
  const urlObj = {
    ...url.parse(href, true),
    params: {},
  }
  const request = new Keq<T>(urlObj, 'patch', middlewares)
  return request
}


request.use = function use(m: MiddlewareMatcher | string | Middleware, middleware?: Middleware): RequestCreator {
  if (!middleware) middlewares.push(m as Middleware)
  else if (typeof m === 'string') middlewares.push(matchMiddleware(matchHost(m), middleware))
  else middlewares.push(matchMiddleware(m as MiddlewareMatcher, middleware))

  return request
}
