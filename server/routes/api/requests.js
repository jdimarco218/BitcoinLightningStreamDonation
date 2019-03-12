const axios   = require('axios');
const express = require('express');
const mongodb = require('mongodb');

const router = express.Router();

const baseCost = 100;
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

// Check for new main post
router.post('/update/', async(req, res) => {
    console.log("UPDATE POST MADE IT WOO");
    const posts = await loadPostsCollection();
    var captionsArray = await posts.find({}).toArray();
    //var captionsArray = await posts.find({"paid":true}).sort({"createdAt_-1_paid_1":1}).limit(20);
    var notFound = true;
    for (var i = captionsArray.length - 1; notFound && i >= 0; i--) {
        if (captionsArray[i].hasOwnProperty("charge_id")) {
            const chargeUrl = 'https://api.opennode.co/v1/charge/' + captionsArray[i]["charge_id"];
            await axios.get(chargeUrl, { headers: {
                'Content-Type': 'application/json',
                'Authorization': `${opennodeAuth}`
            }})
            .then(response => {
                if (response.status === 200 &&
                    response.data.data.status === 'paid') {
                    responseVal = captionsArray[i].text;
                    notFound = false;
                    var paidAt = new Date();
                    console.log(`paidAt: ${paidAt}`);
                    posts.findOneAndUpdate(
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
        }
    }
    console.log("Done.");
    io.send('update sending blah');
    io.emit('message', {
        type: 'update',
        message: 'updated bro'
    });
    await res.status(200).send();
});

// Check for new main caption
router.post('/update/captions', async(req, res) => {
    console.log("CAPTION UPDATE POST MADE IT WOO");
    const posts = await loadCaptionsCollection();
    var captionsArray = await posts.find({}).toArray();
    //var captionsArray = await posts.find({"paid":true}).sort({"createdAt_-1_paid_1":1}).limit(20);
    var notFound = true;
    var responseVal = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/high-voltage-sign_26a1.png';
    for (var i = captionsArray.length - 1; notFound && i >= 0; i--) {
        if (captionsArray[i].hasOwnProperty("charge_id")) {
            const chargeUrl = 'https://api.opennode.co/v1/charge/' + captionsArray[i]["charge_id"];
            await axios.get(chargeUrl, { headers: {
                'Content-Type': 'application/json',
                'Authorization': `${opennodeAuth}`
            }})
            .then(response => {
                if (response.status === 200 &&
                    response.data.data.status === 'paid') {
                    responseVal = captionsArray[i].text;
                    notFound = false;
                    var paidAt = new Date();
                    console.log(`paidAt: ${paidAt}`);
                    posts.findOneAndUpdate(
                        { "charge_id": response.data.data.id },
                        { $set: {
                            "paid": true, 
                            "paidAt": paidAt.toISOString(),
                            "amountPaid": response.data.data.amount} },
                        { upsert: true}
                    );
                }
            })
            .catch((error) => {
                console.log('error ' + error);
            });
        }
    }
    console.log("Done.");
    io.send('caption update sending blah');
    io.emit('captionMsg', {
        type: 'update',
        message: 'updated bro'
    });
    await res.status(200).send(responseVal);
});

//Add Posts
router.post('/', async(req, res) => {
    const posts = await loadPostsCollection();
    var createdAt = new Date();
    await posts.insertOne({
        text: req.body.text,
        createdAt: createdAt,
        paidAt: createdAt,
        charge_id: req.body.charge_id,
        paid: false,
        amountPaid: 0
    });
    res.status(201).send();
});

//Add Caption
router.post('/captions', async(req, res) => {
    const captions = await loadCaptionsCollection();
    var createdAt = new Date();
    await captions.insertOne({
        text: req.body.text,
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

async function loadPostsCollection() {
    try {
        if (!dbPosts) {
            const client = await mongodb.MongoClient.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0-rigj4.mongodb.net/test?retryWrites=true`, {useNewUrlParser: true});
            dbPosts = client.db('vue_express').collection('posts');
        }
        return dbPosts;
    } catch(err) {
        console.log(`Db connection error: ${err}`);
    
        return [{"text": "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/high-voltage-sign_26a1.png", "paid": true, "createdAt": new Date(), "paidAt": new Date(), "amount": 1000}];
    }
}

async function loadRequestsCollection() {
    try {
        if (!dbRequests) {
            const client = await mongodb.MongoClient.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0-rigj4.mongodb.net/test?retryWrites=true`, {useNewUrlParser: true});
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