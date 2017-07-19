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
