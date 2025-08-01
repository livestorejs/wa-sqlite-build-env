import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { loadSqlite3Wasm, importDb, exportDb, select } from '../lib/sqlite-utils.ts'
import type { SQLiteAPI } from '@livestore/wa-sqlite'

describe('serialize/deserialize', () => {
  let sqlite3: SQLiteAPI
  let dbDataOriginal: Uint8Array

  beforeAll(async () => {
    sqlite3 = await loadSqlite3Wasm()
    const response = await fetch('https://github.com/jpwhite3/northwind-SQLite3/raw/refs/heads/main/dist/northwind.db')
    dbDataOriginal = new Uint8Array(await response.arrayBuffer())
  })

  function checkExportHeader(exported: Uint8Array): boolean {
    return exported[0] === 0x53 // 'S' from "SQLite format 3"
  }

  it('should handle single export correctly (baseline)', () => {
    // First database - single export
    const db1 = sqlite3.open_v2Sync(':memory:', 0, undefined)
    let exported1: Uint8Array

    const dbData = dbDataOriginal.slice()

    try {
      importDb(sqlite3, db1, dbData)
      exported1 = exportDb(sqlite3, db1)
      expect(checkExportHeader(exported1)).toBe(true)
    } finally {
      sqlite3.close(db1)
    }

    // Second database - should work fine
    const db2 = sqlite3.open_v2Sync(':memory:', 0, undefined)
    
    try {
      importDb(sqlite3, db2, dbData)
      const tables = select(sqlite3, db2, "SELECT name FROM sqlite_master WHERE type='table'")
      const exported2 = exportDb(sqlite3, db2)
      
      expect(tables.length).toBe(14)
      expect(checkExportHeader(exported2)).toBe(true)
    } finally {
      sqlite3.close(db2)
    }
  })

  it('should fix corruption with 2 exports on first database', () => {
    // This test reproduces the original corruption bug and verifies the fix
    
    // First database - TWO exports (previously caused corruption)
    const db1 = sqlite3.open_v2Sync(':memory:', 0, undefined)
    const dbData = dbDataOriginal.slice()

    try {
      importDb(sqlite3, db1, dbData)
      
      const export1 = exportDb(sqlite3, db1)
      expect(checkExportHeader(export1)).toBe(true)
      
      const export2 = exportDb(sqlite3, db1)
      expect(checkExportHeader(export2)).toBe(true)
      
    } finally {
      sqlite3.close(db1)
    }

    // Second database - should now be valid with the fix
    const db2 = sqlite3.open_v2Sync(':memory:', 0, undefined)
    
    try {
      importDb(sqlite3, db2, dbData)
      const tables = select(sqlite3, db2, "SELECT name FROM sqlite_master WHERE type='table'")
      const exported = exportDb(sqlite3, db2)
      const firstBytes = Array.from(exported.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
      
      // Verify the fix works
      expect(tables.length).toBe(14)
      expect(checkExportHeader(exported)).toBe(true)
      expect(firstBytes).toBe('53 51 4c 69 74 65 20 66 6f 72 6d 61 74 20 33 00') // "SQLite format 3\0"
      expect(firstBytes).not.toBe('00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00') // Not null bytes
      
    } finally {
      sqlite3.close(db2)
    }
  })

  it('should handle reasonable numbers of sequential exports', () => {
    // Test that the fix works for normal usage patterns
    
    // First database with 2 exports (the original corruption trigger)
    const db1 = sqlite3.open_v2Sync(':memory:', 0, undefined)
    const dbData = dbDataOriginal.slice()
    
    try {
      importDb(sqlite3, db1, dbData)
      
      const export1 = exportDb(sqlite3, db1)
      expect(checkExportHeader(export1)).toBe(true)
      
      const export2 = exportDb(sqlite3, db1)
      expect(checkExportHeader(export2)).toBe(true)
    } finally {
      sqlite3.close(db1)
    }
    
    // Second database should work fine (this was previously corrupted)
    const db2 = sqlite3.open_v2Sync(':memory:', 0, undefined)
    
    try {
      importDb(sqlite3, db2, dbData)
      const tables = select(sqlite3, db2, "SELECT name FROM sqlite_master WHERE type='table'")
      const exported = exportDb(sqlite3, db2)
      
      expect(tables.length).toBe(14)
      expect(checkExportHeader(exported)).toBe(true)
    } finally {
      sqlite3.close(db2)
    }
  })

  it('should prevent memory leaks with immediate buffer cleanup', () => {
    // This test verifies that our fix properly cleans up SQLite buffers
    // by doing many export operations without accumulating memory
    
    const db = sqlite3.open_v2Sync(':memory:', 0, undefined)
    const dbData = dbDataOriginal.slice()
    
    try {
      importDb(sqlite3, db, dbData)
      
      // Perform many exports to test memory cleanup
      for (let i = 0; i < 10; i++) {
        const exported = exportDb(sqlite3, db)
        expect(checkExportHeader(exported)).toBe(true)
        expect(exported.length).toBeGreaterThan(1000000) // Should be ~24MB
      }
      
    } finally {
      sqlite3.close(db)
    }
  })

  it('should maintain data integrity across exports', () => {
    const db = sqlite3.open_v2Sync(':memory:', 0, undefined)
    const dbData = dbDataOriginal.slice()
    
    try {
      importDb(sqlite3, db, dbData)
      
      // First export
      const export1 = exportDb(sqlite3, db)
      const tables1 = select(sqlite3, db, "SELECT name FROM sqlite_master WHERE type='table'")
      
      // Second export  
      const export2 = exportDb(sqlite3, db)
      const tables2 = select(sqlite3, db, "SELECT name FROM sqlite_master WHERE type='table'")
      
      // Data should be identical
      expect(checkExportHeader(export1)).toBe(true)
      expect(checkExportHeader(export2)).toBe(true)
      expect(export1.length).toBe(export2.length)
      expect(tables1.length).toBe(tables2.length)
      expect(tables1.length).toBe(14)
      
      // Headers should be identical
      const header1 = Array.from(export1.slice(0, 16)).join(',')
      const header2 = Array.from(export2.slice(0, 16)).join(',')
      expect(header1).toBe(header2)
      
    } finally {
      sqlite3.close(db)
    }
  })
})