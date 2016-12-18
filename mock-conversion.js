var fs = require('fs');
var _ = require('underscore');
var program = require('commander');
var prettyjson = require('prettyjson');
var vm = require('vm');

var pjson = require('./package.json');
var retriever = require('./lib/retriever');

// Global variables made available to the VM
DocumentInfo = require('./lib/DocumentInfo');
PostConversion = require('./lib/PostConversion');

// Mock VBArray
var VBArray = function(string) {
  this.content = string;
};

VBArray.prototype.toArray = function() {
  return this.content.split(';');
};

/*
 * Run each conversion script in the environment.
 */
var convert = function(fields, showBody) {
  _.each(fields.env, (result) => {
    DocumentInfo = _.extend(DocumentInfo, result);

    if (DocumentInfo.Body) {
      PostConversion.SetBody(DocumentInfo.Body);
      delete DocumentInfo.Body;
    }

    _.each(fields.scripts, (script) => {
      vm.runInThisContext(script);
    });

    // console.log(JSON.stringify(DocumentInfo, null, 2));
    var formattedDocument = JSON.parse(JSON.stringify(DocumentInfo));
    console.log(prettyjson.render(formattedDocument));

    if (showBody) {
      console.log('Body >>> ' + PostConversion.Body);
    }

    console.log('');
  });
};

program
  .version(pjson.version)
  .arguments('[config]')
  .option('-b, --show-body', 'print document body')
  .action((config) => {
    configValue = config;
  });

program.parse(process.argv);

if (typeof configValue === 'undefined') {
  var fieldsPromise = retriever.getSourceFields();

  fieldsPromise.then(function(fields) {
    convert(fields, program.showBody);
  }).catch(function(err) {
    console.error(err.message);
  });
} else {
  try {
    var conf = JSON.parse(fs.readFileSync(configValue));

    switch (conf.envProvider) {
      case 'local':
        var fields = {};

        fields.env = JSON.parse(fs.readFileSync(conf.env.local));
        fields.scripts = _.map(conf.localScripts, function(script) {
          return fs.readFileSync(script);
        });

        convert(fields, program.showBody);
        break;
      case 'cloud':
        var fieldsPromise = retriever.getSourceFields(conf.env.cloud);

        fieldsPromise.then(function(fields) {
          // add local scripts if any
          var localScripts = _.map(conf.localScripts, function(script) {
            return fs.readFileSync(script);
          });

          Array.prototype.push.apply(fields.scripts, localScripts);
          convert(fields, program.showBody);
        }).catch(function(err) {
          console.error(err.message);
        });
        break;
      default:
        console.error('Unknown environment provider: ' + conf.envProvider);
        process.exit(1);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
