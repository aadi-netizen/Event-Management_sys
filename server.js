// modules import
const express = require('express');
const evt = require('./Models/eventModel');

// import of necessary configuration, variables and functions(controllers)
require('./dbConnect');
const dotenv = require('dotenv').config();
const { ingestEvents, addSingleEvent, findEvents, findDistance, findWeather } = require('./controllers/eventControllers')





const app = express();                           // express application creation
const port = process.env.PORT || 4000;           // port number assignment


app.use(express.json());                         // json parser middleware 



/******************** REST APIs *****************************/

// get route to ingest event data stored in the 'csv' file into the data
app.get('/events/add',ingestEvents);



// add a single event data into the database
app.post('/events/addOne', addSingleEvent );




 // find events on the basis on user's location and date
app.get('/events/find', findEvents);











// initializion of the server
app.listen(port, () => console.log(`The server is running on port ${port}`));