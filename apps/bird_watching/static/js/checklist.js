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
      lng: null
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
    incrementCount: function(species) {
      species.count += 1;
    },
    submitChecklist: function() {
      const checklistData = {
        latitude: this.lat,
        longitude: this.lng,
        species: this.selectedSpecies.filter(species => species.count > 0)
      };
      axios.post(submit_checklist_url, checklistData).then(response => {
        this.fetchChecklists();
        this.selectedSpecies.forEach(species => (species.count = 0));
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
    this.fetchSpecies();
    this.fetchChecklists();
  }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.init = function() {
  app.vue;
};

app.init();
