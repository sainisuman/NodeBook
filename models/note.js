var mongoose = require('mongoose');

var noteSchema = new mongoose.Schema({
    'noteText': {
        type: String
    },
    'noteDate': {
        type: Date,
        default: Date.now
    }
});

module.exports = noteSchema;