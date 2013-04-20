Meteor.methods({
    getNearbyPubs: function (loc) {
        return Pubs.find({loc: {$near: loc, $maxDistance:0.5}}).fetch();
    }
});