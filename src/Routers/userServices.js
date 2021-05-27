const express = require("express");
const States = require('../models/states.js')
const pendingUserUpload = require('../models/pendingUserUpload');
const { search, simIndex, searchDist } = require('../utils/flickr')
const multer = require('multer')
const router = new express.Router();
const fs = require('fs')
var imgur = require('imgur')
const manhatten = require('../utils/manhatten')
const path = require('path')

const cloudinary = require('cloudinary').v2
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
    var imgURL = req.body.url
    var reqState = req.body.state.toLowerCase()
    var user_arr = []
    search(imgURL, (err, res) => {
        if (err) {
            console.log(err);
            return response.render('error', { err })
        }
        user_arr = res
        States.findOne({ name: reqState })
            .then(state => {
                if (state) {
                    var cities = state.cities
                    var max = 0
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
            return cb('error: Images only!')
        }
        cb(undefined, true);
    }
});


// route for user to upload image and enter state name
router.post('/searchbyimage', upload.single('file'), (req, response) => {
    console.log("searchbyimage route invoked")
    var reqState = req.body.state.toLowerCase();
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
                States.findOne({ name: reqState })
                    .then(state => {
                        if (state) {
                            var cities = state.cities
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
                        // removeDir(uploadPath)
                        console.log("Deleted file")
                    })
                    .catch(error => {
                        fs.unlinkSync(uploadPath)
                        // console.log(error)
                        // removeDir(uploadPath)
                        response.render('error', { err: error })
                    })
            })
        })
        .catch(function (err) {
            // console.error(err);
            return response.render('error', {err: "OOPS! Seems like IMGUR didn't function properly! Please go back and try again."});
        });
})

router.post("/searchLSH", upload.single('file1'), async (req, response) => {
    const tempPath = req.file.originalname;
    // const uploadPath = path.join(__dirname, `./../../public/uploads/` + tempPath) 
    // const uploadPath = __dirname + `./../../public/uploads/` + tempPath
    //For heroku
    const uploadPath = `/app/public/uploads/` + tempPath
    console.log("Path : ",uploadPath)
    const emptyArr = []
    var url = '';
    try{
        await imgur.uploadFile(uploadPath)
            .then(function (json) {
                url = json.data.link
            })
            .then(() => {
                fs.unlinkSync(uploadPath)
                // removeDir(uploadPath)
                console.log("Deleted file")
            })
            .catch(err => {
                // console.log(err)
                // fs.unlinkSync(uploadPath)
                return response.render('error', {err: err});
            })
        
        const results = await manhatten(url)

        return response.render('index',{res: results, finalAns: emptyArr, url})
    } catch(e){
        // console.log(e)
        return response.render('error', {err: e});
    }
})

router.get("/viewDetails/:city/:state", async (req, res) => {
    try {
        await searchDist(req.params.city, 'assam', (err, body) => {
            if (err) {
                return res.render('error', { err })
            }
            res.render('viewDetails', { body, city: req.params.city, state: req.params.state, url: req.query.url });
        })
    } catch (e) {
        res.render('error', { err: e })
    }
})

router.get('/userupload', (req, res) => {
    res.render('userUpload');
})

router.post('/userupload', upload.single('file'), (req, res) => {
    const reqState = req.body.state.toLowerCase();
    const reqCity = req.body.city.toLowerCase();

    const tempPath = req.file.originalname;
    var uploadPath = __dirname + `./../../public/uploads/` + tempPath;

    cloudinary.uploader.upload(uploadPath, function(err, body){
        if(err) {
            console.log(err);
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
                res.render('success', {msg: 'Your uploaded Image has been forwarded to Admin Panel. We will get back to you once verification is done.'});
            })
            .catch((err) => {
                res.render('error', {err});
            })
    })
});

router.get('/success', (req, res) => {
    res.render('success', {msg: "Success"});
});

router.get('/error', (req, res) => {
    res.render('error', {err: "this is err"});
})


module.exports = router;
