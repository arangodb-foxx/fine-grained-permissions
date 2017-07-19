'use strict';
const joi = require('joi');
const createRouter = require('@arangodb/foxx/router');
const auth = require('../util/auth');

const users = module.context.collection('users');

const router = createRouter();
module.exports = router;

router.post('/login', function (req, res) {
  const username = req.body.username;
  const user = users.firstExample({username});
  const valid = auth.verify(
    user ? user.authData : {},
    req.body.password
  );
  if (!valid) res.throw('unauthorized');
  req.session.uid = user._key;
  req.sessionStorage.save(req.session);
  res.send({sucess: true});
})
.body(joi.object({
  username: joi.string().required(),
  password: joi.string().required()
}).required(), 'Credentials')
.description('Logs a registered user in.');

router.post('/signup', function (req, res) {
  const user = {};
  try {
    user.authData = auth.create(req.body.password);
    user.username = req.body.username;
    user.perms = ['add_patients', 'view_patients'];
    const meta = users.save(user);
    Object.assign(user, meta);
  } catch (e) {
    // Failed to save the user
    // We'll assume the uniqueness constraint has been violated
    res.throw('bad request', 'Username already taken', e);
  }
  req.session.uid = user._key;
  req.sessionStorage.save(req.session);
  res.send({success: true});
})
.body(joi.object({
  username: joi.string().required(),
  password: joi.string().required()
}).required(), 'Credentials')
.description('Creates a new user and logs them in.');

router.get('/whoami', function (req, res) {
  try {
    const user = users.document(req.session.uid);
    res.send({username: user.username});
  } catch (e) {
    res.send({username: null});
  }
})
.description('Returns the currently active username.');

router.post('/logout', function (req, res) {
  if (req.session.uid) {
    req.session.uid = null;
    req.sessionStorage.save(req.session);
  }
  res.send({success: true});
})
.description('Logs the current user out.');
