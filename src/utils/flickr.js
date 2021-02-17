const request=require('request')
require("dotenv").config();

//calling flickr API for a particular city to fill the DB
const flickr=(city,callback)=>{
    const key=process.env.FLICKR_API_KEY
    const url='https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key='+key+'&tags=' + city + '&text=nature&format=json&nojsoncallback=1'
    request({url,json:true},(error,{body}={})=>{
        if(error){
            callback("Flickr app not accessed in flickr function",undefined)
        }
        else if(body.error){
            callback('Unable to find the place',undefined)
        }
        else{
            callback(undefined,body)
        }
    })

}

function checkURL(url) {
    return(url.match(/\.(jpeg|jpg|png)$/) != null);
}

//calling ML API for a particular image and getting tags in response
const search=(searchUrl,callback)=>{
    //const url='http://localhost:3000/?url='+searchUrl
    if(!checkURL(searchUrl)){
        return callback("Please insert an URL of a valid image file.", undefined)
    }

    const url='https://flask-dl-api.herokuapp.com/predict?url=' + searchUrl
    //console.log(url)
    request({url,json:true},(error,body)=>{
        // console.log(error);
        if(body.statusCode != 200){
            // console.log("URL not found!")
            return callback("URL not found.", undefined)
        }

        // if(((body.headers['content-type']).match(/(image)+\//g)).length != 0){
        //     // console.log("The URL doesn't contains an image. Please verify the URL and try again!!")
        //     return callback("The URL doesn't contains an image. Please verify the URL and try again!!", undefined)
        // }

        if(error){
            console.log("error is \n" + error)
            callback("DL API not accessed in search function",undefined)
        }
        else if(body.error){
            callback('Unable to find the place',undefined)
        }
        else{
            var res = JSON.stringify(body.body)
            var resJSON = JSON.parse(res)
            var user_arr = []
            for(i=0; i<resJSON.length; i++){
                for(var key in resJSON[i]){
                    user_arr.push(key)
                    user_arr.push(resJSON[i][key].toString())
                }
            }
            //console.log(user_arr)
            callback(undefined,user_arr)
        }
    })
}

const sceneClassifier = (searchUrl) => {
    return new Promise((resolve, reject) => {
        
        if(!checkURL(searchUrl)){
            reject("Please insert an URL of a valid image file.");
        }
    
        const url='https://flask-dl-api.herokuapp.com/predict?url=' + searchUrl;
    
        request({url,json:true},(error,body)=>{
            if(body.statusCode != 200){
                reject("URL not found.");
            }
    
            if(error){
                reject("DL API not accessed in search function");
            }
            else if(body.error){
                reject('Unable to find the place');
            }
            else{
                var res = JSON.stringify(body.body)
                var resJSON = JSON.parse(res)
                var user_arr = []
                for(i=0; i<resJSON.length; i++){
                    for(var key in resJSON[i]){
                        user_arr.push(key)
                        user_arr.push(resJSON[i][key].toString())
                    }
                }
                resolve(user_arr);
            }
        })
    })
}



//calculating similarity index between user photo tags and DB photo tags of the city mentioned by user
//db_arr is and array of objects 
const simIndex=((db_tags,user_arr)=>{
    let db_arr=[]
    for(var i=0;i<db_tags.length;i++){
        db_arr.push(db_tags[i].name);
        db_arr.push(db_tags[i].prob);
    }
    let myMap = new Map();
    for(var i=0;i<db_arr.length;i+=2){
        myMap.set(db_arr[i],parseFloat(db_arr[i+1]));
    }

    var ans = 0;

    for(var i=0;i<user_arr.length;i+=2){
        if(myMap.has(user_arr[i])){
            var val1 = myMap.get(user_arr[i]);
            var val2 = parseFloat(user_arr[i+1]);
            var d = Math.abs(val1 - val2);
            var exp_NN = 1 / (1 + d);
            ans += exp_NN;
            // ans += (2*Math.min(val1,val2));
        }
    }
    return ans;
})


const searchDist=(fromCity,toCity,callback)=>{
    //const url='http://localhost:3000/?url='+searchUrl
    if(fromCity===undefined || toCity===undefined) return callback("undefined parameters",undefined);
    const url = 'https://www.distance24.org/route.json?stops='+encodeURIComponent(fromCity)+'|'+encodeURIComponent(toCity)
    // const url = 'http://www.distance24.org/route.json?stops=' + fromCity + '|' + toCity;
    console.log(url)
    //console.log(fromCity+" "+toCity)
    request({url,json:true},(error,res)=>{
        // console.log(res.body);
        if(error){
            callback("searchDist Error",undefined)
        }
        // if res.body is null or if res.body doesn't contain distances parameter or if distances.length is 0 then callback with error
        else if(!res.body || !res.body.distances || res.body.distances.length===0){
            callback('Bad Input',undefined)
        }
        else{
            callback(undefined,res.body)
        }
    })
}

const reverseGeoCode=(lat,long,callback)=>{
    const url = 'http://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+long+'&format=jsonv2';
    // const url = 'https://www.distance24.org/route.json?stops='+encodeURIComponent(fromCity)+'|'+encodeURIComponent(toCity)
    // console.log(url)
    request({url,json:true},(error,res)=>{
        // console.log(res.body);
        if(error){
            callback("Reverse geocode API error",undefined)
        }
        else if(res.body.error=="Unable to geocode"){
            callback('Bad Lat Long',undefined)
        }
        else{
            callback(undefined,res.body)
        }
    })
}

const reverseGeoCode_bigdatacloud_api = (lat,long,callback)=>{
    // const url = 'http://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+long+'&format=jsonv2';
    // const url = 'https://www.distance24.org/route.json?stops='+encodeURIComponent(fromCity)+'|'+encodeURIComponent(toCity)
    // console.log(url)
    const url = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+lat+'&longitude='+long+'&localityLanguage=en';
    request({url,json:true},(error,res)=>{
        // console.log(res.body);
        if(error){
            callback("Reverse geocode API error",undefined)
        }
        else if(res.body.status==401){
            callback('Bad Lat Long',undefined)
        }
        else{
            callback(undefined,res.body)
        }
    })
}

const cityFromPinCode=(pinCode,callback)=>{
    const url = 'https://api.postalpincode.in/pincode/'+pinCode;
    // const url = 'https://www.distance24.org/route.json?stops='+encodeURIComponent(fromCity)+'|'+encodeURIComponent(toCity)
    // console.log(url)
    request({url,json:true},(error,res)=>{
        // console.log(res.body);
        if(error){
            callback("Reverse geocode API error",undefined)
        }
        else if(res.body.error=="Unable to geocode"){
            callback('Bad Lat Long',undefined)
        }
        else{
            callback(undefined,res.body)
        }
    })
}

const do_reverseGeoCode = function(lat,long){
    return new Promise((resolve,reject)=>{
        reverseGeoCode(lat,long,(err,body)=>{
            if(err) reject(err);
            resolve(body.address);
        });
    })
}


const do_reverseGeoCode_bigdatacloud_api = function(lat,long){
    return new Promise((resolve,reject)=>{
        reverseGeoCode_bigdatacloud_api(lat,long,(err,body)=>{
            if(err) reject(err);
            resolve(body);
        });
    })
}

const do_cityFromPinCode = function(input){
    return new Promise((resolve,reject)=>{
        cityFromPinCode(input,(err,body)=>{
            if(err) reject(err);
            console.log("IIIIIIIIIIIIIIIIII ",body[0].PostOffice);

            if(body[0].PostOffice===undefined || body[0].PostOffice===null){
                console.log("here");
                return resolve(undefined);
            }
            city_ = body[0].PostOffice[0];
            resolve(city_);
        });
    })
}

const city = async function(lat,long){
    //Be careful while editing this function

    var pinCode = 0;

    var input = await do_reverseGeoCode(lat,long);

    console.log("input: ",input)
    var input_else = input;
    if(input.postcode===undefined){
        var v = await do_reverseGeoCode_bigdatacloud_api(lat,long);
        if(input.state===undefined) input.state = v.principalSubdivision;
        var obj = {"District":input.state_district,"State":input.state,"County":input.county,"town":input.town};
        if(v.city) obj={...obj,"city":v.city};
        if(v.locality) obj={...obj,"locality":v.locality};
        return obj;
    } else {
        input=input.postcode;
    }
    console.log("input: ",input)

    var next_input = await do_cityFromPinCode(input);
    
    var tempObj = {"District":input_else.state_district,"State":input_else.state,"County":input_else.county,"town":input_else.town};
    var v = await do_reverseGeoCode_bigdatacloud_api(lat,long);
    if(tempObj.State===undefined)
    {
        tempObj.State=v.principalSubdivision;
    }
    // var obj = {"District":input.state_district,"State":input.state,"County":input.county,"town":input.town};
    if(v.city) tempObj={...tempObj,"city":v.city};
    if(v.locality) tempObj={...tempObj,"locality":v.locality};

    if(next_input){
        if(v.city) next_input={...next_input,"city":v.city};
        if(v.locality) next_input={...next_input,"locality":v.locality};
    }

    console.log("next_input:   ",next_input);
    // console.log("IIIIIIIIIII: ",next_input,input.state);
    return (next_input===undefined?tempObj:next_input);

}



module.exports = {
    flickr,
    search,
    simIndex,
    searchDist,
    city,
    sceneClassifier
}