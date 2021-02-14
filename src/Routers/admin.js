const express = require("express");
const auth = require("../middleware/auth");
const Admin = require('../models/admin')
const States = require('../models/states.js')
const { flickr, city, search, simIndex, searchDist } = require('../utils/flickr')
const cookieParser = require("cookie-parser");
const urlExist = require('url-exist');
const router = new express.Router();

//insert photos array (url only) for a given city (state is hardcoded as of now)
// incase the city doesn't exist, a new city object will be created


router.post('/admin/singleInsert', auth, (req, response) => {
    var insertUrl = req.body.url;
    var insertCity = req.body.city.toLowerCase();
    var insertState = req.body.state.toLowerCase();

    // console.log(insertUrl);
    const fun = async function () {

        const exists = await urlExist(insertUrl);

        if (exists) {
            const doSearchFunc = (url) => {
                return new Promise((resolve, reject) => {
                    search(url, (err, body) => {
                        if (err) reject(err);
                        resolve(body);
                    })
                })
            }

            var insertTags = await doSearchFunc(insertUrl);

            // console.log(insertTags);
            var v = [];
            for (var j = 0; j < insertTags.length; j += 2) {
                v.push({
                    name: insertTags[j],
                    prob: insertTags[j + 1]
                })
            }
            insertTags = v;
            // console.log(insertTags);

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
    //city, state, imageURL,
    //console.log(city)


    ///////////////////////////////////////////////////////////////////////
    /********      SUB-ROUTINE FOR CITY UPDATE BELOW      ************** */
    ///////////////////////////////////////////////////////////////////////

    flickr(requestedCity, (error, body) => {
        if (error) {
            console.log("there is error")
            return res.send({ error })
        }
        // console.log(body)
        var _s = body.photos.photo;
        var photos = []
        for (var z = 0; z < body.photos.photo.length; z++) {
            var CurrentPhotoUrl = 'https://farm' + _s[z]['farm'] + '.staticflickr.com/' + _s[z]['server'] + '/' + _s[z]['id'] + '_' + _s[z]['secret'] + '_n.jpg'
            //console.log(CurrentPhotoUrl); 
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
        //console.log(currentCity.name)
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
    //console.log(req.cookies.token)
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
        // console.log(admin)
        res.redirect('/dashboard');
    } catch (e) {
        res.redirect('/login?error=' + encodeURIComponent('Incorrect_Credentials! Please enter your details again.'))
        // res.status(400).send(e)
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
    // req.body = {state, city}
    const usercity = req.body.city.toLowerCase();
    const userstate = req.body.state.toLowerCase();
    // console.log(usercity, userstate);

    States.findOne({ name: userstate })
        .then(state => {
            if (state) {

                var i;
                for (i = 0; i < state.cities.length; i++) {
                    if (state.cities[i].name === usercity) {
                        break;
                    }
                }
                // console.log(state.cities[i], i);

                if(i == state.cities.length){
                    return res.render('error', {err: "Data of no such city found!"});
                }

                photo_url = []
                for (var j = 0; j < state.cities[i].photos.length; j++) {
                    photo_url.push(state.cities[i].photos[j].url)
                }

                res.render('delete', { usercity, userstate, photo_url });
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
    // req.body => state, city, url
    const usercity = req.body.city.toLowerCase();
    const userstate = req.body.state.toLowerCase();
    const url = req.body.url;

    States.findOne({ name: userstate })
        .then(state => {
            if (state) {
                // console.log(state);
                var i;
                for (i = 0; i < state.cities.length; i++) {
                    if (state.cities[i].name == usercity) {
                        break;
                    }
                }

                state.cities[i].photos = state.cities[i].photos.filter((photo) => {
                    return photo.url != url;
                })

                // console.log(url, userstate, usercity)

                state.save()
                    .then(() => {
                        console.log("Deleted successfully");
                        res.redirect("/deleteform");
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



module.exports = router;




//sign-up route
// router.post('/admin/signup', async (req, res) => //sign up
// {
//     const data = req.body // contains the posted data
//     const admin = new Admin(data)
//     try {
//         await admin.save()
//         const token = await admin.generateAuthToken()
//         res.cookie("token", token, { httpOnly: true })
//         //res.send({admin,token})
//         res.redirect('/dashboard');
//     } catch (e) {
//         res.status(400).send(e)
//     }
// })

//sign-up form
// router.get('/signup', (req, res) => {
//     const token = req.cookies.token;
//     //console.log(req.cookies.token)
//     if (!token) {
//         return res.render('signupform')
//     }
//     res.redirect('/dashboard');
// })
