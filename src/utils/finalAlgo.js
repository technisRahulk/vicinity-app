const mongoose = require("mongoose");
const DistStates = require('../models/distStates.js')
const States = require('../models/states.js')
const {city,simIndex,search,searchDist}=require('./flickr')
const path = require('path')

const {Heap} = require('heap-js');

const customPriorityComparator = (a,b) =>{
    return a.score-b.score;
}

require("dotenv").config({path:path.resolve(__dirname, '../../config/.env')});

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => console.log("Connected to mongo server"))
  .catch((err) => console.error(err));



const trackData = async function(state, district, url, cb){
    const globalArr = []
    console.log(district+" "+state);
    const data = await DistStates.find({})
    var mapStateIndex_ = data[0].mapStateIndex;
    console.log('state url', state, url);
    var matrix = data[0].dist;
    let idToCapital = new Map();
    let capitalToId = new Map();
    let stateToCapital = new Map();
    let idToState = new Map();
    for(var i=0;i<mapStateIndex_.length;i++){
        idToCapital.set(mapStateIndex_[i].index,mapStateIndex_[i].capital);
        capitalToId.set(mapStateIndex_[i].capital,mapStateIndex_[i].index);
        stateToCapital.set(mapStateIndex_[i].state.toLowerCase(),mapStateIndex_[i].capital);
        idToState.set(mapStateIndex_[i].index,mapStateIndex_[i].state);
    }

    var userState = state;
    
    const customComparator = (a,b) =>{
        return a.dist-b.dist;
    }
    var userCapital = stateToCapital.get(userState);
    var distOfCapsFromUser = [];

    for(var i=0;i<28;i++){
        console.log('i: ', i);
        distOfCapsFromUser.push({
            capital: idToCapital.get(i), 
            state: idToState.get(i), 
            id: i, 
            dist: matrix[capitalToId.get(userCapital)][i]
        })
    }
    distOfCapsFromUser.sort(customComparator);
    
    const doSearchImage = function(imgURL){
        return new Promise((resolve,reject)=>{
            var user_arr = [];
            search(imgURL, (err, res) => {
                if(err) reject(err);
                user_arr=res
                console.log(user_arr);
                resolve(user_arr);
            });
        })
    }

    
    var user_arr = await doSearchImage(url);
    let curArr = [];
    const minHeap = new Heap(customPriorityComparator);
    minHeap.init(curArr);
    let myMap = new Map();

    var duplicates = {};
    console.log(user_arr);
    
    const solve = function(w){
        States.findOne({name : distOfCapsFromUser[w].state.toLowerCase()})
        .then(state => {
            if(state){
                var cities = state.cities
                for(var i=0; i<cities.length; i++){
                    var city = cities[i]
                    for(var j=0;j<city.photos.length;j++){
                        if(city.photos[j].isActive){
                            if(curArr.length < 6){
                                if(!duplicates[city.photos[j].url]){
                                    duplicates[city.photos[j].url] = 1;
                                    curArr.push({city_id:i, photo_id:j, state:state.name, city:city.name,  score:simIndex(city.photos[j].tags,user_arr), url: city.photos[j].url});
                                }

                                if(curArr.length==6){
                                    minHeap.init(curArr);
                                    for(var k=0;k<curArr.length;k++){
                                        myMap.set('city_id='+curArr[k].city_id+'photo_id='+curArr[k].photo_id+'score='+curArr[k].score+'state='+curArr[k].state+'city='+curArr[k].city, k);
                                    }
                                }
                            } else {
                                var sim = simIndex(city.photos[j].tags,user_arr);
                                var score = sim;
                                var obj = minHeap.top();
                                if(duplicates[city.photos[j].url]) continue;
                                duplicates[city.photos[j].url] = 1;

                                if(score<=obj[0].score) continue;
                                var id = myMap.get('city_id='+obj[0].city_id+'photo_id='+obj[0].photo_id+'score='+obj[0].score+'state='+obj[0].state+'city='+obj[0].city)
                                myMap.delete('city_id='+obj[0].city_id+'photo_id='+obj[0].photo_id+'score='+obj[0].score+'state='+obj[0].state+'city='+obj[0].city)
                                curArr[id] = {city_id:i, photo_id:j, state:state.name, city:city.name, score:sim, url: city.photos[j].url};
                                minHeap.pop();
                                minHeap.push({city_id:i, photo_id:j, state:state.name, city:city.name, score:sim, url: city.photos[j].url});
                                myMap.set('city_id='+i+'photo_id='+j+'score='+sim+'state='+state.name+'city='+city.name,id);
                            }
                        }
                    }
                }

                if(w==27){
                    let temp = [];
                    Object.assign(temp,curArr);
                    globalArr.push(temp);
                    cb(globalArr);
                    return globalArr;

                }
                else if((w+1)%7==0){
                    let temp = [];
                    Object.assign(temp,curArr);
                    globalArr.push(temp);
                    return solve(w+1);
                }
                else return solve(w+1);
            } else {
                console.log("The State doesn't has ample amount of scenic places "+w+" "+state);
                if(w==27){
                    let temp = [];
                    Object.assign(temp,curArr);
                    globalArr.push(temp);
                    cb(globalArr);
                    return globalArr;
                }
                else if((w+1)%7==0){
                    let temp = [];
                    Object.assign(temp,curArr);
                    globalArr.push(temp);
                    return solve(w+1);
                }
                else return solve(w+1);
            }
        })
        .catch(error => {
            console.log(error)
        })
    }

    solve(0);
    
}

// trackData("assam","kamrup","https://farm66.staticflickr.com/65535/50831248061_1e5be83400_n.jpg",(body)=>
// {
//     console.log(body)
// })


module.exports = trackData;




