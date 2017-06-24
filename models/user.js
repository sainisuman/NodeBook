var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    'userFirstName': {
        type: String
    },
    'userLastName': {
        type: String
    },
    'userName': {
        type: String
    },
    'userEmail': {
        type: String
    },
    'userPass': {
        type: String
    }
});

module.exports = userSchema;