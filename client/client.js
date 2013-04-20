Meteor.Router.add({
    '/': 'createNewOrder',

    '/order/:id': function (id) {
        Session.set('orderId', id);

        return 'order';
    },

    '*': 'not_found'
});

Template.createNewOrder.events({"click #startOrdering": function (evnt, template) {
    var hashCode = Random.id();
    var restaurantUrl = template.find('#restaurantUrl').value;
    var endTime = template.find('#endTime').value;
    var emailGroup = template.find('#emailGroup').value;

    var id = Orders.insert({
        hashCode: hashCode,
        restaurantUrl: restaurantUrl,
        endTime: endTime,
        emailGroup: emailGroup,
        meals: []
    });

    Meteor.Router.to('/order/' + id)
}});

Template.order.order = function () {
    var mealId = amplify.store(getMealIdName());
    var order = Orders.findOne(Session.get('orderId'));

    if (!order) return;

    var filteredOrders = _.groupBy(order.meals, 'meal');

    var keys = _.keys(filteredOrders);

    var groupedOrders = _.map(keys, function (mealName) {
        var meals = filteredOrders[mealName];
        var emails = meals.map(function(it) {
            return {email: it.email, emailHash: CryptoJS.MD5(it.email.trim().toLowerCase())};
        });

        return {mealName: mealName, count: meals.length, emails:emails};
    });

    var myOrder = order.meals.filter(function (it) {
        return it.id == mealId;
    });

    return {order: order, groupedOrders: groupedOrders, myOrder: myOrder.length == 0 ? null : myOrder[0]};
};

Template.order.defaultEmail = function () {
    return amplify.store("email");
}

Template.order.canOrderMeal = function () {
    return amplify.store(getMealIdName()) == undefined;
}


Template.order.events({
    'click #confirm': function (evnt, template) {

        var email = template.find('#email').value;
        var meal = template.find('#meal').value;

        amplify.store("email", email);

        addMeal(email, meal);
    },
    'click #remove': function (evnt, template) {
        var mealId = amplify.store(getMealIdName());
        var id = Session.get('orderId');
        Orders.update({ _id: id }, {$pull: {meals: {id: mealId}}});
        amplify.store(getMealIdName(), null);
    },
    'click .orderSame': function (evnt, template) {
        var meal = Spark.getDataContext(evnt.target);
        var email = amplify.store("email");

        template.find('#meal').value = meal.mealName;
    }
})

function getMealIdName() {
    return Session.get('orderId') + '_mealId';
}

function addMeal(email, meal) {
    var mealId = Random.id();
    var id = Session.get('orderId');
    Orders.update({ _id: id }, {$push: {meals: {id: mealId, email: email, meal: meal}}});
    Session.set('mealId', mealId);

    amplify.store(getMealIdName(), mealId);
}
