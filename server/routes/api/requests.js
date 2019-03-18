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
        amountPaid: 0,
        se_id: ''
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
            var ourChargeId = '';
            await axios.get(chargeUrl, { headers: {
                'Content-Type': 'application/json',
                'Authorization': 'bd5ecb21-6fba-4cfa-949c-a5c70149ad27'
            }})
            .then(response => {
                if (response.status === 200 &&
                    response.data.data.status === 'paid') {
                    ourChargeId = response.data.data.id;
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
            var receivedStreamElementsID = '';
            await axios.post(newRequestUrl, body, { headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${streamElementsJWT}`
            }})
            .then(seResponse => {
                receivedStreamElementsID = seResponse.data._id;
                console.log(`Successfully queued: ${responseVal}`);
            })
            .catch((error) => {
                console.log(`New request error: ${error}`);
            });

            //
            // Keep the ID that StreamElements uses to refer to later
            //
            if (receivedStreamElementsID !== '') {
                requests.findOneAndUpdate(
                    { "charge_id": ourChargeId },
                    { $set: {
                        "se_id": receivedStreamElementsID  } },
                    { upsert: true}
                );
            }
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

var prevSongId = '';
var currSongId = '';
var currDuration = 0;
var durationToPlay = 0;
var isOurSong = false;
setInterval(async() => {
    var isNewSong = false;
    const getSongInfoUrl = 'https://api.streamelements.com/kappa/v2/songrequest/5c86b7740ba7952f06384482/playing';
    await axios.get(getSongInfoUrl, { headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${streamElementsJWT}`
    }})
    .then(response => {
        currSongId = response.data._id;
        if (currSongId != prevSongId) {
            //
            // Reset our counter and current song. We will play this one for the calculated duration
            // if it exists in our database and has a paid amount. Otherwise, let it play entirely
            //
            console.log(`New song detected! Resetting currDuration to 0`);
            currDuration = 0;
            prevSongId = currSongId;
            isNewSong = true;

        } else {
            currDuration += 1; // Seconds of this interval
            console.log(`currDuration: ${currDuration}`);
        }
    })
    .catch((error) => {
        console.log(`Playing info error: ${error}`);
    });
    if (isNewSong) {
        currDuration = 0;
        var dbReqs = await loadRequestsCollection();
        //var currSongDb = dbReqs.find(ObjectId(currSongId));
        console.log(`new song id: ${new mongodb.ObjectID(currSongId)}`);
        var dbSong = await dbReqs.findOne({"se_id": currSongId});
        console.log(`db output: ${dbSong}`);
        if (dbSong !== null) {
            console.log("This song is from our db!");
            console.log(`amountPaid: ${dbSong.amountPaid}`);
            durationToPlay = dbSong.amountPaid;
            isOurSong = true;
        } else {
            console.log("This new song is not ours.");
            durationToPlay = 0;
            isOurSong = false;
        }
    }
    isNewSong = false;

    //
    // Here is where we handle the duration paid for. Let's
    // skip once the number of seconds passes the amount paid
    // for (multiplied by the rate TODO)
    //
    if (durationToPlay != 0 &&
        currDuration >= durationToPlay) {
        console.log("Attempting to skip this song now due to duration...");
        const skipSongUrl = 'https://api.streamelements.com/kappa/v2/songrequest/5c86b7740ba7952f06384482/skip';
        await axios.post(skipSongUrl, {}, { headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${streamElementsJWT}`
        }})
        .then(response => {
            console.log(`we skipped the latest song!: ${response}`);
        })
        .catch(error => {
            console.log(`Error skipping song: ${error}`);
        });
    }

    //
    // Here we handle the scenario where a backup song is playing and
    // a new song is submitted. Lets skip the backup song and let the
    // user hear their request now. Make sure the duration is a couple
    // of seconds in to handle weird cases with delays
    //
    if (false &&
        !isOurSong && currDuration > 8) {
        var skipForUser = false;
        const nextSongUrl = 'https://api.streamelements.com/kappa/v2/songrequest/5c86b7740ba7952f06384482/next';
        await axios.get(nextSongUrl, {}, { headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${streamElementsJWT}`
        }})
        .then(response => {
            if (response.data.hasOwnProperty("song") &&
                response.data.song !== 'undefined' && 
                response.data.song !== null) {
                skipForUser = true;
            } else {
                skipForUser = false;
            }

        })
        .catch(error => {
            console.log(`Error getting next song info: ${error}`);
        });
        if (skipForUser) {
            currDuration = 0;
            const skipSongUrl = 'https://api.streamelements.com/kappa/v2/songrequest/5c86b7740ba7952f06384482/skip';
            await axios.post(skipSongUrl, {}, { headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${streamElementsJWT}`
            }})
            .then(response => {
                console.log(`we skipped the current backup song for a user song!: ${response}`);
            })
            .catch(error => {
                console.log(`Error skipping song backup song for user song: ${error}`);
            });
        }
    }
}, 1000);

module.exports = router;