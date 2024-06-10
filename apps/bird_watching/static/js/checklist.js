"use strict";

let app = {};

app.data = {
  data: function() {
    return {
      search: "",
      speciesList: [],
      checklists: [],
      selectedSpecies: [],
      lat: null,
      lng: null,
      checklistId: null  // checklistId to store the current checklist being edited
    };
  },
  computed: {
    filteredSpecies: function() {
      return this.speciesList.filter(species =>
        species.name.toLowerCase().includes(this.search.toLowerCase())
      );
    }
  },
  methods: {
    fetchSpecies: function() {
      axios.get(get_species_url).then(response => {
        this.speciesList = response.data.species.map(species => ({
          ...species,
          count: 0
        }));
      });
    },
    fetchChecklists: function() {
      axios.get(get_checklists_url).then(response => {
        this.checklists = response.data.checklists;
      });
    },
    fetchChecklist: function(checklistId) {
      axios.get(get_checklist_url, { params: { checklist_id: checklistId } }).then(response => {
        let checklist = response.data.checklist;
        let sightings = response.data.sightings;
        this.lat = checklist.latitude;
        this.lng = checklist.longitude;
        this.checklistId = checklist.id;
        sightings.forEach(sighting => {
          let species = this.speciesList.find(s => s.id === sighting.species_id);
          if (species) {
            species.count = sighting.species_count;
          }
        });
      });
    },
    incrementCount: function(species) {
      species.count += 1;
    },
    submitChecklist: function() {
      const checklistData = {
        latitude: this.lat,
        longitude: this.lng,
        species: this.speciesList.filter(species => species.count > 0),
        checklist_id: this.checklistId  // Include checklist_id for updates
      };
      axios.post(submit_checklist_url, checklistData).then(response => {
        this.fetchChecklists();
        this.speciesList.forEach(species => (species.count = 0));
      });
    },
    editChecklist: function(checklist) {
      window.location.href = `/bird_watching/checklist?checklist_id=${checklist.id}`;
    },
    deleteChecklist: function(checklistId) {
      axios.post(delete_checklist_url, { id: checklistId }).then(response => {
        this.fetchChecklists();
      });
    }
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    this.lat = urlParams.get("lat");
    this.lng = urlParams.get("lng");
    const checklistId = urlParams.get("checklist_id");
    if (checklistId) {
      this.fetchSpecies();
      this.fetchChecklist(checklistId);
    } else {
      this.fetchSpecies();
      this.fetchChecklists();
    }
  }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.init = function() {
  app.vue;
};

app.init();
