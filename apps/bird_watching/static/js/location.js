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
        };
    },
    methods: {
        // Complete as you see fit.
        my_function: function() {
            // This is an example.
            this.my_value += 1;
        },
        update_chart: function(newData){
            xScale.domain(d3.extent(newData, d => new Date(d.date)));
            yScale.domain([0, d3.max(newData, d => d.value)]);
        
            // Update the line path
            svg.selectAll('.line')
              .datum(newData)
              .attr('d', line);
        
            // Update the axes
            svg.selectAll('.x-axis')
              .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%Y-%m-%d')));
            svg.selectAll('.y-axis')
              .call(d3.axisLeft(yScale));
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
            this.chartData = []
            for(let i = 0; i < this.monthCounts.length; i++){
                this.chartData.push({'date':this.monthLabels[i],'count':this.monthCounts[i]})
            }
            //this.createChart(this.chartData)
            console.log('done')
        },
        createChart: function(data) {
            const margin = { top: 20, right: 20, bottom: 30, left: 50 };
            const width = 600 - margin.left - margin.right;
            const height = 400 - margin.top - margin.bottom;
          
            this.svg = d3.select('#chart-container')
              .append('svg')
              .attr('width', width + margin.left + margin.right)
              .attr('height', height + margin.top + margin.bottom)
              .append('g')
              .attr('transform', `translate(${margin.left}, ${margin.top})`);
          
            const xScale = d3.scaleLinear()
              .domain(d3.extent(data, d => new Date(d.date)))
              .range([0, width]);
          
            const yScale = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.count)])
              .range([height, 0]);
          
            const line = d3.line()
              .x(d => xScale(new Date(d.date)))
              .y(d => yScale(d.y));
          
              this.svg.append('path')
              .datum(data)
              .attr('fill', 'none')
              .attr('stroke', 'steelblue')
              .attr('stroke-width', 2)
              .attr('d', line);
          
              this.svg.append('g')
              .attr('transform', `translate(0, ${height})`)
              .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%Y-%m-%d')));
          
              this.svg.append('g')
              .call(d3.axisLeft(yScale));
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