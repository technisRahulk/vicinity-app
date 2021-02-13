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
<<<<<<< HEAD
    // Link from deployed app
    //const url='' + searchUrl
=======

    const url='https://flask-dl-api.herokuapp.com/predict?url=' + searchUrl
>>>>>>> c7ba87d609240c5047d312dd78d22b3e44cc6451
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
            ans += (2*Math.min(val1,val2));
        }
    }
    return ans;
})

module.exports = {
    flickr,
    search,
    simIndex
}