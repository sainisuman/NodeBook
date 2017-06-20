var mongoose = require('mongoose');

var noteSchema = new mongoose.Schema({
    'noteText': {
        type: String
    },
    'noteUser': String,
    'noteUserEmail': String,
    'noteDate': {
        type: Date,
        default: Date.now
    }
});

module.exports = noteSchema;