/* eslint-disable eqeqeq */
import { isBlob } from '@/util'
import File from './file'

const { isBuffer } = Buffer

/**
 * @api private
 */
function toFile(value, name, options: any = {}): File {
  if (value.constructor.name === 'File') {
    return value
  }

  if (isBuffer(value)) {
    options.size = value.length
  } else if (isBlob(value)) {
    options.type = value.type || options.type
    options.size = value.size == null ? options.size : value.size
    options.lastModified = value.lastModified == null
      ? options.lastModified
      : value.lastModified
  }

  return new File(value, name, options)
}

export default toFile
