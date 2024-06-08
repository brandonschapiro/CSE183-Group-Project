"use strict";

let app = {};

// Vue.js application data and methods
app.data = {
    data() {
        return {
            searchTerm: '', // The term to search for species
            speciesResults: [], // Array to store the results of the species search
            sightings: [], // Array to store the species sightings
            latitude: null, // Latitude of the observation location
            longitude: null // Longitude of the observation location
        };
    },
    methods: {
        // Method to search for species using a debounced function to limit the number of API calls
        searchSpecies: _.debounce(function() {
            axios.get(get_species_url, { params: { term: this.searchTerm }}).then((response) => {
                this.speciesResults = response.data.species; // Update species results with the response data
            });
        }, 300),
        
        // Method to add a species to the sightings list
        addSpecies(species) {
            this.sightings.push({
                id: species.id,
                name: species.name,
                species_count: 1 
            });
            this.speciesResults = []; 
            this.searchTerm = ''; 
        },
        
        // Method to remove a species from the sightings list
        removeSpecies(index) {
            this.sightings.splice(index, 1); 
        },
        
        // Method to increment the count of a species in the sightings list
        incrementCount(index) {
            this.sightings[index].species_count++; 
        },
        
        // Method to submit the checklist
        submitChecklist() {
            if (this.latitude === null || this.longitude === null) {
                alert("Please select a location on the map."); 
                return;
            }

            let data = {
                latitude: this.latitude,
                longitude: this.longitude,
                observation_date: new Date().toISOString().split('T')[0], 
                observation_time: new Date().toISOString().split('T')[1].split('.')[0], 
                observation_duration: 60, 
                sightings: this.sightings 
            };

            // Post the checklist data to the server
            axios.post(submit_checklist_url, data).then((response) => {
                if (response.data.status === 'success') {
                    alert("Checklist submitted successfully!"); 
                    this.sightings = []; 
                }
            });
        }
    },
    
    // Mounted lifecycle hook to set the initial location
    mounted() {
        this.latitude = 37.7749; 
        this.longitude = -122.4194; 
    }
};

// Create and mount the Vue.js application
app.vue = Vue.createApp(app.data).mount("#app");
