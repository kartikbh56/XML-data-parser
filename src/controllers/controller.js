const CreditReport = require('../models/CreditReport.js');
const { parseExperianXml } = require("../services/xmlParser.js")

// Upload XML and save user data
async function uploadXml(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided. Please upload an XML file.' });
    }

    const xmlBuffer = req.file.buffer;
    const xmlString = xmlBuffer.toString('utf8');

    // Basic validation: does it look like XML?
    if (!xmlString.trim().startsWith('<')) {
      return res.status(400).json({ error: 'Uploaded file does not appear to be XML.' });
    }

    // Parse and map
    const mapped = parseExperianXml(xmlString);

    // Persist to MongoDB
    const doc = new CreditReport({
      rawFileName: req.file.originalname,
      rawXml: xmlString, // optional
      ...mapped
    });

    await doc.save();

    return res.status(201).json({ message: 'File processed and data saved.', id: doc._id, data: mapped });
  } catch (err) {
    next(err);
  }
}


// Get a user by ID (exclude rawXml)
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await CreditReport.findById(id).select('-rawXml');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching user' });
  }
};

// Get all users (only name + createdAt)
const getAllUsers = async (req, res) => {
  try {
    const users = await CreditReport.find({}, { 'name.firstName': 1, 'name.lastName': 1, createdAt: 1 });
    res.json({ count: users.length, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};

module.exports = { uploadXml, getReportById, getAllUsers };
