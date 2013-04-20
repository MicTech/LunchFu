sendNewOrder = function (email, restaurant, id) {
    var url = Meteor.absoluteUrl('order/' + id);
    var text = "Hi,\n\n" +
        "You can order your lunch: " +
        url +
        "\n\nBon apetit ...";

    Meteor.call('sendEmail',
        email,
        'web@lunchfu.cz',
        'Lunch invitation to ' + restaurant,
        text);
}

sendDiscardNotice = function (emails, id) {
    var url = Meteor.absoluteUrl('order/' + id);
    var text = "Hi,\n\n" +
        "Yor order was discarded :( " +
        url +
        "\n\nSorry ...";

    emails.forEach(function (email) {
    Meteor.call('sendEmail',
        email,
        'web@lunchfu.cz',
        'Lunch order discarded',
        text);
    });
}

sendCompleteNotice = function (emails, id) {
    var url = Meteor.absoluteUrl('order/' + id);
    var text = "Hi,\n\n" +
        "Yor order was completed and ordered in restaurant :) " +
        url +
        "\n\nPlease be patient ...";
    emails.forEach(function (email) {
        Meteor.call('sendEmail',
            email,
            'web@lunchfu.cz',
            'Lunch order completed',
            text);
    });
}