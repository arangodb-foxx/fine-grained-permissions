'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const restrict = require('../util/restrict');
const hasPerm = require('../util/hasPerm');
const Patient = require('../models/patient');

const patients = module.context.collection('patients');
const keySchema = joi.string().required()
.description('The key of the patient');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('patient');


router.get(function (req, res) {
  res.send(patients.all());
}, 'list')
.response([Patient], 'A list of patients.')
.summary('List all patients')
.description(dd`
  Retrieves a list of all patients.
`);


router.post(function (req, res) {
  const patient = req.body;
  let meta;
  try {
    meta = patients.save(patient);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(patient, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: patient._key})
  ));
  res.send(patient);
}, 'create')
.body(Patient, 'The patient to create.')
.response(201, Patient, 'The created patient.')
.error(HTTP_CONFLICT, 'The patient already exists.')
.summary('Create a new patient')
.description(dd`
  Creates a new patient from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let patient
  try {
    patient = patients.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(patient);
}, 'detail')
.pathParam('key', keySchema)
.response(Patient, 'The patient.')
.summary('Fetch a patient')
.description(dd`
  Retrieves a patient by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const patient = req.body;
  let meta;
  try {
    meta = patients.replace(key, patient);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(patient, meta);
  res.send(patient);
}, 'replace')
.pathParam('key', keySchema)
.body(Patient, 'The data to replace the patient with.')
.response(Patient, 'The new patient.')
.summary('Replace a patient')
.description(dd`
  Replaces an existing patient with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let patient;
  try {
    patients.update(key, patchData);
    patient = patients.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(patient);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the patient with.'))
.response(Patient, 'The updated patient.')
.summary('Update a patient')
.description(dd`
  Patches a patient with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    patients.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a patient')
.description(dd`
  Deletes a patient from the database.
`);
