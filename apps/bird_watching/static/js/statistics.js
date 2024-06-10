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
    showAllDates: {}, 
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
  formatDate(dateString) {
  
    // Manually parse the date string as local date
    var parts = dateString.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1; // Months are zero-based
    var day = parseInt(parts[2], 10);
  
    // Create a new Date object with local date components
    var date = new Date(year, month, day);
  
    // Extract the date components
    var formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    var formattedDay = date.getDate().toString().padStart(2, '0');
    var formattedYear = date.getFullYear();
  
    // Return the formatted date string
    var formattedDate = formattedMonth + '/' + formattedDay + '/' + formattedYear;
    return formattedDate;
  },
  
  renderChart(labels, data) {
    // Format the labels to mm/dd/yyyy
    var formattedLabels = labels.map(this.formatDate);
  
    var ctx = document.getElementById('sightingsChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: formattedLabels,
        datasets: [{
          label: 'Sigthings Count',
          data: data,
          backgroundColor: 'rgba(255, 99, 132, 0.2)', // Red color with 20% opacity
          borderColor: 'rgba(255, 99, 132, 1)', // Red color
          borderWidth: 1
        }]
      },
      options: {
        maintainAspectRatio: false, // Disable aspect ratio
        responsive: true, // Make the chart responsive
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Sightings',
              padding: {
                top: 20 // Adjust the top padding as needed
              },
              font: {
                weight: 'bold', // Make the text bold
                size: 14 // Adjust the size as needed
              },
              color: 'black'
            },
            ticks: {
              color: 'white' // Change tick color to white
            }
          },
          x: {
            title: {
              display: true,
              text: 'Dates Observed',
              font: {
                weight: 'bold', // Make the text bold
                size: 14 // Adjust the size as needed
              },
              color: 'black'
            },
            ticks: {
              color: 'white' // Change tick color to white
            }
          }
        },
        width: 800,
        height: 600,
        plugins: {
          legend: {
            display: false // Hide legend
          }
        }
      }
    });
  },
  
  sortSightings() {
    const order = this.sortOrder;
    console.log("Sort Order:", order); // Log the sort order
  
    if (!order) {
      this.sortedSpeciesDates = null;
    } else {
      this.sortedSpeciesDates = Object.fromEntries(
        Object.entries(this.species_dates).sort(([speciesA, datesA], [speciesB, datesB]) => {
          const newestDateA = new Date(Math.max(...datesA.map(d => new Date(d.date))));
          const newestDateB = new Date(Math.max(...datesB.map(d => new Date(d.date))));
  
          return order === 'earliest' ? newestDateA - newestDateB : newestDateB - newestDateA;
        })
      );
      console.log("Sorted Species Dates:", this.sortedSpeciesDates); // Log the sorted species dates
    }
  }
  ,
  
  initializeMap(speciesIndex) {
    const dates = this.filteredSpeciesDates[Object.keys(this.filteredSpeciesDates)[speciesIndex]];
    const mapId = 'map-' + speciesIndex;
    const mapContainer = document.getElementById(mapId);
    mapContainer.innerHTML = ''; // Clear existing map content
  
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
  },
  
  // Watch for changes in filteredSpeciesDates and update maps
  watch: {
    filteredSpeciesDates: {
      handler(newValue, oldValue) {
        // Close all cards when filtered data changes
        this.isVisible = {};
  
        // Reinitialize maps
        for (const speciesIndex in this.species_dates) {
          this.initializeMap(speciesIndex);
        }
      },
      deep: true // Watch for nested changes
    }
  }
  
};

// Define Vue computed properties
app.computed = {
  filteredSpeciesDates() {
    const speciesDatesToUse = this.sortedSpeciesDates || this.species_dates;
    console.log("Filtered Species Dates:", speciesDatesToUse); // Log the filtered species dates
    // Reset isVisible object when searchTerm changes
    this.isVisible = {};
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
  computed: app.computed,
  watch: {
    // Watch for changes in sortOrder and close all cards when it changes
    sortOrder: {
      handler(newValue, oldValue) {
        // Close all cards
        this.isVisible = {};
      },
      immediate: true // Trigger the handler immediately when sortOrder changes
    }
  }
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

      // Initialize isVisible and showAllDates to be false for all species
      app.vue.isVisible = Object.keys(response.data.species_dates).reduce((acc, key, index) => {
        acc[index] = false;
        return acc;
      }, {});
      
      app.vue.showAllDates = Object.keys(response.data.species_dates).reduce((acc, key, index) => {
        acc[index] = false;
        return acc;
      }, {});

      console.log("Loaded species_dates:", app.vue.species_dates); // Log the loaded species dates

      // Render the chart
      app.vue.renderChart(labels, data);
    }.bind(this)) // bind(this) ensures that 'this' refers to the Vue instance
    .catch(function(error) {
      console.error("Error loading data:", error);
    });
};

// Load data when the app is ready
app.load_data();
