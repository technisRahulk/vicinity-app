// Modules
const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require('body-parser')
const multer = require('multer')
var imgur = require('imgur')
const fs = require('fs')
const ejs = require('ejs')
const path = require('path')
const request=require('request');
const urlExist = require('url-exist');
const {flickr, search, simIndex}=require('./utils/flickr')
const States = require('./models/states.js')
const trackData = require("./utils/finalAlgo");
const Admin=require('./models/admin')
const auth=require('./middleware/auth')
const cookieParser = require("cookie-parser");
const multiparty = require("multiparty");
const nodemailer = require("nodemailer");

//Express server setup
const app = express();
app.use(express.json());

// configuration for environment variables
require("dotenv").config({path:path.resolve(__dirname, '../config/.env')});

//Port setup
const port = process.env.PORT || 7000;

// connect mongoose
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => console.log("Here Connected to mongo server"))
  .catch((err) => console.error(err));

// set view engine and public directory path
app.set('views', path.join(__dirname, './../views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}))
const publicDir=path.join(__dirname,'./../public')
app.use(express.static(publicDir))
app.use(cookieParser());

//Index route
app.get('/', (req, response) => {
  var res=[]
  var finalAns = [];
  var url;
  response.render('index',{ res,layout:false,finalAns,url});
  });

//insert photos array (url only) for a given city (state is hardcoded as of now)
// incase the city doesn't exist, a new city object will be created


// app.get('/insert/:city',(req,res)=>{
//   var city=req.params.city;
//   //city, state, imageURL,
//   //console.log(city)
//   flickr(city,(error,body)=>{
//     if(error){
//       console.log("there is error")
//       return res.send({error})
//     }
//     console.log(body)
//     var _s = body.photos.photo;
//     var photos = []
//     for(var z = 0 ; z < body.photos.photo.length ; z++){
//         var CurrentPhotoUrl = 'https://farm'+_s[z]['farm']+'.staticflickr.com/'+_s[z]['server']+'/'+_s[z]['id']+'_'+_s[z]['secret']+'_n.jpg'
//         //console.log(CurrentPhotoUrl); 
//         var photo = {
//           url : CurrentPhotoUrl,
//           tags : [],
//           placename : ""
//         }
//         photos.push(photo)
//     }
//     var currentCity = {
//       name : city,
//       photos : photos
//     }
//     //console.log(currentCity.name)
//     States.findOne({name : "arunachal pradesh"})
//       .then(state => {
//         if(state){
//           state.cities.push(currentCity)
//           state.save()
//           .then(state => {
//             console.log("saved successfully")
//           })
//           .catch(err => {
//             console.log(err)
//           })
//         }
//         else{
//           var cities = []
//           cities.push(currentCity)
//           const newState = new States({
//             name: "assam",
//             cities : cities
//           })

//           newState.save()
//             .then(state => {
//               console.log("saved successfully")
//             })
//             .catch(err => {
//               console.log(err)
//             })
//         }
//       })
//   })
// })



// // route for updating tags in city
// app.get('/update/:stateInput', (req, res) => {
//   var reqState=req.params.stateInput;
//   var cnt = 0;
  
//   States.findOne({name:reqState})
//   .then((state)=>{
//     var chunk = 6;
    
//     const iterate = function(city_i){
//       console.log(state.cities[city_i].name);
//       cnt = 0;
//       var city = state.cities.find(c => c.name === state.cities[city_i].name)
//       var lim = city.photos.length;
//       const solve = function(lower_bound,upper_bound){
//         if((upper_bound-lower_bound+1)==0){
//           city_i++;
//           if(city_i<state.cities.length) return iterate(city_i);
          
//         }
//         for(let i=lower_bound;i<=Math.min(upper_bound,lim-1);i++){
//           const start = async function(){
//             const exists = await urlExist(city.photos[i].url);
//             if(exists){
//               search(city.photos[i].url, (err, res) => {
//                 console.log(i);
//                 if(err) return console.log(err);
//                 var body = res
//                 var val = [];
//                 for(let j=0; j<body.length; j+=2){
//                   var key_val = {
//                     name : body[j],
//                     prob : body[j+1]
//                   }
//                   val.push(key_val)
//                 }
//                 city.photos[i].tags = val;
//                 city.photos[i].isActive = true;
//                 cnt++;
//                 if(cnt==(Math.min(upper_bound,lim-1)-lower_bound+1)){
//                   state.save()
//                   .then(()=>{
//                       console.log("Tags saved successfully! "+lower_bound+" "+Math.min(upper_bound,lim-1));
//                     })
//                     .catch((err)=>{
//                       console.log(err);
//                     })
//                     if(upper_bound+1<lim){
//                       cnt=0;
//                       return solve(upper_bound+1,Math.min(upper_bound+chunk,lim-1));
//                     }
//                     else{
//                       if(city_i+1<state.cities.length){
//                         return iterate(city_i+1);
//                       }
//                     }
//                   }
//               })
//             }
//             else{
//               cnt++;
//               if(cnt==(Math.min(upper_bound,lim-1)-lower_bound+1)){
//                 state.save()
//                 .then(()=>{
//                   console.log("Tags saved successfully! "+lower_bound+" "+Math.min(upper_bound,lim-1));
//                 })
//                 .catch((err)=>{
//                   console.log(err);
//                 })
//                 if(upper_bound+1<lim){
//                   cnt=0;
//                   return solve(upper_bound+1,Math.min(upper_bound+chunk,lim-1));
//                 }
//                   else{
//                     if(city_i+1<state.cities.length){
//                       return iterate(city_i+1);
//                     }
//                   }
//               }
//             }
//           }
//           start();
//         }
//       }
      
//       solve(0,Math.min(chunk,lim-1));
      
//     }
//     iterate(0);
//   })


// })


app.post('/admin/singleInsert',(req,res)=>{
  var insertUrl = req.body.url;
  var insertCity = req.body.city;
  var insertState = req.body.state;

  console.log(insertUrl);


  const fun = async function(){

    const exists = await urlExist(insertUrl);

    if(exists){
      const doSearchFunc = (url)=>{
        return new Promise((resolve,reject)=>{
          search(url,(err,body)=>{
            if(err) reject(err);
            resolve(body);
          })
        })
      }
  
      var insertTags = await doSearchFunc(insertUrl);

      // console.log(insertTags);
      var v =[];
      for(var j=0;j<insertTags.length;j+=2){
        v.push({
          name:insertTags[j],
          prob:insertTags[j+1]
        })
      }
      insertTags=v;
      // console.log(insertTags);
      
      States.findOne({name:insertState})
      .then((state)=>{
          if(state){
            var city = state.cities.find(c => c.name === insertCity);
            if(city){
              city.photos.push({
                url: insertUrl,
                tags: insertTags,
                isActive: true
              })

              state.save()
                .then(()=>{
                  console.log("Hoooooray! Single image insert successful!");
                })
                .catch((err)=>{
                  console.log(err);
                })
            }
            else{
              state.cities.push({
                name:insertCity,
                photos:[{
                  url: insertUrl,
                  tags: insertTags,
                  isActive: true
                }]
              })

              state.save()
                .then(()=>{
                  console.log("Hoooooray! Single image inserted successfully and city added!");
                })
                .catch((err)=>{
                  console.log(err);
                })


            }
          }
          else{

            const newState = new States({
              name: insertState,
              cities : [{
                name:insertCity,
                photos:[{
                  url: insertUrl,
                  tags: insertTags,
                  isActive: true
                }]
              }]
            })

            
            newState.save()
            .then(state => {
                console.log(state);
                console.log("Hoooooray! Single image inserted successfully, city and state added!");
              })
              .catch(err => {
                console.log(err)
              })
            
          }
        })
        .catch(err=>{
          console.log(err);
        })

    }
    else{
      console.log("URL does not exist");
    }

      
  }

  fun();


})



// req.body --> city, state
app.post('/admin/insert',(req,res)=>{
  var requestedCity=req.body.city;
  var requestedState=req.body.state;
  //city, state, imageURL,
  //console.log(city)


  ///////////////////////////////////////////////////////////////////////
  /********      SUB-ROUTINE FOR CITY UPDATE BELOW      ************** */
  
  


  ///////////////////////////////////////////////////////////////////////


  flickr(requestedCity,(error,body)=>{
    if(error){
      console.log("there is error")
      return res.send({error})
    }
    console.log(body)
    var _s = body.photos.photo;
    var photos = []
    for(var z = 0 ; z < body.photos.photo.length ; z++){
        var CurrentPhotoUrl = 'https://farm'+_s[z]['farm']+'.staticflickr.com/'+_s[z]['server']+'/'+_s[z]['id']+'_'+_s[z]['secret']+'_n.jpg'
        //console.log(CurrentPhotoUrl); 
        var photo = {
          url : CurrentPhotoUrl,
          tags : [],
          placename : ""
        }
        photos.push(photo)
    }
    var currentCity = {
      name : requestedCity,
      photos : photos
    }
    //console.log(currentCity.name)
    States.findOne({name :requestedState})
      .then(state => {
        if(state){
          state.cities.push(currentCity)
          state.save()
          .then(state => {
            console.log("saved successfully")
          })
          .catch(err => {
            console.log(err)
          })
        }
        else{
          var cities = []
          cities.push(currentCity)
          const newState = new States({
            name: "assam",
            cities : cities
          })

          newState.save()
            .then(state => {
              console.log("saved successfully")
            })
            .catch(err => {
              console.log(err)
            })
        }


        chunk = 6;

    
        var city = state.cities.find(c => c.name === requestedCity)
        var lim = city.photos.length;
        
        
        



        var cnt = 0;

        const solve = function(lower_bound,upper_bound){
          for(let i=lower_bound;i<=Math.min(upper_bound,lim-1);i++){
            const start = async function(){
              const exists = await urlExist(city.photos[i].url);
              if(exists){
                search(city.photos[i].url, (err, res) => {
                  console.log(i);
                  if(err) return console.log(err);
                  var body = res
                  var val = [];
                  for(let j=0; j<body.length; j+=2){
                    var key_val = {
                      name : body[j],
                      prob : body[j+1]
                    }
                    val.push(key_val)
                  }
                  city.photos[i].tags = val;
                  city.photos[i].isActive = true;
                  cnt++;
                  if(cnt==(Math.min(upper_bound,lim-1)-lower_bound+1)){
                    state.save()
                    .then(()=>{
                        console.log("Tags saved successfully! "+lower_bound+" "+Math.min(upper_bound,lim-1));
                      })
                      .catch((err)=>{
                        console.log(err);
                      })
                      if(upper_bound+1<lim){
                        cnt=0;
                        return solve(upper_bound+1,Math.min(upper_bound+chunk,lim-1));
                      }
                      // else{
                      //   if(city_i+1<state.cities.length){
                      //     return iterate(city_i+1);
                      //   }
                      // }
                    }
                })
              }
              else{
                cnt++;
                if(cnt==(Math.min(upper_bound,lim-1)-lower_bound+1)){
                  state.save()
                  .then(()=>{
                    console.log("Tags saved successfully! "+lower_bound+" "+Math.min(upper_bound,lim-1));
                  })
                  .catch((err)=>{
                    console.log(err);
                  })
                  if(upper_bound+1<lim){
                    cnt=0;
                    return solve(upper_bound+1,Math.min(upper_bound+chunk,lim-1));
                  }
                    // else{
                    //   if(city_i+1<state.cities.length){
                    //     return iterate(city_i+1);
                    //   }
                    // }
                }
              }
            }
            start();
          }
        }

        solve(0,Math.min(chunk,lim-1));



      })
  })



  // var cnt = 0;
  
  // States.findOne({name:requestedState})
  // .then((state)=>{
    

  // })



})


//sign-up route
app.post('/admin/signup',async (req,res)=> //sign up
{
    const data=req.body // contains the posted data
    const admin=new Admin(data)
    try{
        await admin.save()
        const token=await admin.generateAuthToken()
        res.cookie("token", token, { httpOnly: true })
        //res.send({admin,token})
        res.redirect('/dashboard');
    }catch(e)
    {
        res.status(400).send(e)
    }
})

//sign-up form
app.get('/signup',(req,res)=>
{
  const token = req.cookies.token;
  //console.log(req.cookies.token)
  if(!token)
  {
    return res.render('signupform')
  }
  res.redirect('/dashboard');
})

//dashboard route
app.get('/dashboard',auth,async(req,res)=>
{
  const admin=req.admin
  res.render('dashboard',{admin})
})

//login form
app.get('/login',async(req,res)=>
{
  const data = await Admin.findOne({email : req.email})
    const token = req.cookies.token;
    //console.log(req.cookies.token)
    if(!token)
    {
      return res.render('loginform', {error: req.query.error})
    }
    res.redirect('/dashboard');
})

//login route
app.post('/admin/login',async (req,res)=> 
{
    try{
      const admin=await Admin.findByCredentials(req.body.email,req.body.password)
      const token=await admin.generateAuthToken()
      res.cookie("token", token, { httpOnly: true })
      console.log(admin)
      res.redirect('/dashboard');
    }catch(e)
    {
      res.redirect('/login?error=' + encodeURIComponent('Incorrect_Credentials! Please enter your details again.'))
      // res.status(400).send(e)
    }
})

//logout route
app.post('/admin/logout',auth,async(req,res)=>
{
    try
    { 
      res.clearCookie("token");
      res.redirect('/login');
    }
    catch(e)
    {
      res.status(400).send('Unable to verify')
    }
})


const {Heap} = require('heap-js');

const customPriorityComparator = (a,b) =>{
    return a.score-b.score;
}

// route for user to search place by URL of image
app.post('/searchbyurl',(req,response)=>{
  console.log("searchbyurl route invoked")
  console.log("User Cooridinates: ",req.body.lat,req.body.long)
  var imgURL=req.body.url
  var reqState=req.body.state.toLowerCase()
  // console.log(reqState)
  var user_arr=[]
  //console.log(imgURL);
  search(imgURL, (err, res) => {
    if(err){
      console.log(err);
      return response.render('error', {err})
    }
    // console.log(res)
    user_arr=res
    // console.log("res.body -----> \n" + res[0])
    States.findOne({name : reqState})
      .then(state => {
        if(state){
          var cities = state.cities
          var max = 0
          var city_id, photo_id
          const minHeap = new Heap(customPriorityComparator);
          let myMap = new Map();
          var duplicates = {};
          var curArr = [];
          for(var i=0; i<cities.length; i++){
            var city = cities[i]
            for(var j=0;j<city.photos.length;j++){
              if(city.photos[j].isActive){
                if(curArr.length < 6){
                  if(!duplicates[city.photos[j].url]){
                    duplicates[city.photos[j].url] = 1;
                    curArr.push({city_id:i, photo_id:j, score:simIndex(city.photos[j].tags,user_arr)});
                  }
                  if(curArr.length==6){
                    minHeap.init(curArr);
                    for(var k=0;k<curArr.length;k++){
                      myMap.set('city_id='+curArr[k].city_id+'photo_id='+curArr[k].photo_id+'score='+curArr[k].score, k);
                    }
                  }
                } else {
                  var sim = simIndex(city.photos[j].tags,user_arr);
                  var score = sim;
                  var obj = minHeap.top();

                  if(duplicates[city.photos[j].url]) continue;
                  duplicates[city.photos[j].url] = 1;
                  if(score<obj[0].score) continue;
                  var id = myMap.get('city_id='+obj[0].city_id+'photo_id='+obj[0].photo_id+'score='+obj[0].score)
                  myMap.delete('city_id='+obj[0].city_id+'photo_id='+obj[0].photo_id+'score='+obj[0].score)
                  curArr[id] = {city_id:i, photo_id:j, score:sim};
                  if(!(0<=id && id<6)){
                    console.log(id);
                  }
                  minHeap.pop();
                  minHeap.push({city_id:i, photo_id:j, score:sim});
                  myMap.set('city_id='+i+'photo_id='+j+'score='+score,id);
                }
              }
            }
          }
          let res=[]
          for(var i=0;i<curArr.length;i++){
            var city_index=curArr[i].city_id
            var photo_index = curArr[i].photo_id
            console.log(curArr[i].score)
            var obj = {
              city : cities[city_index].name,
              url : cities[city_index].photos[photo_index].url
            }
            console.log(obj)
            res.push(obj)
          }
          var finalAns=[]
          var url=imgURL
          response.render('index', {
            res,finalAns,url
          })
        } else {
          response.render('errror', {err: "The State doesn't has ample amount of scenic places"})
        }
      })
      .catch(error => {
        console.log(error)
        response.render('error', {err: error})
      })
  })
})


// Set up multer for storing images
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    var newDestination = __dirname + `./../public/uploads/`
    cb(null, newDestination)
  },
  filename: function (req, file, cb) {
    var filename = file.originalname;
    cb(null, filename);
  }
}); 

var upload = multer({
  storage : storage,
  fileFilter : function(req,file,cb){
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      //cb(new Error('Please upload an Image file (.jpg, .jpeg, .png only)'));
      return cb('error: Images only!')
    }
    cb(undefined, true);
  }
});



// route for user to upload image and enter state name
app.post('/searchbyimage', upload.single('file'), (req, response) => {
  console.log("searchbyimage route invoked")
  console.log("User Cooridinates: ",req.body.lat,req.body.long)
  var reqState=req.body.state.toLowerCase();
  console.log(reqState)
  var user_arr=[]
  var url;
  const tempPath = req.file.originalname;
  var uploadPath = __dirname + `./../public/uploads/` + tempPath
  imgur.uploadFile(uploadPath)
    .then(function (json) {
        console.log(json.data.link);
        url=json.data.link;
        search(json.data.link, (err, res) => {
          if(err) return console.log(err);
          user_arr=res
          console.log(user_arr);
          States.findOne({name : reqState})
          .then(state => {
            if(state){
              var cities = state.cities
              var max = 0
              var city_id, photo_id
              const minHeap = new Heap(customPriorityComparator);
              let myMap = new Map();
              var curArr = [];
              for(var i=0; i<cities.length; i++){
                var city = cities[i]
                for(var j=0;j<city.photos.length;j++){
                  if(city.photos[j].isActive){
                    if(curArr.length < 6){
                      curArr.push({city_id:i, photo_id:j, score:simIndex(city.photos[j].tags,user_arr)});
                      if(curArr.length==6){
                        minHeap.init(curArr);
                        for(var k=0;k<curArr.length;k++){
                          myMap.set('city_id='+curArr[k].city_id+'photo_id='+curArr[k].photo_id+'score='+curArr[k].score, k);
                        }
                      }
                    } else {
                      var sim = simIndex(city.photos[j].tags,user_arr);
                      var score = sim;
                      var obj = minHeap.top();
                      if(myMap.has('city_id='+i+'photo_id='+j+'score='+sim)) continue;
                      if(score<obj[0].score) continue;
                      var id = myMap.get('city_id='+obj[0].city_id+'photo_id='+obj[0].photo_id+'score='+obj[0].score)
                      myMap.delete('city_id='+obj[0].city_id+'photo_id='+obj[0].photo_id+'score='+obj[0].score)
                      curArr[id] = {city_id:i, photo_id:j, score:sim};
                      minHeap.pop();
                      minHeap.push({city_id:i, photo_id:j, score:sim});
                      myMap.set('city_id='+i+'photo_id='+j+'score='+score,id);
                    }
                  }
                }
              }
              let res=[]
              for(var i=0;i<curArr.length;i++){
                var city_index=curArr[i].city_id
                var photo_index = curArr[i].photo_id
                var obj = {
                  city : cities[city_index].name,
                  url : cities[city_index].photos[photo_index].url
                }
                console.log(obj)
                res.push(obj)
              }
              var finalAns=[]
              response.render('index1', {
                finalAns,res,url
              })
            } else {
              response.render('error', {err: "The State doesn't has ample amount of scenic places"})
            }
          })
          .then(() => {
            fs.unlinkSync(uploadPath)
            console.log("Deleted file: " + uploadPath)
          })
          .catch(error => {
            console.log(error)
            response.render('error', {err: error})
          })
        })
    })
    .catch(function (err) {
      console.error(err);
      response.render('error', {err})
  });
})



// The main route
app.post("/searchGlobal", upload.single('file1'), async (req, response) => {
  var state_, url_, district_, county_, city_, locality_;
  console.log("searchGlobal route invoked")
  const tempPath = req.file.originalname;
  var uploadPath = __dirname + `./../public/uploads/` + tempPath
  console.log(uploadPath)
  await imgur.uploadFile(uploadPath)
    .then(function(json){
      url = json.data.link
    })
    .then(() => {
      fs.unlinkSync(uploadPath)
      console.log("Deleted file: " + uploadPath)
    })
    .catch(err => {
      console.log(err)
      return response.send('error', {err})
    })
  console.log(url)
  console.log(req.body.lat)
  console.log(req.body.long)
  if(req.body.lat && req.body.long){
    var lat_ = req.body.lat, long_ =req.body.long;
    ////USE BELOW FOR DEV/TEST PUROPSE ONLY////
  
    // lat_ = String(28+(6*Math.random()-3));
    // long_ = String(77+(6*Math.random()-3));

    // lat_ = String(26.38637274811449);
    // long_ = String(74.85117091779458);


    console.log("Here: ---- >  ",lat_,long_);
    //////////////////////////////////////
    var x;
    try{
      x = await city(lat_, long_);
    } catch(err) {
      response.render('error', {err})
    }
    
    console.log("x: ",x);
    state_ = x.State;
    district_ = x.District;
    county_ = x.County;
    town_=x.town;
    city_=x.city;
    locality_=x.locality;
    console.log("Here: ---- >  ",state_,district_);
  } else {
    state_ = req.body.state;
    district_ = req.body.district;
  }



  async function cb(globalArr) {
    var promiseArr = [];
    console.log(globalArr);
    var i=0,j=0;
    for(i=0;i<globalArr.length;i++){
      for(j=0;j<globalArr[i].length;j++){
        globalArr[i][j] = {...globalArr[i][j],"i":i,"j":j};
      }
    }

    for(i=0;i<globalArr.length;i++){
        for(j=0;j<globalArr[i].length;j++){
          promiseArr.push(new Promise((resolve,reject)=>{
            var tt = [];
            console.log("Heree----",district_,globalArr[i][j].city)
            Object.assign(tt,globalArr[i][j]);



            searchDist(city_,globalArr[i][j].state,(err,res)=>{
                if(res===undefined || err || res.distance>4000){



                  searchDist(city_,globalArr[tt.i][tt.j].city,(err,res)=>{
                    if(res===undefined || err || res.distance>4000){


                        searchDist(locality_,globalArr[tt.i][tt.j].state,(err,res)=>{
                            if(res===undefined || err || res.distance>4000 ){

                              searchDist(locality_,globalArr[tt.i][tt.j].city,(err,res)=>{
                      
                                if(res===undefined || err || res.distance>4000 ){

                                  searchDist(district_,globalArr[tt.i][tt.j].state,(err,res)=>{
                          
                                    if(res===undefined || err || res.distance>4000 ){

                                      searchDist(district_,globalArr[tt.i][tt.j].city,(err,res)=>{
                              
                                        if(res===undefined || err || res.distance>4000 ){

                                          searchDist(town_,globalArr[tt.i][tt.j].state,(err,res)=>{
                                  
                                            if(res===undefined || err || res.distance>4000 ){

                                              searchDist(town_,globalArr[tt.i][tt.j].city,(err,res)=>{
                                      
                                                if(res===undefined || err || res.distance>4000 ){

                                                  searchDist(county_,globalArr[tt.i][tt.j].state,(err,res)=>{
                                          
                                                    if(res===undefined || err || res.distance>4000 ){

                                                      searchDist(county_,globalArr[tt.i][tt.j].city,(err,res)=>{
                                              
                                                        if(res===undefined || err || res.distance>4000 ){

                                                          searchDist(state_,globalArr[tt.i][tt.j].state,(err,res)=>{
                                                  
                                                            if(res===undefined || err || res.distance>4000 ){

                                                              searchDist(state_,globalArr[tt.i][tt.j].city,(err,res)=>{
                                                      
                                                                if(err) {
                                                                  console.log(err)
                                                                  var temp = {...tt,"dist":"Unknown"};
                                                                  globalArr[tt.i][tt.j] = temp;
                                                                  resolve(res);
                                                                }
                                                                else {
                                                                  var temp = {...tt,"dist":res.distance};
                                                                  globalArr[tt.i][tt.j] = temp;
                                                                  resolve(res);
                                                                }
                                                                
                                                              })
                                
                                                            }
                                                            else{
                                                              var temp = {...tt,"dist":res.distance};
                                                              globalArr[tt.i][tt.j] = temp;
                                                              resolve(res);
                                                            }
                                                            
                                                          })
                            
                                                        }
                                                        else{
                                                          var temp = {...tt,"dist":res.distance};
                                                          globalArr[tt.i][tt.j] = temp;
                                                          resolve(res);
                                                        }
                                                        
                                                      })
                        
                                                    }
                                                    else{
                                                      var temp = {...tt,"dist":res.distance};
                                                      globalArr[tt.i][tt.j] = temp;
                                                      resolve(res);
                                                    }
                                                    
                                                  })
                    
                                                }
                                                else{
                                                  var temp = {...tt,"dist":res.distance};
                                                  globalArr[tt.i][tt.j] = temp;
                                                  resolve(res);
                                                }
                                                
                                              })
                
                                            }
                                            else{
                                              var temp = {...tt,"dist":res.distance};
                                              globalArr[tt.i][tt.j] = temp;
                                              resolve(res);
                                            }
                                            
                                          })
            
                                        }
                                        else{
                                          var temp = {...tt,"dist":res.distance};
                                          globalArr[tt.i][tt.j] = temp;
                                          resolve(res);
                                        }
                                        
                                      })
        
                                    }
                                    else{
                                      var temp = {...tt,"dist":res.distance};
                                      globalArr[tt.i][tt.j] = temp;
                                      resolve(res);
                                    }
                                    
                                  })
    
                                }
                                else{
                                  var temp = {...tt,"dist":res.distance};
                                  globalArr[tt.i][tt.j] = temp;
                                  resolve(res);
                                }
                                
                              })

                            }
                            else{
                              var temp = {...tt,"dist":res.distance};
                              globalArr[tt.i][tt.j] = temp;
                              resolve(res);
                            }
                          
                        })


                      }
                      else{
                        var temp = {...tt,"dist":res.distance};
                        globalArr[tt.i][tt.j] = temp;
                        resolve(res);
                      }
                    
                  })


                }
                else{
                  var temp = {...tt,"dist":res.distance};
                  globalArr[tt.i][tt.j] = temp;
                  resolve(res);
                }
            })
          }))
        }
    }
    await Promise.all(promiseArr);
    const customDistComparator = (a,b) =>{
        return a.dist-b.dist;
    }
    var finalAns = [];
    let myMap = new Map();
    var temp = [];
    finalAns.push(globalArr[0]);
    for(i=0;i<globalArr[0].length;i++){
      myMap.set(globalArr[0][i].url,1);
    }
    for(i=0;i<globalArr[1].length;i++){
      if(myMap.has(globalArr[1][i].url)){
        continue;
      }
      else temp.push(globalArr[1][i]);
    }
    finalAns.push(temp);
    temp = [];
    myMap.clear();
    for(i=0;i<globalArr[1].length;i++){
      myMap.set(globalArr[1][i].url,1);
    }
    for(i=0;i<globalArr[2].length;i++){
      if(myMap.has(globalArr[2][i].url)){
        continue;
      }
      else temp.push(globalArr[2][i]);
    }
    finalAns.push(temp);
    temp = [];
    myMap.clear();
    for(i=0;i<globalArr[2].length;i++){
      myMap.set(globalArr[2][i].url,1);
    }
    for(i=0;i<globalArr[3].length;i++){
      if(myMap.has(globalArr[3][i].url)){
        continue;
      }
      else temp.push(globalArr[3][i]);
    }
    finalAns.push(temp);
    for(i=0;i<finalAns.length;i++) finalAns[i].sort(customDistComparator);
    console.log('this is the one: ', finalAns);
    var res=[]
    response.render('index',{finalAns,res,url, state_});
  }

  ////USE BELOW FOR DEV/TEST PUROPSE ONLY////
  //https://picsum.photos/200/300
  //url = "https://picsum.photos/200/300";
  // url = "https://source.unsplash.com/collection/483251";

  // const reqUrlFun = (url)=>{
  //   return new Promise((resolve,reject)=>{
  //     request({url,json:true},(err,body)=>{
  //         if(err) reject(err);
  //         // console.log(body);
  //         resolve(body.request.uri.href);
  //     })
  //   })
  // }
  
  // var reqUrl = await reqUrlFun(url);
  
  //console.log("reqUrl***^^^***: ",url);
  
  //////////////////////////////////////

  trackData(state_.toLowerCase(), district_, url, cb);

})

//contact-us form 
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});
// verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

//contact-us route 
app.post("/send", (req, res) => {
  //1.
  let form = new multiparty.Form();
  let data = {};
  form.parse(req, function (err, fields) {
    console.log(fields);
    Object.keys(fields).forEach(function (property) {
      data[property] = fields[property].toString();
    });

    //2. You can configure the object however you want
    const mail = {
      from: data.name,
      to: process.env.EMAIL,
      subject: data.subject,
      text: `${data.name} <${data.email}> \n${data.message}`,
    };

    //3.
    transporter.sendMail(mail, (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).send("Something went wrong.");
      } else {
        res.status(200).send("Email successfully sent to recipient!");
      }
    });
  });
});




app.get("*", (req, res) => {
  res.render('error')
})


//connect to server
app.listen(port, () => console.log("Server is running on port " + port));
