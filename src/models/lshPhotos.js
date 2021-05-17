const mongoose = require('mongoose');

const lshPhotosSchema = new mongoose.Schema({
    bucketID: {
        type: Number,
        require: true
    },
    L1: [{
        type: String,
        require: true
    }],
    L2: [{
        type: String,
        require: true
    }],
    L3: [{
        type: String,
        require: true
    }],
    L4: [{
        type: String,
        require: true
    }],
    L5: [{
        type: String,
        require: true
    }],
    L6: [{
        type: String,
        require: true
    }],
    L7: [{
        type: String,
        require: true
    }],
    L8: [{
        type: String,
        require: true
    }],
    L9: [{
        type: String,
        require: true
    }],
    L10: [{
        type: String,
        require: true
    }]
});

const LshPhotosSchema = mongoose.model('lshphoto', lshPhotosSchema);
module.exports = LshPhotosSchema;