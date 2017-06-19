var mongoose = require('mongoose');
var userSchema = require('./user');

var userModel = mongoose.model('userModel', userSchema);

module.exports = userModel;