'use strict';

module.context.use('/patients', require('./routes/patients'), 'patients');

const sessionsMiddleware = require('@arangodb/foxx/sessions');
const sessions = sessionsMiddleware({
  storage: module.context.collection('sessions'),
  transport: 'cookie'
});
module.context.use(sessions);
