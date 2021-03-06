const express = require("express");
const auth = require("../middleware/auth");
const Admin = require('../models/admin')
const States = require('../models/states.js')
const pendingUserUpload = require('../models/pendingUserUpload')
const { flickr, city, search, simIndex, searchDist, sceneClassifier } = require('../utils/flickr')
const urlExist = require('url-exist');
const router = new express.Router();

//insert photos array (url only) for a given city (state is hardcoded as of now)
// incase the city doesn't exist, a new city object will be created
router.post('/admin/singleInsert', auth, (req, response) => {
    var insertUrl = req.body.url;
    var insertCity = req.body.city.toLowerCase();
    var insertState = req.body.state.toLowerCase();

    const fun = async function () {

        const exists = await urlExist(insertUrl);

        if (exists) {

            var insertTags = await sceneClassifier(insertUrl);

            var v = [];
            for (var j = 0; j < insertTags.length; j += 2) {
                v.push({
                    name: insertTags[j],
                    prob: insertTags[j + 1]
                })
            }
            insertTags = v;

            States.findOne({ name: insertState })
                .then((state) => {
                    if (state) {
                        var city = state.cities.find(c => c.name === insertCity);
                        if (city) {
                            city.photos.push({
                                url: insertUrl,
                                tags: insertTags,
                                isActive: true
                            })

                            state.save()
                                .then(() => {
                                    console.log("Hoooooray! Single image insert successful!");
                                })
                                .catch((err) => {
                                    console.log(err);
                                })
                        }
                        else {
                            state.cities.push({
                                name: insertCity,
                                photos: [{
                                    url: insertUrl,
                                    tags: insertTags,
                                    isActive: true
                                }]
                            })

                            state.save()
                                .then(() => {
                                    console.log("Hoooooray! Single image inserted successfully and city added!");
                                })
                                .catch((err) => {
                                    console.log(err);
                                })


                        }
                    }
                    else {

                        const newState = new States({
                            name: insertState,
                            cities: [{
                                name: insertCity,
                                photos: [{
                                    url: insertUrl,
                                    tags: insertTags,
                                    isActive: true
                                }]
                            }]
                        })


                        newState.save()
                            .then(state => {
                                // console.log(state);
                                console.log("Hoooooray! Single image inserted successfully, city and state added!");
                            })
                            .catch(err => {
                                console.log(err)
                            })

                    }
                })
                .catch(err => {
                    console.log(err);
                })

        }
        else {
            console.log("URL does not exist");
        }


    }

    fun();
    response.redirect('/dashboard')
})

// req.body --> city, state
router.post('/admin/insert', (req, response) => {
    var requestedCity = req.body.city.toLowerCase();
    var requestedState = req.body.state.toLowerCase();

    ///////////////////////////////////////////////////////////////////////
    /********      SUB-ROUTINE FOR CITY UPDATE BELOW      ************** */
    ///////////////////////////////////////////////////////////////////////

    flickr(requestedCity, (error, body) => {
        if (error) {
            console.log("there is error")
            return res.send({ error })
        }
        var _s = body.photos.photo;
        var photos = []
        for (var z = 0; z < body.photos.photo.length; z++) {
            var CurrentPhotoUrl = 'https://farm' + _s[z]['farm'] + '.staticflickr.com/' + _s[z]['server'] + '/' + _s[z]['id'] + '_' + _s[z]['secret'] + '_n.jpg'
            var photo = {
                url: CurrentPhotoUrl,
                tags: [],
                placename: ""
            }
            photos.push(photo)
        }
        var currentCity = {
            name: requestedCity,
            photos: photos
        }
  
        States.findOne({ name: requestedState })
            .then(state => {
                if (state) {
                    state.cities.push(currentCity)
                    state.save()
                        .then(state => {
                            console.log("saved successfully")
                            chunk = 6;

                            var city = state.cities.find(c => c.name === requestedCity)
                            var lim = city.photos.length;

                            var cnt = 0;

                            const solve = function (lower_bound, upper_bound) {
                                for (let i = lower_bound; i <= Math.min(upper_bound, lim - 1); i++) {
                                    const start = async function () {
                                        const exists = await urlExist(city.photos[i].url);
                                        if (exists) {
                                            search(city.photos[i].url, (err, res) => {
                                                
                                                if (err) return console.log(err);
                                                var body = res
                                                var val = [];
                                                for (let j = 0; j < body.length; j += 2) {
                                                    var key_val = {
                                                        name: body[j],
                                                        prob: body[j + 1]
                                                    }
                                                    val.push(key_val)
                                                }
                                                city.photos[i].tags = val;
                                                city.photos[i].isActive = true;
                                                cnt++;
                                                if (cnt == (Math.min(upper_bound, lim - 1) - lower_bound + 1)) {
                                                    state.save()
                                                        .then(() => {
                                                            console.log("Tags saved successfully! " + lower_bound + " " + Math.min(upper_bound, lim - 1));
                                                        })
                                                        .catch((err) => {
                                                            console.log(err);
                                                        })
                                                    if (upper_bound + 1 < lim) {
                                                        cnt = 0;
                                                        return solve(upper_bound + 1, Math.min(upper_bound + chunk, lim - 1));
                                                    }
                                                    else{
                                                        response.redirect("/dashboard")
                                                    }
                                                }
                                            })
                                        }
                                        else {
                                            cnt++;
                                            if (cnt == (Math.min(upper_bound, lim - 1) - lower_bound + 1)) {
                                                state.save()
                                                    .then(() => {
                                                        console.log("Tags saved successfully! " + lower_bound + " " + Math.min(upper_bound, lim - 1));
                                                    })
                                                    .catch((err) => {
                                                        console.log(err);
                                                    })
                                                if (upper_bound + 1 < lim) {
                                                    cnt = 0;
                                                    return solve(upper_bound + 1, Math.min(upper_bound + chunk, lim - 1));
                                                }
                                                else{
                                                    response.redirect("/dashboard")
                                                }
                                            }
                                        }
                                    }
                                    start();
                                }
                            }

                            solve(0, Math.min(chunk, lim - 1));
                        })
                        .catch(err => {
                            console.log(err)
                        })
                }
                else {
                    var cities = []
                    cities.push(currentCity)
                    const newState = new States({
                        name: requestedState,
                        cities: cities
                    })

                    newState.save()
                        .then(state => {
                            console.log("saved successfully")
                            chunk = 6;

                            var city = state.cities.find(c => c.name === requestedCity)
                            console.log(city)
                            var lim = city.photos.length;

                            var cnt = 0;

                            const solve = function (lower_bound, upper_bound) {
                                for (let i = lower_bound; i <= Math.min(upper_bound, lim - 1); i++) {
                                    const start = async function () {
                                        const exists = await urlExist(city.photos[i].url);
                                        if (exists) {
                                            search(city.photos[i].url, (err, res) => {
                                                // console.log(i);
                                                if (err) return console.log(err);
                                                var body = res
                                                var val = [];
                                                for (let j = 0; j < body.length; j += 2) {
                                                    var key_val = {
                                                        name: body[j],
                                                        prob: body[j + 1]
                                                    }
                                                    val.push(key_val)
                                                }
                                                city.photos[i].tags = val;
                                                city.photos[i].isActive = true;
                                                cnt++;
                                                if (cnt == (Math.min(upper_bound, lim - 1) - lower_bound + 1)) {
                                                    state.save()
                                                        .then(() => {
                                                            console.log("Tags saved successfully! " + lower_bound + " " + Math.min(upper_bound, lim - 1));
                                                        })
                                                        .catch((err) => {
                                                            console.log(err);
                                                        })
                                                    if (upper_bound + 1 < lim) {
                                                        cnt = 0;
                                                        return solve(upper_bound + 1, Math.min(upper_bound + chunk, lim - 1));
                                                    }
                                                    else{
                                                        response.redirect("/dashboard")
                                                    }
                                                }
                                            })
                                        }
                                        else {
                                            cnt++;
                                            if (cnt == (Math.min(upper_bound, lim - 1) - lower_bound + 1)) {
                                                state.save()
                                                    .then(() => {
                                                        console.log("Tags saved successfully! " + lower_bound + " " + Math.min(upper_bound, lim - 1));
                                                    })
                                                    .catch((err) => {
                                                        console.log(err);
                                                    })
                                                if (upper_bound + 1 < lim) {
                                                    cnt = 0;
                                                    return solve(upper_bound + 1, Math.min(upper_bound + chunk, lim - 1));
                                                }
                                                else{
                                                    response.redirect("/dashboard")
                                                }
                                            }
                                        }
                                    }
                                    start();
                                }
                            }

                            solve(0, Math.min(chunk, lim - 1));
                        })
                        .catch(err => {
                            console.log(err)
                        })
                }
            })
    })

})


//dashboard route
router.get('/dashboard', auth, async (req, res) => {
    const admin = req.admin
    res.render('dashboard', { admin })
})

//login form
router.get('/login', async (req, res) => {
    const data = await Admin.findOne({ email: req.email })
    const token = req.cookies.token;
    
    if (!token) {
        return res.render('loginform', { error: req.query.error })
    }
    res.redirect('/dashboard');
})

//login route
router.post('/admin/login', async (req, res) => {
    try {
        const admin = await Admin.findByCredentials(req.body.email, req.body.password)
        const token = await admin.generateAuthToken()
        res.cookie("token", token, { httpOnly: true })
        
        res.redirect('/dashboard');
    } catch (e) {
        res.redirect('/login?error=' + encodeURIComponent('Incorrect_Credentials! Please enter your details again.'))
        
    }
})

//logout route
router.post('/admin/logout', auth, async (req, res) => {
    try {
        res.clearCookie("token");
        res.redirect('/login');
    }
    catch (e) {
        res.status(400).send('Unable to verify')
    }
})

router.post("/admin/filter", auth, (req, res) => {
    const usercity = req.body.city.toLowerCase();
    const userstate = req.body.state.toLowerCase();
    const admin = req.admin;

    States.findOne({ name: userstate })
        .then(state => {
            if (state) {

                var i;
                for (i = 0; i < state.cities.length; i++) {
                    if (state.cities[i].name === usercity) {
                        break;
                    }
                }

                if(i == state.cities.length){
                    return res.render('error', {err: "Data of no such city found!"});
                }

                photo_url = []
                for (var j = 0; j < state.cities[i].photos.length; j++) {
                    photo_url.push(state.cities[i].photos[j].url)
                }

                res.render('delete', { usercity, userstate, photo_url, admin });
            } else {
                res.render('error', {err: "No such data found!"});
            }
        })
        .catch((err) => {
            console.log(err);
            res.render('error', {err})
        })
});

router.post("/admin/delete", auth, (req, res) => {
    const usercity = req.body.city.toLowerCase();
    const userstate = req.body.state.toLowerCase();
    const url = req.body.url;

    States.findOne({ name: userstate })
        .then(state => {
            if (state) {
                var i;
                for (i = 0; i < state.cities.length; i++) {
                    if (state.cities[i].name == usercity) {
                        break;
                    }
                }

                state.cities[i].photos = state.cities[i].photos.filter((photo) => {
                    return photo.url != url;
                })

                state.save()
                    .then(() => {
                        const success = "Deleted successfully"
                        // console.log(success);
                        res.send(success);
                    })
                    .catch((err) => {
                        res.status(400).send(err);
                    })
            }
        })
        .catch((err) => {
            res.status(400).send(err);
        })

})

router.get("/deleteform", auth, (req, res) => {
    const photo_url = [];
    var admin = req.admin;
    res.render('delete', { photo_url, admin });
})

//<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>
//<<<<< PENDING USER UPLOADS SECTION >>>>>>
//<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>

router.get('/pendinguploads', auth, async (req, res) => {
    try {
        const docs = await pendingUserUpload.find({});
        const admin = req.admin;
        res.render('pendingUploads', {docs, admin});
    } catch (err) {
        res.render('error', {err});
    }
    
})

router.post('/insertUploaded', auth, async (req, res) => {

    const reqState = req.body.state.toLowerCase();
    const reqCity = req.body.city.toLowerCase();

    console.log(reqState, reqCity);
    
    try {
        const tags = await sceneClassifier(req.body.url);
        var insertTags = [];
        for (var j = 0; j < tags.length; j += 2) {
            insertTags.push({
                name: tags[j],
                prob: tags[j + 1]
            });
        }
        console.log(insertTags);

        const state = await States.findOne({name: reqState});
        const city = await state.cities.find(c => c.name === reqCity);
        if(city) {
            city.photos.push({
                url: req.body.url,
                tags: insertTags,
                isActive: true
            })
        } else {
            state.cities.push({
                name: reqCity,
                photos: [{
                    url: req.body.url,
                    tags: insertTags,
                    isActive: true
                }]
            })
        }
        await state.save();
        res.send('Image saved successfully.');

    } catch(err) {
        res.send(err);
    }
    
});

router.post('/deletepending', auth, async (req, res) => {
    try {
        const docs = await pendingUserUpload.findOneAndDelete({city: req.body.city, state: req.body.state, url: req.body.url });
        if(!docs) {
            return res.send('Error deleting from pending uploads!');
        } 

        console.log(docs);

        res.send('Deleted from pending Uploads');
    } catch (err) {
        res.send(err);
    }
});

// deleting all entries from pendingUserUpload collection
router.get('/deleteallpending', auth, async(req, res) => {
    try {
        const docs = await pendingUserUpload.deleteMany({});
        console.log(docs);
        res.send(docs);
    } catch(err) {
        console.log(err);
        res.send(err);
    }
})

module.exports = router;
