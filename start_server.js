require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

require('./src/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/labours', require('./src/routes/labours'));

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});