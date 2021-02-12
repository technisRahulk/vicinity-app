// Modules
const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require('body-parser')
const fs = require('fs')
const ejs = require('ejs')
const path = require('path')
const request=require('request')

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
    var res=[]
    var finalAns = [];
    var url;
    response.render('index', { res,layout:false,finalAns,url});
  });

//connect to server
app.listen(port, () => console.log("Server is running on port " + port));