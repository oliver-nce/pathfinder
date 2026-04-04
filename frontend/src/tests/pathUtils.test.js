/**
 * Tests for pathfinder path utilities.
 *
 * Run with: npx vitest run --root frontend/src/tests
 */

import { describe, it, expect } from 'vitest'
import {
  validateFieldPath,
  bindPathFinderToField,
  createFieldFromPath,
  getTerminalFieldName,
  getParentPath,
  isDirectField,
  formatPathForDisplay,
} from '../../pathfinder/utils/path_utils.py'


describe('validateFieldPath', () => {
  it('rejects empty path', () => {
    const result = validateFieldPath('', 'User')
    expect(result.valid).toBe(false)
  })

  it('rejects path starting with number', () => {
    const result = validateFieldPath('1bad.field', 'User')
    expect(result.valid).toBe(false)
  })

  it('rejects path with invalid characters', () => {
    const result = validateFieldPath('bad field!', 'User')
    expect(result.valid).toBe(false)
  })

  it('accepts valid dot-notation path', () => {
    const result = validateFieldPath('customer.territory.name', 'Sales Order')
    expect(result.valid).toBe(true)
  })
})


describe('bindPathFinderToField', () => {
  it('returns invalid for bad path', () => {
    const result = bindPathFinderToField('bad.path!', 'User')
    expect(result.isValid).toBe(false)
    expect(result.resolvedPath).toEqual([])
  })

  it('returns resolved path for valid input', () => {
    const result = bindPathFinderToField('customer.name', 'Order')
    expect(result.isValid).toBe(true)
    expect(result.resolvedPath).toEqual(['customer', 'name'])
  })
})


describe('createFieldFromPath', () => {
  it('generates id from path', () => {
    const result = createFieldFromPath('customer.territory.name')
    expect(result.id).toBe('customer_territory_name')
  })

  it('derives label from last segment', () => {
    const result = createFieldFromPath('customer.email_id')
    expect(result.label).toBe('Email Id')
  })

  it('uses custom label when provided', () => {
    const result = createFieldFromPath('customer.name', 'Customer Name')
    expect(result.label).toBe('Customer Name')
  })
})


describe('path utilities', () => {
  it('getTerminalFieldName returns last segment', () => {
    expect(getTerminalFieldName('customer.territory.name')).toBe('name')
  })

  it('getParentPath returns all but last', () => {
    expect(getParentPath('customer.territory.name')).toBe('customer.territory')
  })

  it('isDirectField detects single segment', () => {
    expect(isDirectField('email_id')).toBe(true)
    expect(isDirectField('customer.email_id')).toBe(false)
  })

  it('formatPathForDisplay converts to arrows', () => {
    expect(formatPathForDisplay('customer.territory.name')).toBe('customer → territory → name')
  })
})
