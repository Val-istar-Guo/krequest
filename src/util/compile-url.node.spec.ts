import { expect, test } from '@jest/globals'
import { compileUrl } from './compile-url.js'

test('compile-pathname-template', () => {
  expect(compileUrl('http://example.com/api/:id', { id: '1' }).href).toBe('http://example.com/api/1')
  expect(compileUrl('http://example.com/api/:idx', { id: '1' }).href).toBe('http://example.com/api')
  expect(compileUrl('http://example.com/api/{id}', { id: '1' }).href).toBe('http://example.com/api/1')
  expect(compileUrl('http://example.com/api/i{id}i', { id: '1' }).href).toBe('http://example.com/api/i%7Bid%7Di')
  expect(compileUrl('http://example.com/api/{id}i', { id: '1' }).href).toBe('http://example.com/api/%7Bid%7Di')
  expect(compileUrl('http://example.com/api/%7Bid%7D', { id: '1' }).href).toBe('http://example.com/api/1')
  expect(compileUrl('http://example.com/api/:i_d', { i_d: 1 }).href).toBe('http://example.com/api/1')
  expect(compileUrl('http://example.com/api/:i-d', { 'i-d': 1 }).href).toBe('http://example.com/api/1')
  expect(compileUrl('http://example.com/api/:i~d', { 'i~d': 1 }).href).toBe('http://example.com/api/1')
  expect(compileUrl('http://example.com/api/:id', { id: '{t}', t: 1 }).href).toBe('http://example.com/api/%7Bt%7D')
  expect(compileUrl('http://example.com/api/(id)', { id: '1' }).href).toBe('http://example.com/api/(id)')
  expect(compileUrl('http://example.com/api/:id', {}).href).toBe('http://example.com/api')
  expect(compileUrl('http://example.com/api/{id}', {}).href).toBe('http://example.com/api')
  expect(compileUrl('http://example.com/api/%7Bid%7D', {}).href).toBe('http://example.com/api')
  expect(compileUrl('http://example.com/api/:foo(^\\d*)', {}).href).toBe('http://example.com/api/d*)')
  expect(compileUrl('http://example.com/api/:foo/{bar}', { foo: 'bar', bar: 'foo' }).href).toBe('http://example.com/api/bar/foo')
  expect(compileUrl('http://example.com/api/:foo/{bar}', { bar: 'foo' }).href).toBe('http://example.com/api/foo')
  expect(compileUrl('http://example.com/api/:foo/{bar}?key=value', { foo: 'bar', bar: 'foo' }).href).toBe('http://example.com/api/bar/foo?key=value')
})
