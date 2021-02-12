const mongoose = require('mongoose');
const validator = require('validator');

const statesSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    cities : [{
        name : {
            type: String,
            required: true
        },
        photos : [{
            url : {
                type : String,
                required : true
            },
            tags : [{
                name: String,
                prob: String
            }],
            placeName : {
                type : String
            },
            isActive :{
                type : Boolean,
                deafult : false
            }
        }]
    }]
})

const States = mongoose.model('States', statesSchema);
module.exports = States;