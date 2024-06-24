import { isBrowser } from './is-browser'


export function isBuffer(obj: any): obj is Buffer {
  return isBrowser() ? false : Buffer.isBuffer(obj)
}
