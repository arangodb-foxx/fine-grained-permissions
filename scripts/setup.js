'use strict';
const db = require('@arangodb').db;
const documentCollections = [
  "patients",
  "users",
  "usergroups",
  "sessions"
];
const edgeCollections = [
  "hasPerm",
  "memberOf"
];

for (const localName of documentCollections) {
  const qualifiedName = module.context.collectionName(localName);
  if (!db._collection(qualifiedName)) {
    db._createDocumentCollection(qualifiedName);
  } else if (module.context.isProduction) {
    console.debug(`collection ${qualifiedName} already exists. Leaving it untouched.`)
  }
}

for (const localName of edgeCollections) {
  const qualifiedName = module.context.collectionName(localName);
  if (!db._collection(qualifiedName)) {
    db._createEdgeCollection(qualifiedName);
  } else if (module.context.isProduction) {
    console.debug(`collection ${qualifiedName} already exists. Leaving it untouched.`)
  }
}

const users = module.context.collection('users');
users.ensureIndex({
  type: 'hash',
  fields: ['username'],
  unique: true
});
