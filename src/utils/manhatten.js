const Photos = require('../models/photos')
const path = require('path');
const axios = require('axios')
var fs = require('fs');
const { JSDOM } = require("jsdom");
// const { window } = new JSDOM();

var collecPhotos = []
collecPhotos[0] = require("../../public/photos/photos1.json")
collecPhotos[1]= require("../../public/photos/photos2.json")
collecPhotos[2]= require("../../public/photos/photos3.json")
collecPhotos[3]= require("../../public/photos/photos4.json")
collecPhotos[4]= require("../../public/photos/photos5.json")
collecPhotos[5]= require("../../public/photos/photos6.json")
collecPhotos[6]= require("../../public/photos/photos7.json")
collecPhotos[7]= require("../../public/photos/photos8.json")
collecPhotos[8]= require("../../public/photos/photos9.json")
collecPhotos[9] = require("../../public/photos/photos10.json")
collecPhotos[10] = require("../../public/photos/photos11.json")


require("dotenv").config({path:path.resolve(__dirname, '../../config/.env')});


//Preparing the array of classNames
var className = fs.readFileSync('categories_places365.txt').toString().split("\n");
for(i in className) {
    className[i]=className[i].substring(3,className[i].lastIndexOf(" "));
}

//API end-points
const predApi = 'https://flask-vector-lsh.herokuapp.com/predict?url='
const queryApi = 'https://flask-vector-lsh.herokuapp.com/queryImage?url='


const callPredictApi = async (url) => {
    try{
        const req = predApi + url
        const response = await axios.get(req)
        return response.data
    }catch(e){
        console.log(e);
    }
}

const callQueryImage = async (url) => {
    try{
        const req = queryApi+url
        const response = await axios.get(req)
        return response.data
    }catch(e){
        console.log(e);
    }
}

// const ui = 'https://farm8.staticflickr.com/7833/46568063274_3a6ae17ec2_n.jpg'
// const ui = 'https://images.all-free-download.com/images/graphicthumb/beautiful_scenery_04_hd_pictures_166258.jpg'
const ui ='https://static.toiimg.com/thumb/69430127/Valley-of-flowers.jpg?width=1200&height=900'

//main function which requires user image URL as the argument and returns an array of images similar to that 
const manhatten = async(ui) => {
    try{
        // var start = window.performance.now();
        const uiPred = await callPredictApi(ui)
        // var end = window.performance.now();
        // console.log("### Prediction Recieved in : ",(end-start)/1000)

        // start = window.performance.now();
        const uiQueryRes = await callQueryImage(ui)
        // end = window.performance.now();
        // console.log("### LSH results Recieved in : ",(end-start)/1000)

        var probDict ={}
        var currArr = []
        var res = []

        //making the dictionary
        for(var i=0;i<uiPred.length;i++){
             probDict[className[i]] = uiPred[i]
        }

        // start = window.performance.now();
        for(var i=0;i<uiQueryRes.length;i++){
            let mne = 0
            const photo = await Photos.findById(uiQueryRes[i])
            // let photo
            // for(var j=0;j<collecPhotos.length;j++){
            //     if(collecPhotos[j][uiQueryRes[i]] !== undefined){
            //         photo = collecPhotos[j][uiQueryRes[i]] 
            //         break
            //     }
            // }
            //find in summation of abs differences for each tags of ith image in uiQueryRes
            for(const tag of photo.tags){
                mne += Math.abs(parseFloat(tag.prob)  - parseFloat(probDict[tag.name]))
            }
            if(mne!=0){
                var obj = {
                    id : uiQueryRes[i],
                    error : mne
                }
                res.push(obj)
            }  
        } 
        // end = window.performance.now();
        // console.log("### Iteration stopped in : ",(end-start)/1000)

        // start = window.performance.now();
        res.sort(function(a,b){
            return a.error > b.error ? 1 : -1;
        });
        // end = window.performance.now();
        // console.log("### sorting stopped in : ",(end-start)/1000)
        var results = []
        for(var i=0;i<Math.min(6,res.length);i++){
            const photo = await Photos.findById(res[i].id)
            var obj = {
                url:photo.url,
                city : photo.place,
                state: photo.state,
            }
            results.push(obj)
        }
        return results
    }
    catch(e){
        // console.log(e)
        return []
    }
}

module.exports = manhatten










const utils = async() => {
    const photos = await Photos.find({})
    for(var j=3;j<11;j++){
        getPhoto(photos,j*1000,(j+1)*1000,j+1)
    }
    console.log(" Wholesome completed !!")
}
const getPhoto = async(photos,ll,hl,idx) => {
    console.log("Length of photo collection : ",photos.length)

    var dict = {}
    for(var i=ll;i<Math.min(hl,photos.length);i++){
        dict[photos[i]._id] = photos[i]
    }
    var dictstring = JSON.stringify(dict);
    // console.log(dictstring["609c3a014d56933fe8a66bdf"])
    // console.log(Object.keys(dictstring).length)
    fs.writeFile(path.join(__dirname, `../../public/photos/photos${idx}.json`), dictstring, function(err, result) {
        if(err) console.log('error', err);
        console.log( idx ," completed !!")
    });
}

// utils()

// const photos11 = require("../../public/photos/photos11.json")
// console.log(Object.keys(photos11).length)