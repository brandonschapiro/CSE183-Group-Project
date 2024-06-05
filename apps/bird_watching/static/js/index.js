"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {    
    data: function() {
        return {
            my_value: 1,
            map: null,
            rectangle: null,
            points: [],
            search: '',
            species: [],
            speciesList: [],
            selectedSpecies: null,
            heatMap: null, 
            markers: []
        };
    },
    methods: {
        my_function: function() {
            this.my_value += 1;
        },
        click_listener: function(e) {
            console.log("clicked on map at", e.latlng);

            if (this.rectangle) {
                console.log("clear map")
                this.map.removeLayer(this.rectangle);
                this.rectangle = null; 
                this.points = []; 
            } 

            this.points.push(e);

            if (this.points.length == 2) {
                let bounds = [
                    [this.points[0].latlng.lat , this.points[0].latlng.lng],
                    [this.points[1].latlng.lat , this.points[1].latlng.lng],
                ];
                this.rectangle = L.rectangle(bounds, {color: "#ff7800", weight: 1});
                this.rectangle.addTo(this.map);
            }
        },
        clearPoints: function(e) {
            if (this.rectangle) {
                console.log("clear map")
                this.map.removeLayer(this.rectangle);
                this.rectangle = null; 
                this.points = []; 
            } else {
                console.log("rectangle is null");
            }
        },
        fetchSpecies: function() {
            axios.get(get_species_url).then((response) => {
                this.speciesList = response.data.species;
            });
        },
        selectSpecies: function(species) {
            this.selectedSpecies = species;
            this.search = species.name;
            this.species = [];
            console.log("selected ", species.name)
            axios.get(get_sightings_url, { params: { species_id: this.selectedSpecies ? this.selectedSpecies.id : null } }).then((response) => {
                this.updateMap(response.data.sightings);
                console.log("OK")
            });
        },
        filterSpecies: function() {
            // 
        },
        updateMap: function(sightings) {
            // Clear existing markers
            let birds = [];

            // Add new markers
            sightings.forEach(sighting => {
                console.log("hi", sighting);
                birds.push([sighting.checklist.latitude, sighting.checklist.longitude]); 
            });

            this.heatMap.setLatLngs(birds)
        },
        filteredSpecies: function() {
            return this.species.filter(item => item.name.toLowerCase().includes(this.search.toLowerCase()));
        }
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.init = () => {

    navigator.geolocation.getCurrentPosition((userPosition) => {
        console.log("User position", userPosition);

        app.vue.map = L.map('map').setView([userPosition.coords.latitude, userPosition.coords.longitude], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(app.vue.map);
    
        app.vue.map.on('click', app.vue.click_listener);
        app.vue.heatMap = L.heatLayer([], {radius: 25}).addTo(app.vue.map);
        console.log("heatMap", app.vue.heatMap)
        // Fetch initial data
        app.vue.fetchSpecies();
    })
};

app.init();
