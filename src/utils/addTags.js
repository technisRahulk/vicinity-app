const mongoose = require("mongoose");
const States = require('../models/states.js');
const Photo = require('../models/photos');
const path = require('path');

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


// const findCity = async(state, place) => {
//     return new Promise((resolve, reject) => {
//         const city = state.cities.find((city => city === place));
//     })
// }

const updateDB = async() => {
    try{
        // const states = await States.find({});
        // for(const state of states){
        //     for(const city of state.cities){
        //         for(const photo of city.photos){
        //             await Photo.findOneAndUpdate({url: photo.url}, {tags: photo.tags}, {new: true});
        //         }
        //     }
        //     console.log('State ', state.name, ' over');
        // }

        const photos = await Photo.find({});
        // console.log('zeroth')
        let cnt = 0;
        for(const photo of photos){
            // console.log('first');
            const state = await States.findOne({name: photo.state});
            // console.log('second')
            const city = state.cities.find((city) => city.name === photo.place);
            // console.log('third')
            const ph = city.photos.find((ph) => ph.url === photo.url);
            // console.log('fourth')
            photo.tags = ph.tags;
            // console.log('fifth')
            const saved = await photo.save();

            cnt += 1;
            if(cnt % 50 === 0)
                console.log('Progress: ', (cnt/10869)*100);
        }
    } catch(e) {
        console.log(e);
    }
}

updateDB();

// const findPhoto = async(inputId) => {
//     try{
//         const photo = await Photo.find({_id: inputId});
//         console.log(photo)
//     } catch(e) {
//         console.log(e);
//     }
// }

// for (item of testIds){
//     findPhoto(item);
// }


