"use strict";

let app = {};

app.data = {
    data() {
        return {
            searchTerm: '',
            speciesResults: [],
            sightings: [],
            latitude: null,
            longitude: null
        };
    },
    methods: {
        searchSpecies: _.debounce(function() {
            axios.get(get_species_url, { params: { term: this.searchTerm }}).then((response) => {
                this.speciesResults = response.data.species;
            });
        }, 300),
        addSpecies(species) {
            this.sightings.push({
                id: species.id,
                name: species.name,
                species_count: 1
            });
            this.speciesResults = [];
            this.searchTerm = '';
        },
        removeSpecies(index) {
            this.sightings.splice(index, 1);
        },
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
        // This should be set based on user interaction on the map
        this.latitude = 37.7749;
        this.longitude = -122.4194;
    }
};

app.vue = Vue.createApp(app.data).mount("#app");
