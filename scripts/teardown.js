'use strict';
const db = require('@arangodb').db;
const collections = [
  "patients",
  "users",
  "usergroups",
  "sessions",
  "hasPerm",
  "memberOf"
];

for (const localName of collections) {
  const qualifiedName = module.context.collectionName(localName);
  db._drop(qualifiedName);
}
