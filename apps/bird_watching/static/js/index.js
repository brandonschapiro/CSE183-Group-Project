"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {    
    data: function() {
        return {
            map: null,
            heatMap: null,  
            rectangle: null,
            search: '',
            marker: null,
            speciesList: [],
            sightings: new Map(), 
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
                this.map.removeLayer(this.marker); 
                this.marker = null;
                
                // let bounds = [
                //     [this.points[0].latlng.lat , this.points[0].latlng.lng],
                //     [this.points[1].latlng.lat , this.points[1].latlng.lng],
                // ];

                // this.rectangle = L.rectangle(bounds, {color: "#ff7800", weight: 1});
                // this.rectangle.addTo(this.map);
            } else {
                this.marker = new L.Marker([e.latlng.lat, e.latlng.lng]);
                console.log(this.marker); 
            }
        },
        clearSpecies: function() {
            this.speciesList.push(...this.selectedSpecies); 
            this.selectedSpecies = []; 
            this.search = '';
            // this.filterSpecies = []; 
            // this.heatMap.setLatLngs([]); 
            // this.heatMap.redraw(); 
        },
        fetchSpecies: function() {
            axios.get(get_species_url).then((response) => {
                this.speciesList = response.data.species;
            });
        },
        clearPoints: function() {

        },
        fetchChecklist: function() {
            axios.get(get_sightings_url, {}).then((response) => {
                console.log("fetchChecklist response: ", response); 
                this.updateMap(response.data.sightings); 
            });
        }, 
        // selectSpecies: function(species) {
        //     this.search = species.name;
        //     console.log("selected ", species.name)
        //     this.filteredSpecies.push(species); 
            
        //     // axios.get(get_sightings_url, { params: { species_id: species ? species.id : null } }).then((response) => {
            
        //     //     this.updateMap();
        //     // });
        // },
        selectSpecies(species) {
            if (!this.selectedSpecies.includes(species)) {
              this.selectedSpecies.push(species);
              this.speciesList = this.speciesList.filter((s) => s.id !== species.id);
              this.search = ''; // Clear the search input
            }
          },
        deselectSpecies(species) {
            this.selectedSpecies = this.selectedSpecies.filter((s) => s.id !== species.id);
            this.speciesList.push(species);
        },
        filterSpecies: function() {
            // 
        }, 
        updateMap: function() { 

            console.log("start updateMap"); 
            let birds = []; 

            // // this.sightingsBuffer.forEach(sightings => {
            // //      // Add new markers
            // //     sightings.forEach(sighting => {
            // //         birds.push([sighting.checklist.latitude, sighting.checklist.longitude, sighting.sighting.species_count]); 
            // //     });
            // // });

            // this.heatMap.setLatLngs(birds)

            console.log("end updateMap");
        },
        goToChecklist: function() {
            window.location.href = '/bird_watching/checklist'; 
        },
        statsOnRegion: function() {
            if (this.rectangle == null) {return}
            const url = `/bird_watching/location?lat1=${this.points[0].latlng.lat}&long1=${this.points[0].latlng.lng}&lat2=${this.points[1].latlng.lat}&long2=${this.points[1].latlng.lng}`;
            window.location.href = url;
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
