export type TODO = any

interface Window {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  sqlite3InitModule: (_?: TODO) => Promise<import('./sqlite3').Sqlite3>
}

export type Sqlite3 = {
  oo1: {
    DB: new (_: TODO) => DB
  }
  opfs?: {
    OpfsDb: new (filename: string, mode: string) => DB
    debug: TODO
    deleteEntry: TODO
    entryExists: TODO
    metrics: TODO
    mkdir: TODO
    randomFilename: TODO
    registerVfs: TODO
    rootDirectory: TODO
  }
}

export declare const InitWasm: () => Promise<Sqlite3>

export default InitWasm

export class DB {
  filename: string
  pointer: TODO

  affirmOpen(): DB

  changes(total: boolean, sixtyFour: boolean): number

  exec(options: ExecOptions): TODO
  exec(query: FlexibleString, options: ExecOptions): TODO
  close(): DB
  export(): TODO
  /**
   * @example aDb.prepare("INSERT INTO foo(a) VALUES(?)").bind(123).stepFinalize();
   */
  prepare(query: FlexibleString): Stmt

  checkRc(db: TODO, resultCode: TODO)

  createFunction(): TODO

  dbFilename(): string

  dbName(): string
}

export type ExecOptions = {
  sql?: FlexibleString
  bind?: Bindable
  // saveSql?: TODO

  returnValue?: 'this' | 'resultRows' | 'saveSql'

  rowMode?: 'array' | 'object' | 'stmt'

  resultRows?: TODO[]
}

export type FlexibleString = string | Uint8Array | Int8Array | string[]

/** https://sqlite.org/wasm/doc/trunk/api-oo1.md#stmt-properties */
export interface Stmt {
  columnCount: number
  parameterCount: number
  pointer: TODO

  bind(bindable: Bindable): Stmt
  bind(indexOrParameterName: number | string, bindable: Bindable): Stmt

  stepFinalize(): boolean
}

export type Bindable = BindableValue[] | Record<string, BindableValue>

export type BindableValue = null | undefined | number | boolean | string | Uint8Array | Int8Array
