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
      sightings_count: {}
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
    app.vue.sightings_count = r.data.sightings_count;

    console.log(app.vue.sightings_count)
  });
};

app.load_data();