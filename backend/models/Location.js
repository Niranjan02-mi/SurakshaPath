const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    touristId: {
        type: String,
        required: true,
        index: true
    },
    lat: {
        type: Number,
        required: true
    },
    lng: {
        type: Number,
        required: true
    },
    sosStatus: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create a geospatial index for future range queries (optional but good practice)
locationSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model('Location', locationSchema);
