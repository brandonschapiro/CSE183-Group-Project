"use strict";

let app = {};

app.data = {
    data: function() {
        return {
            searchTerm: '',
            speciesResults: [],
            sightings: []
        };
    },
    methods: {
        searchSpecies: _.debounce(function() {
            axios.get(get_species_url, { params: { term: this.searchTerm }}).then((response) => {
                this.speciesResults = response.data.species;
            });
        }, 300),
        addSpecies: function(species) {
            this.sightings.push({
                id: species.id,
                name: species.name,
                species_count: 1
            });
            this.speciesResults = [];
            this.searchTerm = '';
        },
        removeSpecies: function(index) {
            this.sightings.splice(index, 1);
        },
        submitChecklist: function() {
            let data = {
                latitude: 37.7749,  // Sample latitude
                longitude: -122.4194,  // Sample longitude
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
    }
};

app.vue = Vue.createApp(app.data).mount("#app");
