const csv = require('csvtojson');
const csvFilePath = 'data.csv';
const evt = require('../Models/eventModel');
const axios = require('axios');

// controller function to ingest events
const ingestEvents = async (req, res) => {
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
  }


  // Controller for adding single event
  
  const addSingleEvent = async (req, res) => {
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
  }


  // // function for fetching distance
const findDistance = async (latitude, longitude, lat2, lon2) => {
  try {
    const distanceResp = await axios.get('https://gg-backend-assignment.azurewebsites.net/api/Distance', {
      params: {
        code: 'IAKvV2EvJa6Z6dEIUqqd7yGAu7IZ8gaH-a0QO6btjRc1AzFu8Y3IcQ==',
        latitude1: latitude,
        longitude1: longitude,
        latitude2: lat2,
        longitude2: lon2
      }
    });
    console.log(distanceResp.data.distance);
    return distanceResp.data.distance;
  } catch (error) {
    console.log({ "weather API error": error });
  }
}


// // function for fetching weather
const findWeather = async (eventCity, eventDate) => {
  try {
    const weatherResp = await axios.get('https://gg-backend-assignment.azurewebsites.net/api/Weather', {
      params: {
        code: 'KfQnTWHJbg1giyB_Q9Ih3Xu3L9QOBDTuU5zwqVikZepCAzFut3rqsg==',
        city: eventCity,
        date: eventDate.toISOString().split("T")[0]
      }
    });
    console.log(weatherResp.data.weather);
    return weatherResp.data.weather;
  } catch (error) {
    console.log({ "weather API error": error });
  }
}

// controller to find user specific events
const findEvents =  async (req, res) => {

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

      // console.log('No of Events:', respEvents);

      // Create an array of promises for weather data
      const weatherPromises = respEvents.map(event => findWeather(event.city, event.date));
      console.log(weatherPromises);

      // Wait for all weather promises to resolve
      const weatherData = await Promise.all(weatherPromises);
      console.log(`Weather data: ${weatherData}`);


      // Create an array of promises for distance data
      const distancePromises = respEvents.map(event => findDistance(latitude,longitude,event.location.latitude, event.location.longitude));
      // console.log(distancePromises);

      // Wait for all weather promises to resolve
      const distanceData = await Promise.all(distancePromises);
      console.log(`distance data: ${distanceData}`);


      // Combine events and weather data
      const eventsWithWeatherAndDistance = respEvents.map((event, index) => {
        const eventObject = event.toObject();
        // console.log(eventObject);
        return { ...eventObject, weather: weatherData[index], distance: distanceData[index] };
      });
      res.json(eventsWithWeatherAndDistance);
    }

  }
}






  module.exports = { ingestEvents,addSingleEvent,findDistance,findWeather,findEvents }