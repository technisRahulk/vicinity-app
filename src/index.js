// Modules
const express = require('express');
require('./db/mongoose');
const bodyParser = require('body-parser')
const ejs = require('ejs')
const path = require('path')
const request = require('request');
const cookieParser = require("cookie-parser");
const adminRouter = require("./Routers/admin");
const userServicesRouter = require("./Routers/userServices");
const contactRouter = require("./Routers/contact");

//Express server setup
const app = express();
app.use(express.json());

// configuration for environment variables
require("dotenv").config({ path: path.resolve(__dirname, '../config/.env') });

//Port setup
const port = process.env.PORT || 7000;

// set view engine and public directory path
app.set('views', path.join(__dirname, './../templates/views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }))
const publicDir = path.join(__dirname, './../public')
app.use(express.static(publicDir))
app.use(cookieParser());


//importing routers
app.use(adminRouter);
app.use(userServicesRouter);
app.use(contactRouter);

//404 endpoint
app.get("*", (req, res) => {
  res.render('404Page');
})

//connect to server
app.listen(port, () => console.log("Server is running on port " + port));
