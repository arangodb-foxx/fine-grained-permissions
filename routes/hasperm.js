'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const HasPerm = require('../models/hasperm');

const hasPermItems = module.context.collection('hasPerm');
const keySchema = joi.string().required()
.description('The key of the hasPerm');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('hasPerm');


const NewHasPerm = Object.assign({}, HasPerm, {
  schema: Object.assign({}, HasPerm.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(hasPermItems.all());
}, 'list')
.response([HasPerm], 'A list of hasPermItems.')
.summary('List all hasPermItems')
.description(dd`
  Retrieves a list of all hasPermItems.
`);


router.post(function (req, res) {
  const hasPerm = req.body;
  let meta;
  try {
    meta = hasPermItems.save(hasPerm._from, hasPerm._to, hasPerm);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(hasPerm, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: hasPerm._key})
  ));
  res.send(hasPerm);
}, 'create')
.body(NewHasPerm, 'The hasPerm to create.')
.response(201, HasPerm, 'The created hasPerm.')
.error(HTTP_CONFLICT, 'The hasPerm already exists.')
.summary('Create a new hasPerm')
.description(dd`
  Creates a new hasPerm from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let hasPerm
  try {
    hasPerm = hasPermItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(hasPerm);
}, 'detail')
.pathParam('key', keySchema)
.response(HasPerm, 'The hasPerm.')
.summary('Fetch a hasPerm')
.description(dd`
  Retrieves a hasPerm by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const hasPerm = req.body;
  let meta;
  try {
    meta = hasPermItems.replace(key, hasPerm);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(hasPerm, meta);
  res.send(hasPerm);
}, 'replace')
.pathParam('key', keySchema)
.body(HasPerm, 'The data to replace the hasPerm with.')
.response(HasPerm, 'The new hasPerm.')
.summary('Replace a hasPerm')
.description(dd`
  Replaces an existing hasPerm with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let hasPerm;
  try {
    hasPermItems.update(key, patchData);
    hasPerm = hasPermItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(hasPerm);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the hasPerm with.'))
.response(HasPerm, 'The updated hasPerm.')
.summary('Update a hasPerm')
.description(dd`
  Patches a hasPerm with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    hasPermItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a hasPerm')
.description(dd`
  Deletes a hasPerm from the database.
`);
