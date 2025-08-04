import { makeSynchronousDatabase } from "../lib/lib.ts"
import WaSqliteFactory from '@livestore/wa-sqlite/dist/wa-sqlite.node.mjs'
import * as WaSqlite from '@livestore/wa-sqlite'
import { MemoryVFS } from '@livestore/wa-sqlite/src/examples/MemoryVFS.js'

const blob = new Uint8Array([
	84,  3,  1, 0, 0, 116, 111, 100, 111,
  115,  0, 18, 0, 3,   1,  50,   3,   2,
  116, 50,  1, 0, 0,   0,   0,   0,   0,
  0,  0
])

const main = async () => {
	const module = await WaSqliteFactory()
	const sqlite3 = WaSqlite.Factory(module)

	if (sqlite3.vfs_registered.has('memory-vfs') === false) {
		// @ts-expect-error TODO fix types
		const vfs = new MemoryVFS('memory-vfs', (sqlite3 as any).module)

		// @ts-expect-error TODO fix types
		sqlite3.vfs_register(vfs, false)
	}

	const db = sqlite3.open_v2Sync(':memory:', undefined, 'memory-vfs')

	const syncDb = makeSynchronousDatabase(sqlite3, db)

	syncDb.execute('CREATE TABLE todo (id TEXT PRIMARY KEY, title TEXT, completed INTEGER, blob BLOB)')


	syncDb.execute('INSERT INTO todo (id, title, completed, blob) VALUES (?, ?, ?, ?)', ['t2', 't2', 0, blob])

	console.log('res1', syncDb.select('SELECT * FROM todo'))
	console.log('res2', syncDb.select('SELECT * FROM todo'))


}

main().catch(console.error)

