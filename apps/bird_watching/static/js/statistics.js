"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

// Initialize Vue app data
app.data = function() {
  return {
    // Initial data
    species_dates: {},
    sortedSpeciesDates: null,
    searchTerm: "",
    isVisible: {},
    sightings_count: {},
    sortOrder: "" // To keep track of the selected sort order
  };
};

// Define Vue app methods
app.methods = {
  toggleVisibility(species) {
    this.isVisible[species] = !this.isVisible[species];
    if (this.isVisible[species]) {
      this.$nextTick(() => {
        this.initializeMap(species);
      });
    }
  },
  renderChart(labels, data) {
    var ctx = document.getElementById('sightingsChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Sightings Count',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  },
  sortSightings() {
    const order = this.sortOrder;
    if (!order) {
      this.sortedSpeciesDates = null;
    } else {
      this.sortedSpeciesDates = Object.fromEntries(
        Object.entries(this.species_dates).sort(([, datesA], [, datesB]) => {
          const dateA = new Date(datesA[0].date);
          const dateB = new Date(datesB[0].date);
          return order === 'earliest' ? dateA - dateB : dateB - dateA;
        })
      );
    }
  },
  initializeMap(speciesIndex) {
    const dates = this.species_dates[Object.keys(this.species_dates)[speciesIndex]];
    const mapId = 'map-' + speciesIndex;
    const map = L.map(mapId).setView([0, 0], 2); // Set initial view

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    dates.forEach(sighting => {
      const lat = sighting.latitude;
      const lon = sighting.longitude;
      L.marker([lat, lon]).addTo(map);
    });

    if (dates.length > 0) {
      const latLngBounds = dates.map(sighting => [sighting.latitude, sighting.longitude]);
      map.fitBounds(latLngBounds);
    }
  }
};

// Define Vue computed properties
app.computed = {
  filteredSpeciesDates() {
    const speciesDatesToUse = this.sortedSpeciesDates || this.species_dates;
    // Filter species based on the search term
    if (!this.searchTerm) {
      return speciesDatesToUse;
    }
    const term = this.searchTerm.toLowerCase();
    return Object.fromEntries(
      Object.entries(speciesDatesToUse).filter(([species, dates]) =>
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
  axios.get(get_user_statistics_url)
    .then(function(response) {
      app.vue.species_dates = response.data.species_dates;
      app.vue.sightings_count = response.data.sightings_count;
      // Prepare data for Chart.js
      let labels = Object.keys(response.data.sightings_count);
      let data = Object.values(response.data.sightings_count);

      // Initialize isVisible to be false for all species
      app.vue.isVisible = Object.keys(response.data.species_dates).reduce((acc, key, index) => {
        acc[index] = false;
        return acc;
      }, {});

      // Render the chart
      app.vue.renderChart(labels, data);
    }.bind(this)) // bind(this) ensures that 'this' refers to the Vue instance
    .catch(function(error) {
      console.error("Error loading data:", error);
    });
};

// Load data when the app is ready
app.load_data();

