let app = {};

app.data = {
    data: function() {
        return {
            my_value: 1,
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
            loaded: false,
        };
    },
    methods: {
        setSpecies: function() {
            let dict = {};
            let unique_labels = new Set();
            for (let i = 0; i < this.sightings.length; i++) {
                let key = this.sightings[i].date;
                if (this.sightings[i].species_id == this.selectedSpecies.id) {
                    if (key in dict) {
                        dict[key] += this.sightings[i].species_count;
                    } else {
                        dict[key] = this.sightings[i].species_count;
                    }
                    unique_labels.add(key);
                }
            }
            this.monthLabels = Array.from(unique_labels).sort((a, b) => {
                const [yearA, monthA, dayA] = a.split('-');
                const [yearB, monthB, dayB] = b.split('-');

                if (yearA !== yearB) {
                    return yearA - yearB;
                } else if (monthA !== monthB) {
                    return monthA - monthB;
                } else {
                    return dayA - dayB;
                }
            });
            this.monthCounts = this.monthLabels.map(label => dict[label] || 0);
            this.chartData = this.monthLabels.map((label, i) => ({
                date: label,
                count: this.monthCounts[i]
            }));
            this.updateChart(this.chartData);
        },
        updateChart: function(chartData) {
            let chartLabels = chartData.map(d => d.date);
            let data = chartData.map(d => d.count);
            let label = this.selectedSpecies.name + ' seen';
            this.svg = document.getElementById('chart');
            if (this.chart) {
                this.chart.destroy();
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
        }
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function() {
    axios.get(get_region_information_url, {
        params: {
            lat1: app.vue.lat1,
            lat2: app.vue.lat2,
            lng1: app.vue.lng1,
            lng2: app.vue.lng2
        }
    }).then(function(r) {
        app.vue.checklists = r.data.checklists;
        app.vue.sightings = r.data.sightings;
        app.vue.unique_sightings = r.data.unique_sightings;
        app.vue.top_contributors = r.data.top_contributors;
        app.vue.loaded = true;
    });
};

app.load_data();
