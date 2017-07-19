'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Session = require('../models/session');

const sessions = module.context.collection('sessions');
const keySchema = joi.string().required()
.description('The key of the session');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('session');


router.get(function (req, res) {
  res.send(sessions.all());
}, 'list')
.response([Session], 'A list of sessions.')
.summary('List all sessions')
.description(dd`
  Retrieves a list of all sessions.
`);


router.post(function (req, res) {
  const session = req.body;
  let meta;
  try {
    meta = sessions.save(session);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(session, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: session._key})
  ));
  res.send(session);
}, 'create')
.body(Session, 'The session to create.')
.response(201, Session, 'The created session.')
.error(HTTP_CONFLICT, 'The session already exists.')
.summary('Create a new session')
.description(dd`
  Creates a new session from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let session
  try {
    session = sessions.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(session);
}, 'detail')
.pathParam('key', keySchema)
.response(Session, 'The session.')
.summary('Fetch a session')
.description(dd`
  Retrieves a session by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const session = req.body;
  let meta;
  try {
    meta = sessions.replace(key, session);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(session, meta);
  res.send(session);
}, 'replace')
.pathParam('key', keySchema)
.body(Session, 'The data to replace the session with.')
.response(Session, 'The new session.')
.summary('Replace a session')
.description(dd`
  Replaces an existing session with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let session;
  try {
    sessions.update(key, patchData);
    session = sessions.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(session);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the session with.'))
.response(Session, 'The updated session.')
.summary('Update a session')
.description(dd`
  Patches a session with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    sessions.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a session')
.description(dd`
  Deletes a session from the database.
`);
