'use strict';

var _ = require('underscore');
var request = require('request');
var prompt = require('prompt');
var promptWizard = require('./wizard');

prompt.message = '';

var CLOUD_PLATFORM_URL = 'https://cloudplatform.coveo.com/rest';

/*
 * Print loading dots.
 */
var loader = {
  setup: () => {
    process.stdout.write('Retrieving data...');

    this.timeoutID = setInterval((msg) => {
      process.stdout.write(msg);
    }.bind(this), 100, '.');
  },

  cancel: () => {
    clearTimeout(this.timeoutID);
    this.timeoutID = undefined;
    console.log('');
  }
};

/*
 * Get source fields from Cloud V1.
 */
function queryCloudSource(cloudOpts, callback) {
  var fieldsUrl = CLOUD_PLATFORM_URL + '/workgroups/' + cloudOpts.workgroup + '/fields?sourceId=' + cloudOpts.sourceid;
  var valuesUrl = CLOUD_PLATFORM_URL + '/search?maximumAge=0&errors=AsSuccess=1';
  var form = {
    aq: '@syssource=="' + cloudOpts.syssource + '"',
    firstResult: 0,
    numberOfResults: 10,
    excerptLength: 200
  };

  var fields = {};

  loader.setup();
  request({
    url: fieldsUrl,
    headers: {
      'Authorization': 'Bearer ' + cloudOpts.token
    },
    json: true
  }, (err, res, body) => {
    if (!err && res.statusCode === 200) {

      // filter custom scripts
      var cs = _.filter(body, (metadata) => {
        return _.contains(cloudOpts.customScripts, metadata.name);
      });

      // get custom scripts content
      fields.scripts = _.pluck(cs, 'customScriptContent');

      // get source's first 10 values
      request.post({
        url: valuesUrl,
        headers: {
          'Authorization': 'Bearer ' + cloudOpts.token
        },
        form: form,
        json: true
      }, (err, res, body) => {
        loader.cancel();

        if (!err && res.statusCode === 200) {
          fields.env = body.results;
          return callback(null, fields);
        } else {
          if (!err) {
            err = new Error(res.statusCode + ': ' + JSON.stringify(body));
          }

          return callback(err);
        }
      });
    } else {
      loader.cancel();

      if (!err) {
        err = new Error(res.statusCode + ': ' + JSON.stringify(body));
      }

      return callback(err);
    }
  });
}

exports.getSourceFields = (cloudOpts) => {

  return new Promise((resolve, reject) => {
    if (cloudOpts) {
      queryCloudSource(cloudOpts, (err, fields) => {
        if (err) {
          return reject(err);
        }

        resolve(fields);
      });
    } else {
      console.log('This utility will walk you through mocking a conversion script on Coveo Cloud V1.');
      console.log('');
      console.log('Press ^C at any time to quit.');

      prompt.get(promptWizard, (err, result) => {
        if (err) {
          return reject(err);
        }

        // parse custom script names
        if (result.customScripts) {
          result.customScripts = result.customScripts.replace(/ /g, '').split(',');
        }

        queryCloudSource(result, (err, fields) => {
          if (err) {
            return reject(err);
          }

          resolve(fields);
        });
      });
    }
  });
};
