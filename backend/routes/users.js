const express = require('express');
const router = express.Router();
const { syncUser } = require('../controllers/users');

router.post('/sync', syncUser);
 
module.exports = router; 