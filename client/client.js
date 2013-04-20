Meteor.Router.add({
    '/': 'createNewOrder',

    '/order/:id': function (id) {
        Session.set('orderId', id);

        return 'order';
    },

    '*': 'not_found'
});

function foundLocation(location) {
    var loc = {lat: location.coords.latitude, lon: location.coords.longitude };
    console.log(loc);
    Session.set('loc', loc);
}

function noLocation() {
    console.log("no location");
}

function loadNearbyPubs(loc) {
    Meteor.call('getNearbyPubs', loc, function (error, result) {
        if (error) {
            console.log(error);
            return;
        }

        setAutoComplete(result);

        Session.set('nearbyPubs', result);
    });
}

function setAutoComplete(nearbyPubs) {
    var restaurantNameInput = $('#restaurantName');
    var restaurantUrlInput = $('#restaurantUrl');

    autoCompleteList =  _(nearbyPubs).pluck("restaurantName");
    restaurantNameInput.typeahead({source: autoCompleteList});

    restaurantNameInput.change(function(e) {
        var name = $(e.target).val();

        var pub = _.find(nearbyPubs, function(p) {
            return p.restaurantName == name;
        });

        if(pub) {
            restaurantUrlInput.val(pub.restaurantUrl);
        }
    });
}

Template.createNewOrder.nearbyPubs = function () {
    var loc = Session.get('loc');
    if (Modernizr.geolocation) {
        if (loc) {
            loadNearbyPubs(loc);
        } else {
            navigator.geolocation.getCurrentPosition(foundLocation, noLocation);
        }
    }
    return Session.get('nearbyPubs');
};

Template.createNewOrder.events({
    "click #startOrdering": function (evnt, template) {
        var hashCode = Random.id();
        var restaurantName = template.find('#restaurantName').value;
        var restaurantUrl = template.find('#restaurantUrl').value;
        var endTime = template.find('#endTime').value;
        var emailGroup = template.find('#emailGroup').value;

        var id = Orders.insert({
            hashCode: hashCode,
            restaurantName: restaurantName,
            restaurantUrl: restaurantUrl,
            state: 'active',
            endTime: endTime,
            emailGroup: emailGroup,
            meals: []
        });

        var loc = Session.get('loc');
        if (loc)
            Pubs.insert({ restaurantName: restaurantName, restaurantUrl: restaurantUrl, loc: loc });

        Session.set('orderId', id);
        amplify.store(getOwnerParameterName(), true);
        sendNewOrder(emailGroup, restaurantName, id);

        Meteor.Router.to('/order/' + id);
    },
    'click .selectPub' : function(evnt, template) {
        evnt.preventDefault();
        var pub = Spark.getDataContext(evnt.target);
        if(!pub) return;
        template.find('#restaurantName').value = pub.restaurantName;
        template.find('#restaurantUrl').value = pub.restaurantUrl;
    }
});

Template.order.isOwner = function () {
    var isOwner = amplify.store(getOwnerParameterName());
    return  isOwner;
}

Template.order.order = function () {
    var mealId = amplify.store(getMealIdName());
    var order = Orders.findOne(Session.get('orderId'));

    if (!order) return;

    Session.set('state', order.state);

    var filteredOrders = _.groupBy(order.meals, 'meal');

    var keys = _.keys(filteredOrders);

    var groupedOrders = _.map(keys, function (mealName) {
        var meals = filteredOrders[mealName];
        var emails = meals.map(function (it) {
            return {email: it.email, emailHash: CryptoJS.MD5(it.email.trim().toLowerCase())};
        });

        return {mealName: mealName, count: meals.length, emails: emails};
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

Template.order.isDiscarded = function () {
    return Session.get('state')=='discard';
}

Template.order.isCompleted = function () {
    return Session.get('state')=='complete';
}

Template.order.isActive = function () {
    console.log("State:"+Session.get('state'));
    return Session.get('state')=='active';
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
    },
    'click #complete': function (evnt, template) {
        updateState('complete');
        sendNotification();
    },
    'click #discard': function (evnt, template) {
        updateState('discard');
        sendNotification();
    }
})

function getMealIdName() {
    return Session.get('orderId') + '_mealId';
}

function getOwnerParameterName() {
    return Session.get('orderId') + '_owner';
}


function addMeal(email, meal) {
    var mealId = Random.id();
    var id = Session.get('orderId');
    Orders.update({ _id: id }, {$push: {meals: {id: mealId, email: email, meal: meal}}});
    Session.set('mealId', mealId);

    amplify.store(getMealIdName(), mealId);
}

function updateState(state) {
    var id = Session.get('orderId');
    Orders.update({ _id: id }, {$set: {state: state}});
    Session.set('state', state);
}

function sendNotification() {
    var orderId = Session.get('orderId');
    var order = Orders.findOne(orderId);
    var emails = _.map(order.meals, function (meal) {
        return meal.email;
    });

    if(order.state=='complete'){
        sendCompleteNotice(emails, orderId);
    }

    if(order.state=='discard'){
        sendDiscardNotice(emails, orderId);
    }
}
