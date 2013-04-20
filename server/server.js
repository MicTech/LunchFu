Meteor.methods({
    getNearbyPubs: function (loc) {
        return Pubs.find({loc: {$near: loc, $maxDistance:0.5}}).fetch();
    }
});

if (Meteor.isServer) {
    Meteor.startup(function () {
        Pubs._ensureIndex({loc:'2d'});
     });
}