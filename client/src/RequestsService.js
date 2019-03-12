import axios from 'axios';
var xssFilters = require('xss-filters');
var baseCost = 10;

const port = process.env.VUE_APP_SERVER_PORT || 8081;
//const host = process.env.VUE_APP_SERVER_HOST || "69.141.47.76";
const host = process.env.VUE_APP_SERVER_HOST || "localhost";
const url = `http://${host}:${port}/api/requests/`;
const apiKey = process.env.OPENNODE_APIKEY;
const opennodeAuth = process.env.OPENNODE_APIKEY;
console.log(`apiKey at top: ${apiKey}`);

class RequestsService {
    // Get Posts
    static getRequests() {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await axios.get(url);
                const data = res.data;
                resolve(
                    data.map(post => ({
                        ...post,
                        createdAt: new Date(post.createdAt)
                    }))
                );
            } catch(err) {
                reject(err);
            }
        });
    }

    // Create Request
    static async insertRequest(text){
        if (true) {
            var postAmount = baseCost;
            text = xssFilters.inHTMLData(text);
            //var costRes = await new Promise(async (res, rej) => {
            //    try {
            //        var costRes = await axios.get(postCostUrl);
            //        console.log('res from cost url: ');
            //        console.log(costRes.data);
            //        postAmount = costRes.data;
            //        res(costRes.data);

            //    } catch(err) {
            //        rej(err);
            //    }
            //});
            //console.log(`requestAmount: ${postAmount.data}`);
            var headers = {
                    'Content-Type': 'application/json',
                    'Authorization': 'bd5ecb21-6fba-4cfa-949c-a5c70149ad27'
            };
            var body = `{ \"amount\": ${postAmount}, \"callback_url\": \"http://${host}:${port}/api/requests/update\" }`;

            console.log(`time to do some lightning!`);
            return axios.post('https://dev-api.opennode.co/v1/charges', body, {headers: headers})
            .then(function (response) {
                if (response.status === 201) {
                    console.log(`new charge_id: ${response.data.data.id}`);
                    axios.post(url, {
                        video: text,
                        charge_id: response.data.data.id
                    });
                }
                console.log(response);
                console.log(`insertRequest returning: ${response.data.data.lightning_invoice.payreq}`);
                return response.data.data.lightning_invoice.payreq;
            })
            .catch(function (error) {
                console.log(error);
            })
        }
    }

    // Insert caption
    static async insertCaption(text, apiKey){
        var captionAmount = baseCost;
        text = xssFilters.inHTMLData(text);
        var costRes = await new Promise(async (res, rej) => {
            try {
                var costRes = await axios.get(captionCostUrl);
                console.log('res from cost url: ');
                console.log(costRes.data);
                captionAmount = costRes.data;
                res(costRes.data);

            } catch(err) {
                rej(err);
            }
        });
        console.log(`captionAmount: ${captionAmount.data}`);
        if (captionAmount.data === 'undefined') {
            captionAmount.data = baseCost;
        }
        console.log(`OPENNODE_APIKEY: ${process.env.OPENNODE_APIKEY}`);
        console.log(`opennodeAuth; ${opennodeAuth}`);
        console.log(`apiKey: ${apiKey}`);
        var headers = {
                'Content-Type': 'application/json',
                'Authorization': `${process.env.OPENNODE_APIKEY}`
        };
        console.log(`creating caption with port: ${port}`);
        var body = `{ \"amount\": ${captionAmount}, \"callback_url\": \"http://${host}:${port}/api/posts/update/captions\" }`;

        console.log(`time to do some caption lightning!`);
        console.log(`AUTHcap: ${process} `);
        return axios.post('https://api.opennode.co/v1/charges', body, {headers: headers})
        .then(function (response) {
            if (response.status === 201) {
                console.log(`new charge_id: ${response.data.data.id}`);
                axios.post(captionUrl, {
                    text: text,
                    charge_id: response.data.data.id
                });
            }
            console.log(response);
            console.log(`insertCaption returning: ${response.data.data.lightning_invoice.payreq}`);
            return response.data.data.lightning_invoice.payreq;
        })
        .catch(function (error) {
            console.log(error);
        })
    }

    // Delete Post
    static deletePost(id){
        return axios.delete(`${url}${id}`);
    }

    static async getImageCost(){
        var result = await axios.get(postCostUrl);
        console.log(`getImageCost: ${JSON.stringify(result.data)}`);
        return JSON.stringify(result.data);
    }

    static async getCaptionCost(){
        var result = await axios.get(captionCostUrl);
        console.log(`getCaptionCost: ${JSON.stringify(result.data)}`);
        return JSON.stringify(result.data);
    }
}

export default RequestsService;