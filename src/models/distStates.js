const mongoose = require('mongoose');
const validator = require('validator');

const dStates = new mongoose.Schema({
    mapStateIndex : [{
        state : {
            type: String,
            trim: true,
            required: true
        },
        capital: {
            type: String,
            trim: true,
            required: true
        },
        index : {
            type: Number,
            required: true
        }
    }],
    dist:[[]]
})

const DistStates = mongoose.model('dStates', dStates);
module.exports = DistStates;