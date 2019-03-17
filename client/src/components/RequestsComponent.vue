<template>
  <div class="container">
  <div class="topnav">
    <img class="topimg" src="../assets/lightningEmojiSmall.png">
    <div class="titleText ml-3 text-x1 text-grey-darker" href="#">Lightning Stream Media Request</div>
      <div class="topnav-right">
        <a href="#" class="btn-sm" v-b-modal.modal-faq>FAQ</a>
        <b-modal ref="faqModal" id="modal-faq" ok-only cenetered scrollable title="FAQ">
        <p class="my-4"><b>What is this?</b></p>
        <p class="my-4">Lorum Ipsem Bitch</p>
        <p class="my-4"><b>What does it cost?</b></p>
        <p class="my-4">100 Satoshis per second. Thats like 0.4 cents or something.</p>
        </b-modal>
      </div>
  </div>
  <body class="jBod">
    <div class="form-group">
      <label style="color:white;">YouTube Video URL</label>
      <input type="text" v-model="text" class="form-control" placeholder="Enter a YouTube URL">
    </div>
    <div class="form-group">
      <label style="color:white;">Number of seconds</label>
      <input type="text" v-model="seconds" class="form-control" placeholder="Enter # of seconds to play">
    </div>
    <input type="submit" v-on:click="createRequest" v-b-modal.modal-tall class="btn btn-primary" value="Submit">

      <!-- Modal Component -->
      <b-modal ref="requestModal" id="modal-tall" ok-only centered scrollable title="Lightning invoice">
        <p class="my-4">{{this.invoice}}</p>
        <hr>
        <p>
        <qrcode v-if="showRequestQR" :value='invoice' :options="{ width: 200 }"></qrcode>
        </p>
      </b-modal>
    <hr>
    <p class="error" v-if="error">{{error}}</p>
  </body>
  </div>
</template>

<script src="http://cdn.socket.io/stable/socket.io.js"></script>
<script>
import RequestsService from '../RequestsService';
import axios from 'axios';
export default {
  name: 'RequestsComponent',
  title () {
    return 'Lightning Stream';
  },
  data() {
    return {
      requests: [],
      error: '',
      text: '',
      seconds: '',
      invoice: 'Loading...',
      showRequestQR: false,
      requestCost: '100'
    }
  },
  sockets: {
    connect() {
      console.log("client connected to socket");
    },
    disconnect() {
      console.log("client disconnected from socket");
    },
    message(data) {
      console.log(`socket message: ${data}`);
      if (this.text === data.message) {
          this.closeRequestPopup();
      }
    },
    captionMsg(data) {
      console.log(`socket message: ${data}`);
      this.getMostRecentCaption();
      this.getCaptionCost();
      this.closeCaptionPopup();
      this.inputCaption = '';
    }
  },
  async created() {
    document.title = "Lightning Stream";
    try {
      this.requests = await RequestsService.getRequests();
    } catch(err) {
      this.error = err.message;
    }
  },
  methods: {
    async createRequest() {
      this.error = '';
      this.invoice = 'Loading...';
      this.showRequestQR = false;
      var isValidRequest = false;
      //
      // Validate via the songrequest/youtube endpoing
      //
      const validateUrl = 'https://api.streamelements.com/kappa/v2/songrequest/youtube?videoId=' + this.text; 
      var res = await axios.get(validateUrl)
      .then(res => {
        if (res.status == 200) {
          isValidRequest = true;
        }
      })
      .catch((error) => {
        this.invoice = error;
      });
      if (isValidRequest) {
        this.showRequestQR = true;
        this.invoice = await RequestsService.insertRequest(this.text, this.seconds);
        this.requests = await RequestsService.getRequests();
      } else {
        this.invoice = "Please enter a valid YouTube Video URL";
      }
    },
    async deleteRequest(id) {
      await RequestsService.deleteRequest(id);
      this.requests = await RequestsService.getRequests();
    },
    async closeRequestPopup() {
      this.$refs.requestModal.hide();
    }
  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: transparent;
  min-height: 100%;
}
.topnav {
  overflow: hidden;
  background-color:rgb(0, 0, 0);
}

div.titleText {
  float: left;
  color: #f2f2f2;
  text-align: center;
  padding: 17px 0px;
  text-decoration: none;
  font-size: 14px;
}

.topnav a {
  float: left;
  color: #f2f2f2;
  text-align: center;
  padding: 17px 35px;
  text-decoration: none;
  font-size: 14px;
}

.jBod {
  background-color: transparent;
  height: 100%;
  padding-top: 60px;
}

.modal-body p {
  word-wrap: break-word;
}

.topnav a:hover {
  background-color: #ddd;
  color: black;
}

.topnav a.active {
  background-color: #4CAF50;
  color: white;
}

.topnav-right {
  float: right;
}

img.topimg {
  height: 20px;
  margin-left: 28px;
  margin-top: 17px;
  float: left;
}

div.topnav {
  background-color: #22133fb4;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 55px;
  /*box-shadow: 0 0 25px 0 darkblue;
  */
}

div.header-right {
  float: right;
}

body {
  margin-top: 0px;
  padding: 10px;
  overflow:hidden;
}

p.error {
  border: 1px solid #ff5b5f;
  background-color: #ffc5c1;
  padding: 10px;
  margin-bottom: 15px;
}

div.post {
  position: relative;
  border: 1px solid #5bd658;
  background-color: #bcffb8;
  padding: 10px 10px 30px 10px;
  margin-bottom: 15px;
}

.create-post-input {
  display: block;
  margin-left : auto;
  margin-right : auto;
}

.imgCostStyle {
  display: block;
  margin-left : auto;
  margin-right : auto;
}
.capCostStyle {
  display: block;
  margin-left : auto;
  margin-right : auto;
}

.create-post-btn {
  display: block;
  margin-left : auto;
  margin-right : auto;
}

div.caption-content {
  font-size:1.5rem;
  display: block;
  margin: auto;
  padding-bottom:2rem;
}

div.created-at {
  position: absolute;
  top: 0;
  left: 0;
  padding: 5px 15px 5px 15px;
  background-color: darkgreen;
  color: white;
  font-size: 13px;
}

p.text {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 0;
}

img.var-image {
  max-width: 100%;
  height: auto;
  width: auto\9; /* ie8 */
}
</style>
