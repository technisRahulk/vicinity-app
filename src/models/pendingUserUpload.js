const mongoose = require('mongoose');
const validator = require('validator');

const pendingUserUploadSchema = new mongoose.Schema({
    state : {
        type: String,
        required: true
    },
    city : {
        type: String,
        required: true
    },
    url : {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String,
        required: false
    }
});

const pendingUserUpload = mongoose.model('pendingUserUpload', pendingUserUploadSchema);
module.exports = pendingUserUpload;