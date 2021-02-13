// Modules
const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require('body-parser')
const fs = require('fs')
const ejs = require('ejs')
const path = require('path')
const request=require('request')
const States = require('./models/states.js')

//Express server setup
const app = express();
app.use(express.json());

// configuration for environment variables
require("dotenv").config();

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

//Index route
app.get('/', (req, response) => {
    response.render('index1');
  });

//insert photos array (url only) for a given city (state is hardcoded as of now)
// incase the city doesn't exist, a new city object will be created
app.get('/insert/:city',(req,res)=>{
  var city=req.params.city;
  //console.log(city)
  flickr(city,(error,body)=>{
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
      name : city,
      photos : photos
    }
    //console.log(currentCity.name)
    States.findOne({name : "arunachal pradesh"})
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
        }else{
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
      })
  })
})

// route for updating tags in city
app.get('/update/:stateInput', (req, res) => {
  var reqState=req.params.stateInput;
  var cnt = 0;

  States.findOne({name:reqState})
  .then((state)=>{
    var chunk = 6;
    
    const iterate = function(city_i){
      console.log(state.cities[city_i].name);
      cnt = 0;
      var city = state.cities.find(c => c.name === state.cities[city_i].name)
      var lim = city.photos.length;
      const solve = function(lower_bound,upper_bound){
        if((upper_bound-lower_bound+1)==0){
          city_i++;
          if(city_i<state.cities.length) return iterate(city_i);

        }
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
                    else{
                      if(city_i+1<state.cities.length){
                        return iterate(city_i+1);
                      }
                    }
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
                  else{
                    if(city_i+1<state.cities.length){
                      return iterate(city_i+1);
                    }
                  }
              }
            }
          }
          start();
        }
      }
      
      solve(0,Math.min(chunk,lim-1));

    }
    iterate(0);
  })
})

//connect to server
app.listen(port, () => console.log("Server is running on port " + port));