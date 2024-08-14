import {
  createRxDatabase,
  RxDatabase,
  RxCollection,
  RxJsonSchema,
  addRxPlugin,
  toTypedRxJsonSchema,
  ExtractDocumentTypeFromTypedRxJsonSchema,
} from "rxdb";

import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

addRxPlugin(RxDBQueryBuilderPlugin);

export const todoSchemaLiteral = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100, // <- the primary key must have set maxLength
    },
    name: {
      type: "string",
    },
    done: {
      type: "boolean",
    },
  },
  required: ["id", "name", "done"],
} as const;

const schemaTyped = toTypedRxJsonSchema(todoSchemaLiteral);
export type TodoDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

export type TodoCollection = RxCollection<TodoDocType>;

export type MyDatabaseCollections = {
  todos: TodoCollection;
};

export type MyDatabase = RxDatabase<MyDatabaseCollections>;

export const todoSchema: RxJsonSchema<TodoDocType> = todoSchemaLiteral;

let dbPromise: Promise<MyDatabase>;
const _create = async () => {
  const db: MyDatabase = await createRxDatabase<MyDatabaseCollections>({
    name: "mytododb",
    storage: getRxStorageDexie(),
  });
  await db.addCollections({
    todos: {
      schema: todoSchema,
    },
  });
  return db;
};

export const getDatabase = () => {
  if (!dbPromise) {
    dbPromise = _create();
  }
  return dbPromise;
};