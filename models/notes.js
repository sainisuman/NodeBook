var mongoose = require('mongoose');
var noteSchema = require('./note');

var noteModel = mongoose.model('noteModel', noteSchema);

module.exports = noteModel;