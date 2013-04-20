Meteor.Router.add({
    '/':'createNewOrder',

    '/order/:id': function(id) {

        Session.set('orderId', id);

        return 'order';
    },

    '*': 'not_found'
});

Template.createNewOrder.events({"click #startOrdering":function(evnt, template){
    var hashCode = Random.id();
    var restaurantUrl = template.find('#restaurantUrl').value;
    var endTime = template.find('#endTime').value;
    var emailGroup = template.find('#emailGroup').value;

    var id = Orders.insert({hashCode: hashCode, restaurantUrl: restaurantUrl, endTime: endTime, emailGroup: emailGroup});

    Meteor.Router.to('/order/' + id)
}});

Template.order.order = function() {
    return Orders.findOne(Session.get('orderId'));
};