'use strict';

var DocumentInfo = {
  Title: '',
  URI: '',
  raw: {},
  IsValid: true,
  SummaryConcepts: '',
  Language: '1',
  SetFieldValue: function(name, value) {
    this.raw[name] = value;
  },
  GetFieldValue: function(name) {
    if (this.raw[name]) {
      return this.raw[name];
    } else {
      throw 'Metadata [' + name + '] not found!';
    }
  }
};

module.exports = DocumentInfo;
