Meteor.methods({
    getNearbyPubs: function (loc) {
        return Pubs.find({loc: {$near: loc}}).fetch();
    }
});