'use strict';

var validate = require('uuid-validate');

module.exports = {
  properties: {
    sourceid: {
      description: 'Source ID: ',
      type: 'string',
      message: 'Not a valid Source ID',
      required: true,
    },
    syssource: {
      description: 'Source Name: ',
      type: 'string',
      message: 'Not a valid Source Name',
      required: true,
    },
    workgroup: {
      description: 'Workgroup: ',
      type: 'string',
      message: 'Not a valid Workgroup',
      required: true,
    },
    token: {
      description: 'Token: Bearer ',
      type: 'string',
      message: 'Bearer Token must be a valid UUID',
      required: true,
      conform: (value) => {
        return validate(value);
      },
    },
    customScripts: {
      description: 'Custom Script names: (comma-separated)',
      type: 'string',
      required: false,
    },
  },
};
