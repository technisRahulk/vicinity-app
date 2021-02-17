const express = require("express");
const States = require('../models/states.js')
const pendingUserUpload = require('../models/pendingUserUpload');
const { city, search, simIndex, searchDist } = require('../utils/flickr')
const trackData = require("../utils/finalAlgo");
const multer = require('multer')
const router = new express.Router();
const path = require('path')
const fs = require('fs')
var imgur = require('imgur')
//Index route
router.get('/', (req, response) => {
    var res = []
    var finalAns = [];
    var url;
    response.render('index', { res, layout: false, finalAns, url });
});


const { Heap } = require('heap-js');

const customPriorityComparator = (a, b) => {
    return a.score - b.score;
}

// route for user to search place by URL of image
router.post('/searchbyurl', (req, response) => {
    console.log("searchbyurl route invoked")
    console.log("User Cooridinates: ", req.body.lat, req.body.long)
    var imgURL = req.body.url
    var reqState = req.body.state.toLowerCase()
    // console.log(reqState)
    var user_arr = []
    //console.log(imgURL);
    search(imgURL, (err, res) => {
        if (err) {
            console.log(err);
            return response.render('error', { err })
        }
        // console.log(res)
        user_arr = res
        // console.log("res.body -----> \n" + res[0])
        States.findOne({ name: reqState })
            .then(state => {
                if (state) {
                    var cities = state.cities
                    var max = 0
                    var city_id, photo_id
                    const minHeap = new Heap(customPriorityComparator);
                    let myMap = new Map();
                    var duplicates = {};
                    var curArr = [];
                    for (var i = 0; i < cities.length; i++) {
                        var city = cities[i]
                        for (var j = 0; j < city.photos.length; j++) {
                            if (city.photos[j].isActive) {
                                if (curArr.length < 6) {
                                    if (!duplicates[city.photos[j].url]) {
                                        duplicates[city.photos[j].url] = 1;
                                        curArr.push({ city_id: i, photo_id: j, score: simIndex(city.photos[j].tags, user_arr) });
                                    }
                                    if (curArr.length == 6) {
                                        minHeap.init(curArr);
                                        for (var k = 0; k < curArr.length; k++) {
                                            myMap.set('city_id=' + curArr[k].city_id + 'photo_id=' + curArr[k].photo_id + 'score=' + curArr[k].score, k);
                                        }
                                    }
                                } else {
                                    var sim = simIndex(city.photos[j].tags, user_arr);
                                    var score = sim;
                                    var obj = minHeap.top();

                                    if (duplicates[city.photos[j].url]) continue;
                                    duplicates[city.photos[j].url] = 1;
                                    if (score < obj[0].score) continue;
                                    var id = myMap.get('city_id=' + obj[0].city_id + 'photo_id=' + obj[0].photo_id + 'score=' + obj[0].score)
                                    myMap.delete('city_id=' + obj[0].city_id + 'photo_id=' + obj[0].photo_id + 'score=' + obj[0].score)
                                    curArr[id] = { city_id: i, photo_id: j, score: sim };
                                    if (!(0 <= id && id < 6)) {
                                        console.log(id);
                                    }
                                    minHeap.pop();
                                    minHeap.push({ city_id: i, photo_id: j, score: sim });
                                    myMap.set('city_id=' + i + 'photo_id=' + j + 'score=' + score, id);
                                }
                            }
                        }
                    }
                    let res = []
                    for (var i = 0; i < curArr.length; i++) {
                        var city_index = curArr[i].city_id
                        var photo_index = curArr[i].photo_id
                        console.log(curArr[i].score)
                        var obj = {
                            city: cities[city_index].name,
                            url: cities[city_index].photos[photo_index].url,
                            state: reqState
                        }
                        console.log(obj)
                        res.push(obj)
                    }
                    var finalAns = []
                    var url = imgURL
                    response.render('index', {
                        res, finalAns, url
                    })
                } else {
                    response.render('errror', { err: "The State doesn't has ample amount of scenic places" })
                }
            })
            .catch(error => {
                console.log(error)
                response.render('error', { err: error })
            })
    })
})


// Set up multer for storing images
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var newDestination = __dirname + `./../../public/uploads/`
        cb(null, newDestination)
    },
    filename: function (req, file, cb) {
        var filename = file.originalname;
        cb(null, filename);
    }
});

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            //cb(new Error('Please upload an Image file (.jpg, .jpeg, .png only)'));
            return cb('error: Images only!')
        }
        cb(undefined, true);
    }
});

const cloudinary = require('cloudinary').v2

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


router.get('/userupload', (req, res) => {
    res.render('userUpload');
})

router.post('/userupload', upload.single('file'), (req, res) => {
    const reqState = req.body.state;
    const reqCity = req.body.city;

    const tempPath = req.file.originalname;
    var uploadPath = __dirname + `./../../public/uploads/` + tempPath;

    cloudinary.uploader.upload(uploadPath, function(err, body){
        console.log(err, body.url);
        if(err) {
            return res.send(err);
        }
        const reqUrl = body.url;

        const newUpload = new pendingUserUpload();
        newUpload.state = reqState;
        newUpload.city = reqCity;
        newUpload.url = reqUrl;

        newUpload.save()
            .then((body) => {
                fs.unlinkSync(uploadPath);
                console.log("Deleted file: " + uploadPath);
                res.send('Your uploaded Image has been forwarded to Admin Panel. We will get back to you once verification is done.')
            })
            .catch((err) => {
                res.send(err);
            })
    })
})


// route for user to upload image and enter state name
router.post('/searchbyimage', upload.single('file'), (req, response) => {
    console.log("searchbyimage route invoked")
    console.log("User Cooridinates: ", req.body.lat, req.body.long)
    var reqState = req.body.state.toLowerCase();
    console.log(reqState)
    var user_arr = []
    var url;
    const tempPath = req.file.originalname;
    var uploadPath = __dirname + `./../../public/uploads/` + tempPath
    imgur.uploadFile(uploadPath)
        .then(function (json) {
            console.log(json.data.link);
            url = json.data.link;
            search(json.data.link, (err, res) => {
                if (err) return console.log(err);
                user_arr = res
                console.log(user_arr);
                States.findOne({ name: reqState })
                    .then(state => {
                        if (state) {
                            var cities = state.cities
                            var max = 0
                            var city_id, photo_id
                            const minHeap = new Heap(customPriorityComparator);
                            let myMap = new Map();
                            var curArr = [];
                            for (var i = 0; i < cities.length; i++) {
                                var city = cities[i]
                                for (var j = 0; j < city.photos.length; j++) {
                                    if (city.photos[j].isActive) {
                                        if (curArr.length < 6) {
                                            curArr.push({ city_id: i, photo_id: j, score: simIndex(city.photos[j].tags, user_arr) });
                                            if (curArr.length == 6) {
                                                minHeap.init(curArr);
                                                for (var k = 0; k < curArr.length; k++) {
                                                    myMap.set('city_id=' + curArr[k].city_id + 'photo_id=' + curArr[k].photo_id + 'score=' + curArr[k].score, k);
                                                }
                                            }
                                        } else {
                                            var sim = simIndex(city.photos[j].tags, user_arr);
                                            var score = sim;
                                            var obj = minHeap.top();
                                            if (myMap.has('city_id=' + i + 'photo_id=' + j + 'score=' + sim)) continue;
                                            if (score < obj[0].score) continue;
                                            var id = myMap.get('city_id=' + obj[0].city_id + 'photo_id=' + obj[0].photo_id + 'score=' + obj[0].score)
                                            myMap.delete('city_id=' + obj[0].city_id + 'photo_id=' + obj[0].photo_id + 'score=' + obj[0].score)
                                            curArr[id] = { city_id: i, photo_id: j, score: sim };
                                            minHeap.pop();
                                            minHeap.push({ city_id: i, photo_id: j, score: sim });
                                            myMap.set('city_id=' + i + 'photo_id=' + j + 'score=' + score, id);
                                        }
                                    }
                                }
                            }
                            let res = []
                            for (var i = 0; i < curArr.length; i++) {
                                var city_index = curArr[i].city_id
                                var photo_index = curArr[i].photo_id
                                var obj = {
                                    city: cities[city_index].name,
                                    url: cities[city_index].photos[photo_index].url,
                                    state: reqState
                                }
                                console.log(obj)
                                res.push(obj)
                            }
                            var finalAns = []
                            response.render('index', {
                                finalAns, res, url
                            })
                        } else {
                            response.render('error', { err: "The State doesn't has ample amount of scenic places" })
                        }
                    })
                    .then(() => {
                        fs.unlinkSync(uploadPath)
                        console.log("Deleted file: " + uploadPath)
                    })
                    .catch(error => {
                        console.log(error)
                        response.render('error', { err: error })
                    })
            })
        })
        .catch(function (err) {
            console.error(err);
            response.render('error', { err })
        });
})

// The main route
router.post("/searchGlobal", upload.single('file1'), async (req, response) => {
    var state_, url_, district_, county_, city_, locality_;
    const tempPath = req.file.originalname;
    var uploadPath = __dirname + `./../../public/uploads/` + tempPath

    await imgur.uploadFile(uploadPath)
        .then(function (json) {
            url = json.data.link
        })
        .then(() => {
            fs.unlinkSync(uploadPath)
            console.log("Deleted file: " + uploadPath)
        })
        .catch(err => {
            console.log(err)
            return response.send('error', { err })
        })

    if (req.body.lat && req.body.long) {
        var lat_ = req.body.lat, long_ = req.body.long;

        var x;
        try {
            x = await city(lat_, long_);
        } catch (err) {
            response.render('error', { err })
        }

        state_ = x.State;
        district_ = x.District;
        county_ = x.County;
        town_ = x.town;
        city_ = x.city;
        locality_ = x.locality;

    } else {
        state_ = req.body.state;
        district_ = req.body.district;
    }



    async function cb(globalArr) {
        const customDistComparator = (a, b) => {
            return a.dist - b.dist;
        }
        var finalAns = [];
        let myMap = new Map();
        var temp = [];
        finalAns.push(globalArr[0]);
        for (i = 0; i < globalArr[0].length; i++) {
            myMap.set(globalArr[0][i].url, 1);
        }
        for (i = 0; i < globalArr[1].length; i++) {
            if (myMap.has(globalArr[1][i].url)) {
                continue;
            }
            else temp.push(globalArr[1][i]);
        }
        finalAns.push(temp);
        temp = [];
        myMap.clear();
        for (i = 0; i < globalArr[1].length; i++) {
            myMap.set(globalArr[1][i].url, 1);
        }
        for (i = 0; i < globalArr[2].length; i++) {
            if (myMap.has(globalArr[2][i].url)) {
                continue;
            }
            else temp.push(globalArr[2][i]);
        }
        finalAns.push(temp);
        temp = [];
        myMap.clear();
        for (i = 0; i < globalArr[2].length; i++) {
            myMap.set(globalArr[2][i].url, 1);
        }
        for (i = 0; i < globalArr[3].length; i++) {
            if (myMap.has(globalArr[3][i].url)) {
                continue;
            }
            else temp.push(globalArr[3][i]);
        }
        finalAns.push(temp);
        for (i = 0; i < finalAns.length; i++) finalAns[i].sort(customDistComparator);
        console.log('finalAns: ', finalAns);
        var res = []
        response.render('index', { finalAns, res, url, state_ });
    }

    trackData(state_.toLowerCase(), district_, url, cb);

})


router.get("/viewDetails/:city/:state", async (req, res) => {
    console.log(req.params.city);
    console.log(req.query.user_state);
    try {
        await searchDist(req.params.city, 'assam', (err, body) => {
            if (err) {
                return res.render('error', { err })
            }
            // body = JSON.parse(body)
            console.log(body.stops[0].wikipedia);
            res.render('viewDetails', { body, city: req.params.city, state: req.params.state, url: req.query.url });
        })
    } catch (e) {
        res.render('error', { err: e })
    }
})


module.exports = router;
