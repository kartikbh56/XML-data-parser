# 📊 XML data parser - Backend

A Node.js + Express backend that processes Experian soft credit pull XML files, extracts structured credit report data, and stores it in MongoDB.

This backend follows a clean MVC architecture, featuring file upload support, XML parsing, error handling, and persistent storage using Mongoose.

## 🚀 Features

- RESTful API built with Express.js
- File uploads handled via Multer
- XML parsing and transformation into structured JSON
- MongoDB integration using Mongoose
- Robust error handling and validation
- Clean and modular folder structure
- .env-based configuration for easy local setup

## 🧩 Project Structure

```
experian-xml-backend/
├─ src/
│  ├─ config/
│  │  └─ db.js                # MongoDB connection setup
│  ├─ controllers/
│  │  └─ controller.js        # Upload, parse, and data retrieval logic
│  ├─ routes/
│  │  ├─ api.js               # API route definitions
│  ├─ services/
│  │  └─ xmlParser.js         # XML parsing logic
│  ├─ middlewares/
│  │  ├─ multerConfig.js      # Multer configuration for file upload
│  │  └─ errorHandler.js      # Centralized error handling
│  ├─ models/
│  │  └─ CreditReport.js      # Mongoose schema for credit reports
│  ├─ app.js                  # Express app setup
│  └─ server.js               # Server entry point
├─ .env                       # Environment variables
├─ package.json
└─ README.md
```

## 🌐 API Endpoints

### ➤ 1. Upload XML File

**POST** `/api/upload-xml`

Uploads and parses an Experian XML file, extracting credit report data and saving it to MongoDB.

**Form-Data:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The Experian XML file to upload |

**Response:**

```json
{
  "message": "XML processed and data saved successfully",
  "data": {
    "name": {
      "firstName": "Sagar",
      "lastName": "Ugle"
    },
    "creditScore": 719,
    "reportSummary": { ... },
    "accounts": [ ... ]
  }
}
```

### ➤ 2. Get All Users

**GET** `/api`

Returns a list of all uploaded users (only basic info).

**Response:**

```json
[
  {
    "_id": "68f4785a7986889b2d4b3b8d",
    "name": {
      "firstName": "Sagar",
      "lastName": "Ugle"
    },
    "createdAt": "2025-10-19T05:34:18.267Z"
  }
]
```

### ➤ 3. Get User by ID

**GET** `/api/:id`

Fetches the complete parsed report for a given user ID.

**Example:**

```
GET /api/68f4785a7986889b2d4b3b8d
```

**Response:**

```json
{
  "_id": "68f4785a7986889b2d4b3b8d",
  "name": {
    "firstName": "Sagar",
    "lastName": "Ugle"
  },
  "creditScore": 719,
  "accounts": [ ... ],
  "addresses": [ ... ]
}
```

## 🧱 Technologies Used

- **Node.js** — JavaScript runtime
- **Express.js** — Web framework
- **Multer** — File upload middleware
- **xml2js** — XML to JSON parser
- **Mongoose** — MongoDB ODM
- **dotenv** — Environment variable management
- **Nodemon** — Development auto-reloader


