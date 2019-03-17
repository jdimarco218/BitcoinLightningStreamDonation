import axios from 'axios';
var xssFilters = require('xss-filters');
var baseCost = 1;

const port = process.env.VUE_APP_SERVER_PORT || 8086;
const host = process.env.VUE_APP_SERVER_HOST || "localhost";
const url = `http://${host}:${port}/api/requests/`;
const apiKey = process.env.OPENNODE_APIKEY;
const opennodeAuth = process.env.OPENNODE_APIKEY;

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
    static async insertRequest(text, amount){
        if (true) {
            var postAmount = baseCost * amount;
            text = xssFilters.inHTMLData(text);
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

    // Delete Post
    static deletePost(id){
        return axios.delete(`${url}${id}`);
    }

    static async getImageCost(){
        var result = await axios.get(postCostUrl);
        console.log(`getImageCost: ${JSON.stringify(result.data)}`);
        return JSON.stringify(result.data);
    }
}

export default RequestsService;