'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const User = require('../models/user');

const users = module.context.collection('users');
const keySchema = joi.string().required()
.description('The key of the user');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('user');


router.get(function (req, res) {
  res.send(users.all());
}, 'list')
.response([User], 'A list of users.')
.summary('List all users')
.description(dd`
  Retrieves a list of all users.
`);


router.post(function (req, res) {
  const user = req.body;
  let meta;
  try {
    meta = users.save(user);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(user, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: user._key})
  ));
  res.send(user);
}, 'create')
.body(User, 'The user to create.')
.response(201, User, 'The created user.')
.error(HTTP_CONFLICT, 'The user already exists.')
.summary('Create a new user')
.description(dd`
  Creates a new user from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let user
  try {
    user = users.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(user);
}, 'detail')
.pathParam('key', keySchema)
.response(User, 'The user.')
.summary('Fetch a user')
.description(dd`
  Retrieves a user by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const user = req.body;
  let meta;
  try {
    meta = users.replace(key, user);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(user, meta);
  res.send(user);
}, 'replace')
.pathParam('key', keySchema)
.body(User, 'The data to replace the user with.')
.response(User, 'The new user.')
.summary('Replace a user')
.description(dd`
  Replaces an existing user with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let user;
  try {
    users.update(key, patchData);
    user = users.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(user);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the user with.'))
.response(User, 'The updated user.')
.summary('Update a user')
.description(dd`
  Patches a user with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    users.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a user')
.description(dd`
  Deletes a user from the database.
`);
