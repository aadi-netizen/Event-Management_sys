// modules import
const express = require('express');
const csvFilePath = 'data.csv'
const csv = require('csvtojson');
require('./dbConnect');
const evt = require('./Models/eventModel');
const axios = require('axios');

// import and configuration of environment variables
const dotenv = require('dotenv').config();
// console.log(process.env.PORT);


const app = express();       // express application creation
const port = process.env.PORT || 4000;           // port number assignment


app.use(express.json());       // json parser middleware


// get route to ingest event data stored in the 'csv' file into the data
app.get('/events/add', async (req, res) => {
  csv().fromFile(csvFilePath)
    .then((jsonArray) => {
      jsonArray.forEach(async (jsonObj) => {

        // creating an event objects to save in the database
        const evtObj = {
          evt_name: jsonObj.event_name,
          city: jsonObj.city_name,
          date: jsonObj.date,
          time: jsonObj.time,
          location: {
            longitude: jsonObj.longitude,
            latitude: jsonObj.latitude
          }
        }
        const newEvent = new evt(evtObj);

        try {
          await newEvent.save();
          // console.log(newEvent);
          res.status(201).send("The events has been added successfully");

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      });
    })
    .catch((err) => {
      console.error('Error reading CSV:', err);
    });

  res.status(201);
});



// add a single event data into the database
app.post('/events/addOne', async (req, res) => {
  console.log(req.body);
  const { evt_name, city, date, time, longitude, latitude } = { ...req.body };
  // console.log(evt_name);
  const evtObj = {
    evt_name: evt_name,
    city: city,
    date: date,
    time: time,
    longitude: longitude,
    latitude: latitude
  }
  const newEvent = new evt(evtObj);
  await newEvent.save();
  // console.log(newEvent);

  res.status(201).send("The event has been added successfully");
});


// // function for fetching weather
const findWeather = async (eventCity, eventDate) => {
  try {
    const weatherResp = await axios.get('https://gg-backend-assignment.azurewebsites.net/api/Weather', {
      params: {
        code: 'KfQnTWHJbg1giyB_Q9Ih3Xu3L9QOBDTuU5zwqVikZepCAzFut3rqsg==',
        city: eventCity,
        date: eventDate
      }
    });
    console.log(weatherResp.data.weather);
    return weatherResp.data.weather;
  } catch (error) {
    console.log({ "weather API error": error });
  }
}


// // find events on the basis on user's location and date
app.get('/events/find', async (req, res) => {

  // destructuring req body
  const { latitude, longitude, date, page = 1 } = { ...req.body };
  const skip = (page - 1) * 10
  // console.log(date);

  // Parse and validate the date
  const specifiedDate = new Date(date);
  if (isNaN(specifiedDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  } else {
    // Logic to Find events within 14 days using $gte and $lte for date range
    const startDate = specifiedDate;
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(specifiedDate.getTime() + (14 * 24 * 60 * 60 * 1000));
    endDate.setHours(23, 59, 59, 999);


    const respEvents = await evt.find({ date: { $gte: startDate, $lte: endDate } })
      .sort({ date: 1 }).skip(skip).limit(10);

    // Check if the events array is empty or not
    if (respEvents.length === 0) {
      console.log('No events found for the specified criteria.');
    } else {

      console.log('No of Events:', respEvents.length);

    // Create an array of promises for weather data
    const weatherPromises = respEvents.map(event => findWeather(event.city, event.date));

    // Wait for all weather promises to resolve
    const weatherData = await Promise.all(weatherPromises);

    // Combine events and weather data
    const eventsWithWeather = respEvents.map((event, index) => {
      return { ...event, weather: weatherData[index] };
    });

    res.json(eventsWithWeather);
    }

  }
});








// // fetching distance for a particular event
// const findDistanse = async () => {
//   try {
//     const distanceResp = await axios.get('https://gg-backend-assignment.azurewebsites.net/api/Weather', {
//       params: {
//         code: 'KfQnTWHJbg1giyB_Q9Ih3Xu3L9QOBDTuU5zwqVikZepCAzFut3rqsg==',
//         city: jsonObj.city_name,
//         date: jsonObj.date
//       }
//     });
//     console.log(distanceResp.data);
//     return distanceResp.data;
//   } catch (error) {
//     console.log({ distanseAPIError: error })
//   }
// }




// initializion of the server


app.listen(port, () => console.log(`The server is running on port ${port}`));