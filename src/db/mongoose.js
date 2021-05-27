const mongoose = require("mongoose");
const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../../config/.env') });
mongoose.set('debug', true);
mongoose.Promise = Promise;

// connect mongoose
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => console.log("Connected to mongo server"))
  .catch((err) => console.error(err));

