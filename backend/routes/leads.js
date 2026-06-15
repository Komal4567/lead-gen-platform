const express = require('express');
const router = express.Router();
const { getLeads, scanLeads, deleteLead } = require('../controllers/leadsController');

router.get('/',        getLeads);
router.post('/scan',   scanLeads);
router.delete('/:id',  deleteLead);

module.exports = router;