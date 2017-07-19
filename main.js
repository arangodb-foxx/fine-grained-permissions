'use strict';

module.context.use('/patients', require('./routes/patients'), 'patients');
module.context.use('/auth', require('./routes/auth'), 'auth');

const sessionsMiddleware = require('@arangodb/foxx/sessions');
const sessions = sessionsMiddleware({
  storage: module.context.collection('sessions'),
  transport: 'cookie'
});
module.context.use(sessions);
