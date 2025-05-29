const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  count: { type: Number, required: true },
  remaining_count: { type: Number, required: true },
  color: { type: String, default: '#ff4d4d' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prize', prizeSchema);