<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <RequestsComponent />
  </div>
</template>

<script>
import RequestsComponent from './components/RequestsComponent.vue'

export default {
  name: 'app',
  components: {
    RequestsComponent
  }
}
</script>

<style>
#app {
  /*font-family: 'Avenir', Helvetica, Arial, sans-serif;
  */
  font-family: 'proxima-nova', 'Roboto';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background-image: url(https://cdn.streamelements.com/static/user/background_default.jpg);

}
</style>
