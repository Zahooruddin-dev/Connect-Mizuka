const express = require('express');
const cors = require('cors');
const app = express();
const authRoutes = require('./Routes/authRoutes');
const PORT = process.env.PORT || 3000;
require('dotenv').config();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(PORT, '0.0.0.0', () => {
	console.log('Server listening at 3000');
});
module.exports = app;
