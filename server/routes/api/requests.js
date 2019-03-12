const axios   = require('axios');
const express = require('express');
const mongodb = require('mongodb');

const router = express.Router();

var dbRequests;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const opennodeAuth = process.env.OPENNODE_APIKEY;
var dbUrl = `mongodb+srv://${dbUser}:${dbPassword}@cluster0-rigj4.mongodb.net/test?retryWrites=true`;
const streamElementsJWT = process.env.STREAM_ELEMENTS_JWT;

// Get Requests
router.get('/', async(req, res) => {
    const requests = await loadRequestsCollection();
    res.send(await requests.find({}).toArray());
});

// Add Request
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

// On Request Paid
router.post('/update', async(req, res) => {
    console.log("UPDATE POST MADE IT WOO");
    const requests = await loadRequestsCollection();
    var requestsArray = await requests.find({}).toArray();
    var responseVal = 'none';
    // TODO better find based on ?
    //var requestsArray = await posts.find({"paid":true}).sort({"createdAt_-1_paid_1":1}).limit(20);
    var notFound = true;
    for (var i = requestsArray.length - 1; notFound && i >= 0; i--) {
        if (requestsArray[i].hasOwnProperty("charge_id")) {
            const chargeUrl = 'https://dev-api.opennode.co/v1/charge/' + requestsArray[i]["charge_id"];
            await axios.get(chargeUrl, { headers: {
                'Content-Type': 'application/json',
                'Authorization': 'bd5ecb21-6fba-4cfa-949c-a5c70149ad27'
            }})
            .then(response => {
                if (response.status === 200 &&
                    response.data.data.status === 'paid') {
                    responseVal = requestsArray[i].video;
                    notFound = false;
                    var paidAt = new Date();
                    console.log(`paidAt: ${paidAt}`);
                    requests.findOneAndUpdate(
                        { "charge_id": response.data.data.id },
                        { $set: {
                            "paid": true, 
                            "paidAt": new Date(),
                            "amountPaid": response.data.data.amount } },
                        { upsert: true}
                    );
                }
            })
            .catch((error) => {
                console.log('error ' + error);
            });
            var body = `{ \"video\": \"${responseVal}\" }`;
            const newRequestUrl = 'https://api.streamelements.com/kappa/v2/songrequest/5c86b7740ba7952f06384482/queue';
            console.log(`newRequestUrl: ${newRequestUrl}`);
            console.log(`curr JWT: ${streamElementsJWT}`);
            console.log(`body: ${body}`);
            await axios.post(newRequestUrl, body, { headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${streamElementsJWT}`
            }})
            .then(response => {
                console.log(`Successfully queued: ${responseVal}`);
            })
            .catch((error) => {
                console.log(`New request error: ${error}`);
            });
        }
    }
    console.log("Done.");
    io.send('update sending blah');
    io.emit('message', {
        type: 'update',
        message: `${responseVal}`
    });
    await res.status(200).send();
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