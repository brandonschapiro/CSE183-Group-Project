"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
  data: function() {
    return {
      // Complete as you see fit.
      my_value: 1, // This is an example.
      species_names: [],
      observation_dates: [],
    };
  },
  methods: {
    // Complete as you see fit.
  },

};


app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function() {
  axios.get(get_user_statistics_url).then(function(r) {
    app.vue.species_names = r.data.species_names;
    app.vue.observation_dates = r.data.observation_dates;
    
    // Print the first 10 names and dates to console
    console.log("First 10 names and dates:");
    for (let i = 0; i < 10 && i < r.data.species_names.length; i++) {
      console.log(r.data.species_names[i], r.data.observation_dates[i]);
    }
  });
};

app.load_data();