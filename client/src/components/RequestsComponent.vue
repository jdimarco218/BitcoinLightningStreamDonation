<template>
  <div class="container">
  <div class="topnav">
    <img class="topimg" src="../assets/lightningEmojiSmall.png">
    <div class="titleText ml-3 text-x1 text-grey-darker" href="#">Lightning Image</div>
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
    <b-img center class="var-image center-block" v-bind:src='imgURL'/>
    <div style="text-align:center;" class='caption-content'> {{ caption }} </div>
    <hr>
    <div class="create-post">
      <div class = "row text-center">
      <input class="create-post-input" type="text" id="create- post" v-model="text" placeholder="Enter YouTube video url">
      <button class="create-post-btn" v-on:click="createPost" v-b-modal.modal-tall>Post for {{100}} sats</button>
      <!-- Modal Component -->
      <b-modal ref="imageModal" id="modal-tall" ok-only centered scrollable title="Lightning invoice">
        <p class="my-4">{{this.invoice}}</p>
        <hr>
        <p>
        <qrcode v-if="showPostQR" :value='invoice' :options="{ width: 200 }"></qrcode>
        </p>
      </b-modal>
      </div>
    </div>
    <hr>
    <div class="create-post-2">
      <div class = "row text-center">
          <input class="create-post-input" type="text" id="create-post-2" v-model="inputCaption" placeholder="Enter caption" maxlength="100">
          <button class="create-post-btn" v-on:click="createCaption" v-b-modal.modal-tall-caption>Post for {{captionCost}} sats</button>
          <b-modal ref="captionModal" id="modal-tall-caption" ok-only centered scrollable title="Lightning invoice">
            <p class="my-4">{{this.invoice2}}</p>
            <hr>
            <p>
            <qrcode :value='invoice2' :options="{ width: 200 }"></qrcode>
            </p>
          </b-modal>
      </div>
    </div>
    <hr>
    <p class="error" v-if="error">{{error}}</p>
  </body>
  </div>
</template>

<script>
import RequestsService from '../RequestsService';
export default {
  name: 'RequestsComponent',
  title () {
    return 'Lightning Stream';
  },
  data() {
    return {
      posts: [],
      error: '',
      text: '',
      imgURL: 'https://imgur.com/gallery/viVcTZ5',
      invoice: 'Loading...',
      showPostQR: true,
      invoice2: 'Loading...',
      showCaptionQR: true,
      inputCaption: '',
      caption: 'Lightning Caption',
      imgCost: '1000',
      captionCost: '1000'
    }
  },
  async created() {
    document.title = "Lightning Stream";
    try {
      this.posts = await RequestsService.getPosts();
      this.getMostRecentPost();
      this.getMostRecentCaption();
      this.getImageCost();
      this.getCaptionCost();
    } catch(err) {
      this.error = err.message;
    }
  },
  methods: {
    async createPost() {
      this.error = '';
      this.showPostQR = true;
      // TODO validation
      if (true) {
        this.invoice = await RequestsService.insertPost(this.text);
        this.posts = await RequestsService.getPosts();
        await this.getMostRecentPost();
      } else {
        this.showPostQR = false;
        this.invoice = "Please enter a valid image URL";
        console.log("invalid URL for post");
      }
    },
    async deletePost(id) {
      await RequestsService.deletePost(id);
      this.posts = await RequestsService.getPosts();
      await this.getMostRecentPost();
    },
    async getMostRecentPost() {
      this.imgURL = await RequestsService.getMostRecentPost();
    },
    async getMostRecentCaption() {
      this.caption = await RequestsService.getMostRecentCaption();
    },
    async getImageCost() {
      this.imgCost = await RequestsService.getImageCost();
    },
    async getCaptionCost() {
      this.captionCost = await RequestsService.getCaptionCost();
    },
    async createCaption() {
      this.invoice2 = await RequestsService.insertCaption(this.inputCaption);
      await this.getMostRecentCaption();
    },
    async closePostPopup() {
      this.$refs.imageModal.hide();
    },
    async closeCaptionPopup() {
      this.$refs.captionModal.hide();
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
  padding: 22px 0px;
  text-decoration: none;
  font-size: 14px;
}

.topnav a {
  float: left;
  color: #f2f2f2;
  text-align: center;
  padding: 22px 35px;
  text-decoration: none;
  font-size: 14px;
}

.jBod {
  background-color: transparent;
  height: 100%;
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
  margin-top: 22px;
  float: left;
}

div.topnav {
  background-color: rgb(140, 140, 140);
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 55px;
  box-shadow: 0 0 25px 0 rgb(140, 140, 140);
}

div.header-right {
  float: right;
}

body {
  margin-top: 0px;
  padding: 10px;
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
