import { makeSynchronousDatabase } from "./lib/lib"
import WaSqliteFactory from '@livestore/wa-sqlite/dist/wa-sqlite.node.mjs'
import * as WaSqlite from '@livestore/wa-sqlite'
import { MemoryVFS } from '@livestore/wa-sqlite/src/examples/MemoryVFS.js'

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

	syncDb.execute('CREATE TABLE todo (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, group_id INTEGER, counter INTEGER)')

	syncDb.execute('INSERT INTO todo (title, group_id, counter) VALUES (?, ?, ?)', ['initial todo', 1, 0])

	const groupIds = [1, 2, 3]
	type GroupId = (typeof groupIds)[number]

	const newSession = (groupId: GroupId) => {
		const session = sqlite3.session_create(db, 'main')
		sqlite3.session_attach(session, null)
		// sqlite3.session_enable(session, false)
		return session
	}

	const sessions = Object.fromEntries(groupIds.map(groupId => [groupId, newSession(groupId)]))

	const newTodo = (groupId: GroupId) => {
		const session = sessions[groupId]

		sqlite3.session_enable(session, true)
		syncDb.execute('INSERT INTO todo (title, group_id, counter) VALUES (?, ?, ?)', [randomTodo(), groupId, 0])
		sqlite3.session_enable(session, false)
	}

	const rewindSession = (groupId: GroupId) => {
		const session = sessions[groupId]

		sqlite3.session_enable(session, true)
		// const changeset = sqlite3.session_changeset(session)
		// const invertedChangeset = sqlite3.changeset_invert(changeset.changeset)
		const invertedChangeset = sqlite3.session_changeset_inverted(session)

		sqlite3.changeset_apply(db, invertedChangeset.changeset)
	}

	const result = syncDb.select('SELECT * FROM todo')
	console.log('initial result', result)

	for (const groupId of groupIds) {
		newTodo(groupId)
		newTodo(groupId)
	}

	console.log('after inserts', syncDb.select('SELECT * FROM todo'))

	// extra update bound to session 3
	const session3 = sessions[3]
	sqlite3.session_enable(session3, true)
	syncDb.execute('UPDATE todo SET title = ?, counter = counter + 3 WHERE id = ?', ['updated todo in session 3', 1])
	sqlite3.session_enable(session3, false)

	// extra update bound to session 2
	const session2 = sessions[2]
	sqlite3.session_enable(session2, true)
	syncDb.execute('UPDATE todo SET title = ?, counter = counter + 1 WHERE id = ?', ['updated todo in session 2', 1])
	sqlite3.session_enable(session2, false)

	for (const groupId of groupIds) {
		rewindSession(groupId)
		console.log(`after rewind ${groupId}`, syncDb.select('SELECT * FROM todo'))
	}

	for (const groupId of groupIds) {
		sqlite3.session_delete(sessions[groupId])
	}

	sqlite3.close(db)

}

main().catch(console.error)

const randomTodo = () => `${randomVerb()} ${randomThing()}`

const randomVerb = () => {
	const verbs = ['Buy', 'Clean', 'Cook', 'Fix', 'Learn', 'Make', 'Organize', 'Plan', 'Read', 'Write', 'Call', 'Email', 'Meet', 'Visit', 'Attend', 'Prepare', 'Review', 'Study', 'Practice', 'Exercise', 'Paint', 'Draw', 'Create', 'Design', 'Build', 'Repair', 'Update', 'Finish', 'Start', 'Schedule'];
	return verbs[Math.floor(Math.random() * verbs.length)];
}

const randomThing = () => {
	const things = ['groceries', 'car', 'dinner', 'leaky faucet', 'new skill', 'cake', 'closet', 'vacation', 'book', 'essay', 'friend', 'client', 'colleague', 'grandma', 'conference', 'presentation', 'report', 'exam', 'instrument', 'workout routine', 'bedroom', 'portrait', 'website', 'furniture', 'birdhouse', 'bike', 'software', 'project', 'business plan', 'appointment'];
	return things[Math.floor(Math.random() * things.length)];
}