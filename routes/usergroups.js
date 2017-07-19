'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Usergroup = require('../models/usergroup');

const usergroups = module.context.collection('usergroups');
const keySchema = joi.string().required()
.description('The key of the usergroup');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('usergroup');


router.get(function (req, res) {
  res.send(usergroups.all());
}, 'list')
.response([Usergroup], 'A list of usergroups.')
.summary('List all usergroups')
.description(dd`
  Retrieves a list of all usergroups.
`);


router.post(function (req, res) {
  const usergroup = req.body;
  let meta;
  try {
    meta = usergroups.save(usergroup);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(usergroup, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: usergroup._key})
  ));
  res.send(usergroup);
}, 'create')
.body(Usergroup, 'The usergroup to create.')
.response(201, Usergroup, 'The created usergroup.')
.error(HTTP_CONFLICT, 'The usergroup already exists.')
.summary('Create a new usergroup')
.description(dd`
  Creates a new usergroup from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let usergroup
  try {
    usergroup = usergroups.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(usergroup);
}, 'detail')
.pathParam('key', keySchema)
.response(Usergroup, 'The usergroup.')
.summary('Fetch a usergroup')
.description(dd`
  Retrieves a usergroup by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const usergroup = req.body;
  let meta;
  try {
    meta = usergroups.replace(key, usergroup);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(usergroup, meta);
  res.send(usergroup);
}, 'replace')
.pathParam('key', keySchema)
.body(Usergroup, 'The data to replace the usergroup with.')
.response(Usergroup, 'The new usergroup.')
.summary('Replace a usergroup')
.description(dd`
  Replaces an existing usergroup with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let usergroup;
  try {
    usergroups.update(key, patchData);
    usergroup = usergroups.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(usergroup);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the usergroup with.'))
.response(Usergroup, 'The updated usergroup.')
.summary('Update a usergroup')
.description(dd`
  Patches a usergroup with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    usergroups.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a usergroup')
.description(dd`
  Deletes a usergroup from the database.
`);
