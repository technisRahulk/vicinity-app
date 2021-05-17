const mongoose = require("mongoose");
const LshPhotos = require('../models/lshPhotos.js');
const Photo = require('../models/photos');
const path = require('path');
const request=require('request')

require("dotenv").config({path:path.resolve(__dirname, '../../config/.env')});

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
}).then(() => {
    console.log("Connected to mongo server from mapPhotosToLshPhotos")
}).catch((err) => {
    console.log(err)
})

const lshApi = 'https://flask-vector-lsh.herokuapp.com/predict?url='

const callLshApi = (url, callback) => {
    req = lshApi+url
    request({req, json:true}, (err,{body}={}) => {
        if(err) callback("flask-vector-lsh not accessed", undefined)
        else if(body.error) callback("flask-vector-lsh did not respond", undefined)
        else callback(undefined, body)
    })
}

const mapPhotos = async() => {
    try {
        const photos = await Photo.find({})
        for(photo of photos){
            var url = photo.url
            var id = photo._id
            callLshApi(url, (err, res) => {
                if(err) console.log(err)
                else {
                    res.array.forEach(element => {
                        var bucketID = element.bucketID
                        var li = element.li
                        LshPhotos.findOne({bucketID})
                            .then(bucket => { bucket.li.push(id) })
                            .then(LshPhotos.save())
                    });
                }
            })
        }

    } catch {

    }
}

module.exports = mapPhotos