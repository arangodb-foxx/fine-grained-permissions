'use strict';

module.context.use('/patients', require('./routes/patients'), 'patients');
module.context.use('/users', require('./routes/users'), 'users');
module.context.use('/usergroups', require('./routes/usergroups'), 'usergroups');
module.context.use('/sessions', require('./routes/sessions'), 'sessions');
module.context.use('/hasperm', require('./routes/hasperm'), 'hasperm');
module.context.use('/memberof', require('./routes/memberof'), 'memberof');
