var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    'userEmail': {
        type: String
    },
    'userPass': {
        type: String
    }
});

module.exports = userSchema;