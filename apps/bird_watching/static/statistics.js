"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

// Initialize Vue app data
app.data = function() {
  return {
    // Initial data
    species_dates: {},
    searchTerm: "",
    isVisible: {},
    sightings_count:{}
  };
};

// Define Vue app methods
app.methods = {
  toggleVisibility(species) {
    this.isVisible[species] = !this.isVisible[species];
  }
};

// Define Vue computed properties
app.computed = {
  filteredSpeciesDates() {
    // Filter species based on the search term
    if (!this.searchTerm) {
      return this.species_dates;
    }
    const term = this.searchTerm.toLowerCase();
    return Object.fromEntries(
      Object.entries(this.species_dates).filter(([species, dates]) =>
        species.toLowerCase().includes(term)
      )
    );
  }
};

// Create and mount the Vue app
app.vue = Vue.createApp({
  data: app.data,
  methods: app.methods,
  computed: app.computed
}).mount("#app");

// Function to load data from the backend
app.load_data = function() {
  axios.get(get_user_statistics_url).then(function(response) {
    app.vue.species_dates = response.data.species_dates;
    app.vue.sightings_count = response.data.sightings_count;
    console.log(app.vue.sightings_count);
    // Initialize isVisible to be false for all species
    app.vue.isVisible = Object.keys(response.data.species_dates).reduce((acc, key, index) => {
      acc[index] = false;
      return acc;
    }, {}); // Ensure data is loaded correctly
  }).catch(function(error) {
    console.error("Error loading data:", error);
  });
};

// Load data when the app is ready
app.load_data();
