const express = require('express');
const mongoose = require('mongoose');
const State = require('../models/State.model'); // Import the State model
const { v4: uuidv4 } = require('uuid'); // Import uuid for generating unique ids
const router = express.Router();

// Add Centre endpoint
router.post('/add-centre', async (req, res) => {
    const { stateName, districtName, cityName, centres } = req.body;
  
    try {
        // Find the state, if not found create a new state
        let state = await State.findOne({ stateName });
        if (!state) {
            // If the state doesn't exist, create a new state
            state = new State({
                stateName,
                districts: [{
                    districtName,
                    cities: [{
                        cityName,
                        centres
                    }]
                }]
            });
  
            await state.save();
            return res.status(201).json({ message: 'State, district, city, and centres added successfully', state });
        }
  
        // Find the district, if not found add it
        let district = state.districts.find(d => d.districtName === districtName);
        if (!district) {
            district = {
                districtName,
                cities: [{
                    cityName,
                    centres
                }]
            };
            state.districts.push(district);
            await state.save();
            return res.status(201).json({ message: 'District, city, and centres added successfully', state });
        }
  
        // Find the city, if not found add it
        let city = district.cities.find(c => c.cityName === cityName);
        if (!city) {
            city = {
                cityName,
                centres
            };
            district.cities.push(city);
            await state.save();
            return res.status(201).json({ message: 'City and centres added successfully', state });
        }
  
        // Add centres to the existing city
        city.centres.push(...centres);
        await state.save();
  
        res.status(201).json({ message: 'Centres added successfully', centres });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding centre', details: error.message });
    }
  });
  

// Delete Centre endpoint
router.delete('/deleteCentre', async (req, res) => {
    const { stateName, districtName, cityName, name } = req.body; // `name` will be the centre's name
  
    try {
      // Find the state by its name
      const state = await State.findOne({ stateName });
      if (!state) return res.status(404).json({ message: 'State not found' });
  
      // Find the district within the state
      const district = state.districts.find(d => d.districtName === districtName);
      if (!district) return res.status(404).json({ message: 'District not found' });
  
      // Find the city within the district
      const city = district.cities.find(c => c.cityName === cityName);
      if (!city) return res.status(404).json({ message: 'City not found' });
  
      // Find the centre by name within the city
      const centreIndex = city.centres.findIndex(c => c.name === name);
      if (centreIndex === -1) return res.status(404).json({ message: 'Centre not found' });
  
      // Remove the centre
      city.centres.splice(centreIndex, 1);
      await state.save();  // Save the state with the updated centres
  
      res.status(200).json({ message: 'Centre deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  });
  

// Get Centre endpoint
router.get('/centres', async (req, res) => {
    try {
      const states = await State.find().populate('districts.cities.centres');
      res.status(200).json({ states });
    } catch (error) {
      res.status(500).json({ error: 'Error retrieving centres' });
    }
  });

module.exports = router;
