const mongoose = require('mongoose');
const dotenv = require('dotenv');


// configure dot ENV
dotenv.config();


mongoose.connect(process.env.MONGO_URI).then(() => console.log("DB connected"))
.catch((error) => console.log(`Database connection error: ${error}`));