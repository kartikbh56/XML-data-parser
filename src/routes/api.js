const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multerConfig');
const { uploadXml, getReportById, getAllUsers } = require('../controllers/controller');

// Upload XML file
router.post('/upload-xml', upload.single('file'), uploadXml);

// Get all users (only name + date)
router.get('/', getAllUsers);

// Get specific user by ID
router.get('/:id', getReportById);

module.exports = router;
