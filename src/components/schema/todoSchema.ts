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

export const todoSchema: RxJsonSchema<TodoDocType> = todoSchemaLiteral;

// New schema for a list of string IDs
export const listSchemaLiteral = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100, // <- the primary key must have set maxLength
    }
  },
  required: ["id"],
} as const;

const listSchemaTyped = toTypedRxJsonSchema(listSchemaLiteral);
export type ListDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof listSchemaTyped
>;

export type ListCollection = RxCollection<ListDocType>;

export const listSchema: RxJsonSchema<ListDocType> = listSchemaLiteral;

export type MyDatabaseCollections = {
  todos: TodoCollection;
  lists: ListCollection; // <- Add the new collection type here
};

export type MyDatabase = RxDatabase<MyDatabaseCollections>;

let dbPromise: Promise<MyDatabase>;
const _create = async () => {
  const db: MyDatabase = await createRxDatabase<MyDatabaseCollections>({
    name: "mytododb",
    storage: getRxStorageDexie(),
  });
  
  // Add both collections: todos and lists
  await db.addCollections({
    todos: {
      schema: todoSchema,
    },
    lists: {
      schema: listSchema,
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
