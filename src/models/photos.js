const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
    url: {
        type: String,
        require: true
    },
    place: {
        type: String,
        lowercase: true,
        require: true
    },
    state: {
        type: String,
        lowercase: true,
        require: true
    },
    tags :[{
            name : String,
            prob : String
    }]
});

const Photo = mongoose.model('photo', photoSchema);
module.exports = Photo;