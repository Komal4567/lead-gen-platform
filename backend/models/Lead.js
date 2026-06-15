const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  companyName:  { type: String, required: true },
  website:      { type: String, default: 'N/A' },
  industry:     { type: String, default: 'Unknown' },
  stage:        { type: String, default: 'Unknown' },
  signal:       { type: String, required: true },
  summary:      { type: String, default: '' },
  intentScore:  { type: Number, default: 0 },
  scoreLabel:   { type: String, default: 'Low' },
  sourceUrl:    { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', LeadSchema);