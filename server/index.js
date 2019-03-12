const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8081;

// Middleware
app.use(bodyParser.json());
app.use(cors());

const posts = require('./routes/api/requests');

// Static folder
app.use(express.static(__dirname + '/public'));

// Handle SPA
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

app.use('/api/requests', posts);


app.listen(port, () => console.log(`Server started on port ${port}`));
