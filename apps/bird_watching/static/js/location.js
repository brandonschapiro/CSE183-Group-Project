"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            // Complete as you see fit.
            my_value: 1, // This is an example.
            checklists: [],
            sightings: [],
            unique_sightings: [],
            top_contributors: [],
            selectedSpecies: '',
        };
    },
    methods: {
        // Complete as you see fit.
        my_function: function() {
            // This is an example.
            this.my_value += 1;
        },
        setSpecies: function(){
            console.log('new species selected')
        }
        
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    //this.checklists = this.checklistsData
    axios.get(get_region_information_url, {params: {lat1:lat1,lat2:lat2,long1:long1,long2:long2}}).then(function(r) {
        app.vue.checklists = r.data.checklists
        app.vue.sightings = r.data.sightings
        app.vue.unique_sightings = r.data.unique_sightings
        app.vue.top_contributors = r.data.top_contributors
    })
}

app.load_data();