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
            monthLabels: [],
            monthCounts: [],
            chartData: [],
            svg: null,
            chart: null,
            lat1: window.lat1,
            lat2: window.lat2,
            lng1: window.lng1,
            lng2: window.lng2,
        };
    },
    computed:{
        
    },
    methods: {
        // Complete as you see fit.
        my_function: function() {
            // This is an example.
            this.my_value += 1;
        },
        setSpecies: function(){
            console.log('running')
            let dict = {}
            let unique_labels = new Set();
            for(let i = 0; i < this.sightings.length; i++){
                let key = this.sightings[i].date //.substring(0,7)
                if(this.sightings[i].species_id == this.selectedSpecies.id){
                    if(key in dict){
                        dict[key] += this.sightings[i].species_count
                    }
                    else{
                        dict[key] = this.sightings[i].species_count
                    }
                    unique_labels.add(key)
                }
            }
            console.log(unique_labels)
            console.log(dict)
            this.monthLabels = Array.from(unique_labels).sort((a, b) => {
                const [yearA, monthA, dayA] = a.split('-');
                const [yearB, monthB, dayB] = b.split('-');

                
                if (yearA !== yearB) {
                  return yearA - yearB;
                } else if (monthA !== monthB) {
                  return monthA - monthB;
                }
                else{
                    return dayA - dayB
                }
              });
              this.monthCounts = new Array()
              for(let i = 0; i < this.monthLabels.length; i++){
                this.monthCounts.push(dict[this.monthLabels[i]])
              }
            let chartData = []
            for(let i = 0; i < this.monthCounts.length; i++){
                chartData.push({'date':this.monthLabels[i],'count':this.monthCounts[i]})
            }
            this.chartData = chartData
            this.updateChart(chartData)
            console.log('done')
        },
        updateChart: function(chartData){
            console.log('updating chart')
            let chartLabels = []
            let data = []
            let label = this.selectedSpecies.name + ' seen'
            for(let i = 0; i < chartData.length; i++){
              chartLabels.push(chartData[i]['date'])
              data.push(chartData[i]['count'])
            }
            this.svg = document.getElementById('chart');
            if(this.chart){
              this.chart.destroy()
            }
            this.chart = new Chart(this.svg, {
              type: 'bar',
              data: {
                labels: chartLabels,
                datasets: [{
                  label: label,
                  data: data,
                  borderWidth: 1
                }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
      },
        
}
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(get_region_information_url, {params: {lat1:app.vue.lat1,lat2:app.vue.lat2,lng1:app.vue.lng1,lng2:app.vue.lng2}}).then(function(r) {
        app.vue.checklists = r.data.checklists
        app.vue.sightings = r.data.sightings
        app.vue.unique_sightings = r.data.unique_sightings
        app.vue.top_contributors = r.data.top_contributors
    })

}

app.load_data();