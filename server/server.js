Meteor.methods({
    getNearbyPubs: function (loc) {
        return Pubs.find({loc: {$near: loc, $maxDistance:0.5}}).fetch();
    },
    sendEmail: function (to, from, subject, text) {
        // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();

        Email.send({
            to: to,
            from: from,
            subject: subject,
            text: text
        });
    }
});

if (Meteor.isServer) {
    Meteor.startup(function () {
        Pubs._ensureIndex({loc:'2d'});
        process.env.MAIL_URL="smtp://LunchFu:Ostrava2013@smtp.gmail.com:25/"
     });
}