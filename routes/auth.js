'use strict';
const joi = require('joi');
const createRouter = require('@arangodb/foxx/router');
const auth = require('../util/auth');

const users = module.context.collection('users');

const router = createRouter();
module.exports = router;
