"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

function flatten(buffer) {
    // Flatten buffer
    let temp = [];
    
    for (let i = 0; i < buffer.length; i++) {
       temp.push(...buffer[i]);
    }

    return temp;
}

app.data = {
    data: function() {
        return {
            map: null,
            heatMap: null,
            rectangle: null,
            marker: null,
            bounds: null,
            checklist: null,
            loading: true,
            search: '',
            speciesList: [],
            selectedSpecies: [],
            buffer: [], // Array of arrays
        };
    },
    computed: {
        filteredSpecies: function() {
            return this.speciesList.filter((species) =>
              species.name.toLowerCase().includes(this.search.toLowerCase())
            );
        }
    },
    methods: {
        click_listener: function(e) {
            console.log("Clicked on map at", e.latlng);

            if (this.rectangle) {
                this.map.removeLayer(this.rectangle);
                this.rectangle = null;
            } else if (this.marker) {
                
                this.bounds = [
                    [this.marker._latlng.lat, this.marker._latlng.lng],
                    [e.latlng.lat, e.latlng.lng],
                ];

                this.rectangle = L.rectangle(this.bounds, {color: "#ff7800", weight: 1});
                this.rectangle.addTo(this.map);

                this.map.removeLayer(this.marker);
                this.marker = null;
            } else {
                this.marker = new L.Marker([e.latlng.lat, e.latlng.lng]);
                this.marker.addTo(this.map);
            }
        },
        clearSpecies: function() {
            console.log("clearSpecies");
            this.speciesList.push(...this.selectedSpecies);
            this.speciesList.sort(); 
            this.selectedSpecies = [];
            this.search = '';
            this.heatMap.setLatLngs([]);
            this.heatMap.redraw();
            this.fetchChecklist();
        },
        clearTools: function() {
            if (this.rectangle) {
                this.map.removeLayer(this.rectangle);
            }

            if (this.marker) {
                this.map.removeLayer(this.marker);
            }

            this.rectangle = null;
            this.marker = null;
        },
        fetchSpecies: function() {

            return axios.get(get_species_url).then((response) => {
                this.speciesList = response.data.species;
                this.speciesList.sort();
            });
        },
        fetchChecklist: function() {
            this.loading = true;

            if (this.checklist) {
                this.updateMap(this.checklist);
                this.loading = false;
            } else {
                return axios.get(get_sightings_url, {}).then((response) => {
                    console.log("fetchChecklist response: ", response);
                    this.checklist = response.data.sightings;
                    this.updateMap(response.data.sightings);
                });
            }
            
        },
        selectSpecies: function(species) {
            this.selectedSpecies.push(species);
            this.speciesList = this.speciesList.filter((s) => s.id !== species.id);
            this.search = ''; // Clear the search input
            console.log(species);

            this.loading = true;
            axios.get(get_sightings_url, { params: { species_id: species.id } }).then((response) => {
                console.log("selectSpecies response: ", response);
                this.buffer.push(response.data.sightings);
                this.updateMap(flatten(this.buffer));
                this.loading = false;
            });
        },
        deselectSpecies: function(species) {
            this.speciesList.push(species);
            console.log("species", species);
            const index = this.selectedSpecies.indexOf(species);
            console.log("index", index);
            this.selectedSpecies = this.selectedSpecies.filter((s) => s.id !== species.id);
            this.selectedSpecies.sort(); 
            this.buffer.splice(index, 1);
            this.updateMap(flatten(this.buffer));
        },
        updateMap: function(sightings) {
            let temp = [];
            sightings.forEach(sighting => {
                temp.push([sighting.checklist.latitude, sighting.checklist.longitude, sighting.sighting.species_count]);
            });
            this.heatMap.setLatLngs(temp);
            this.heatMap.redraw();
        },
        goToChecklist: function() {
            if (this.marker != null) {
                window.location.href = `/bird_watching/checklist?lat=${this.marker._latlng.lat}&lng=${this.marker._latlng.lng}`;
            }
        },
        goToRegion: function() {
            if (this.rectangle != null) {
                window.location.href = `/bird_watching/location?lat1=${this.bounds[0][0]}&lng1=${this.bounds[0][1]}&lat2=${this.bounds[1][0]}&lng2=${this.bounds[1][1]}`;
            }
        },
        goToSightings: function() {
            window.location.href = '/bird_watching/statistics';
        },
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.init = () => {
    navigator.geolocation.getCurrentPosition((userPosition) => {
        console.log("User position", userPosition);

        app.vue.map = L.map('map').setView([userPosition.coords.latitude, userPosition.coords.longitude], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(app.vue.map);
    
        app.vue.map.on('click', app.vue.click_listener);
        app.vue.heatMap = L.heatLayer([], { radius: 25 }).addTo(app.vue.map);
        // Fetch initial data
        app.vue.loading = true;
        app.vue.fetchSpecies()
            .then(() => app.vue.fetchChecklist())
            .finally(() => {
                // Hide the loading icon
                console.log("species and checklist loaded");
                app.vue.loading = false;
            });
    });
};

app.init();
