var harvest = require('harvesterjs');
var RSVP = require('rsvp');
var ElasticHarvest = require('../elastic-harvester');

function createApp(options) {
    var harvestApp = harvest(options)

        .resource('person', {
            name: String,
            appearances: Number,
            pets: ['pet'],
            soulmate: {ref: 'person', inverse: 'soulmate'},
            lovers: [{ref: 'person', inverse: 'lovers'}]
        })

        .resource('pet', {
            name: String,
            appearances: Number,
            toys:['toy'],
            friends:['pet']
        })

        .resource('toy', {
            name: String
        });


    var peopleSearch = new ElasticHarvest(harvestApp, options.es_url,options.es_index, "people");
    var indexReadyPromise = peopleSearch.deleteIndex().then(function(){
        return peopleSearch.initializeMapping(require("./test.mapping.js")).then(function(response){
            console.log('Initializing ES mapping: ' + JSON.stringify(response));
        });
    });


    harvestApp.router.get('/people/search', peopleSearch.route);

    harvestApp.onRouteCreated('person').then(function(harvestRoute){
        peopleSearch.setHarvestRoute(harvestRoute);
    });
    peopleSearch.enableAutoSync("person");

    return RSVP.all([
        harvestApp.onRouteCreated('pet'),
        harvestApp.onRouteCreated('person'),
        indexReadyPromise
    ])
        .then(function () {
            harvestApp.listen(process.env.PORT);
            return harvestApp;
        });
}





module.exports = createApp;
