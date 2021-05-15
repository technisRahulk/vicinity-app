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

const updateDB = async() => {
    try{
        const states = await States.find({});
        for(const state of states){
            for(const city of state.cities){
                for(const photo of city.photos){
                    const doc = new Photo({
                        url: photo.url,
                        place: city.name,
                        state: state.name
                    });
                    const savedDoc = await doc.save();
                }
            }
            console.log('State ', state.name, ' over');
        }
    } catch(e) {
        console.log(e);
    }
}

// updateDB();

// const del = async() => {
//     try{
//         const deleted = await Photo.deleteMany({});
//         console.log('Deleted all');
//     } catch(e){
//         console.log(e);
//     }
// }

// del();

