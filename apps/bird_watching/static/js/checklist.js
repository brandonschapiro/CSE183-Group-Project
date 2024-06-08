"use strict";

let app = {};

app.data = {
    data() {
        return {
            searchTerm: '', // Term to search for species
            speciesResults: [], // Results from species search
            sightings: [], // List of species sightings
            latitude: null, // Latitude for the observation location
            longitude: null // Longitude for the observation location
        };
    },
    methods: {
        // Search for species with a debounced function to limit API calls
        searchSpecies: _.debounce(function() {
            axios.get(get_species_url, { params: { term: this.searchTerm }}).then((response) => {
                this.speciesResults = response.data.species;
            });
        }, 300),
        // Add a selected species to the sightings list
        addSpecies(species) {
            this.sightings.push({
                id: species.id,
                name: species.name,
                species_count: 1
            });
            this.speciesResults = [];
            this.searchTerm = '';
        },
        // Remove a species from the sightings list
        removeSpecies(index) {
            this.sightings.splice(index, 1);
        },
        // Submit the checklist to the server
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
                observation_duration: 60,  // Sample duration in minutes
                sightings: this.sightings
            };
            axios.post(submit_checklist_url, data).then((response) => {
                if (response.data.status === 'success') {
                    alert("Checklist submitted successfully!");
                    this.sightings = [];
                }
            });
        }
    },
    mounted() {
        // Set default location coordinates; ideally, this should be set based on user interaction on the map
        this.latitude = 37.7749;
        this.longitude = -122.4194;
    }
};

// Initialize Vue app with the specified data and methods
app.vue = Vue.createApp(app.data).mount("#app");
