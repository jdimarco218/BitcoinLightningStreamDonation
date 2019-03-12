const axios   = require('axios');
const express = require('express');
const mongodb = require('mongodb');

const router = express.Router();

var dbRequests;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const opennodeAuth = process.env.OPENNODE_APIKEY;
var dbUrl = `mongodb+srv://${dbUser}:${dbPassword}@cluster0-rigj4.mongodb.net/test?retryWrites=true`;

// Get Requests
router.get('/', async(req, res) => {
    const requests = await loadRequestsCollection();
    res.send(await requests.find({}).toArray());
});

//Add Request
router.post('/', async(req, res) => {
    const requests = await loadRequestsCollection();
    var createdAt = new Date();
    await requests.insertOne({
        video: req.body.video,
        createdAt: createdAt,
        paidAt: createdAt,
        charge_id: req.body.charge_id,
        paid: false,
        amountPaid: 0
    });
    res.status(201).send();
});

// Delete Post
router.delete('/:id', async(req, res) => {
    const requests = await loadRequestsCollection();
    await requests.deleteOne({_id: new mongodb.ObjectID(req.params.id)});
    res.status(200).send();
});

async function loadRequestsCollection() {
    try {
        if (!dbRequests) {
            const client = await mongodb.MongoClient.connect(`${dbUrl}`, {useNewUrlParser: true});
            dbRequests = client.db('lightningstream').collection('requests');
        }
        return dbRequests;
    } catch(err) {
        console.log(`Db connection error: ${err}`);
        //TODO
        return [];
    }
}

module.exports = router;