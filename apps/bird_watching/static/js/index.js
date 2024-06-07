"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

function flatten(buffer) {
    // flatten buffer 
    let temp = [] 
    
    for (let i = 0; i < buffer.length; i++) {
       temp.push(...buffer[i])
    }

    return temp; 
}

app.data = {    
    data: function() {
        return {
            map: null,
            heatMap: null,  
            rectangle: null,
            search: '',
            marker: null,
            speciesList: [],
            buffer: [], // array of arrays,  
            selectedSpecies: [],
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
            console.log("clicked on map at", e.latlng);

            if (this.rectangle) {
                this.map.removeLayer(this.rectangle);
                this.rectangle = null; 
            } else if (this.marker) {
                
                let bounds = [
                    [this.marker._latlng.lat , this.marker._latlng.lng],
                    [e.latlng.lat , e.latlng.lng],
                ];

                this.rectangle = L.rectangle(bounds, {color: "#ff7800", weight: 1});
                this.rectangle.addTo(this.map);

                this.map.removeLayer(this.marker); 
                this.marker = null;
            } else {
                this.marker = new L.Marker([e.latlng.lat, e.latlng.lng]);
                this.marker.addTo(this.map);
            }
        },
        clearSpecies: function() {
            console.log("clearSpecies")
            this.speciesList.push(...this.selectedSpecies); 
            this.selectedSpecies = []; 
            this.search = '';
            this.heatMap.setLatLngs([]); 
            this.heatMap.redraw(); 
            this.fetchChecklist(); 
        },
        clearTools: function() { 
            if(this.rectangle) {
                this.map.removeLayer(this.rectangle)
            }

            if(this.marker) {
                this.map.removeLayer(this.marker); 
            }

            this.rectangle = null; 
            this.marker = null;
        },
        fetchSpecies: function() {
            axios.get(get_species_url).then((response) => {
                this.speciesList = response.data.species;
            });
        },
        fetchChecklist: function() {
            axios.get(get_sightings_url, {}).then((response) => {
                console.log("fetchChecklist response: ", response); 
                this.updateMap(response.data.sightings); 
            });
        }, 
        selectSpecies(species) {
            this.selectedSpecies.push(species);
            this.speciesList = this.speciesList.filter((s) => s.id !== species.id);
            this.search = ''; // Clear the search input
            console.log(species);
            axios.get(get_sightings_url, { species_id: species.id}).then((response) => {

                console.log("selectSpecies response: ", response); 
                this.buffer.push(response.data.sightings); // 

                this.updateMap(flatten(this.buffer)); 
            });
          },
        deselectSpecies(species) {
            this.speciesList.push(species);
            console.log("species", species)
            const index = this.selectedSpecies.indexOf(species); 
            console.log("index", index)
            this.selectedSpecies = this.selectedSpecies.filter((s) => s.id !== species.id);
            this.buffer.splice(index, 0);
            this.selectedSpecies.splice(index, 0); 
            this.updateMap(this.buffer);
        },
        updateMap: function(sightings) { 
            let temp = []; 
            sightings.forEach(sighting => {
                temp.push([sighting.checklist.latitude, sighting.checklist.longitude, sighting.sighting.species_count])
            });
            this.heatMap.setLatLngs(temp); 
            this.heatMap.redraw();
        },
        goToChecklist: function() {
            if (this.marker != null) {
                window.location.href = `/bird_watching/checklist?lat=${this.marker._latlng.lat}&lng=${this.marker._latlng.lng}`; 
            }
        },
        statsOnRegion: function() {
            if (this.rectangle == null) {
                window.location.href = `/bird_watching/location?lat1=${this.points[0].latlng.lat}&lng1=${this.points[0].latlng.lng}&lat2=${this.points[1].latlng.lat}&lng2=${this.points[1].latlng.lng}`;
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
        app.vue.heatMap = L.heatLayer([], {radius: 25}).addTo(app.vue.map);
        // Fetch initial data
        app.vue.fetchSpecies();
        app.vue.fetchChecklist();
    })
};

app.init();
