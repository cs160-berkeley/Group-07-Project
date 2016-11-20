import {
    CrossFade,
    Push,
    Flip,
    TimeTravel
} from 'transition';
import { BackArrow, ForwardArrow, Header, Footer } from "navigation";
import { priceScreen } from "price_breakdown";
import { calorieScreen, calorieDetailsScreen } from "calorie_breakdown";
import { itemSearchScreen, LocationCircle } from "item_search";
import KEYBOARD from './keyboard';
import Pins from "pins";

let remotePins;
let navHierarchy = ["1"]

/*** USER INPUT & DEVICE VARIABLES ***/
var deviceURL = "";
var userNum;
var userBudget;
var currentPrice = "$80.48";
var currentCalories = "280";


/**** DEVICE DETECTION HANDLERS ****/
Handler.bind("/discover", Behavior({
    onInvoke: function(handler, message){
    	trace("Device connected\n");
        deviceURL = JSON.parse(message.requestText).url;
    }
}));

Handler.bind("/forget", Behavior({
    onInvoke: function(handler, message){
        deviceURL = "";
    }
}));

/***** STYLES *****/
let h1style = new Style({ font: "bold 45px Open Sans", color: "#828282" });
let h2style = new Style({ font: "30px Open Sans", color: "#828282" });
let h3style = new Style({ font: "20px Open Sans", color: "#BDBDBD" });

/***** PICTURES, TEXTURES, AND SKINS *****/
let mainLogoImg = new Picture({ bottom: 0, width: 252, height: 261, url: "assets/mainLogo.png"});
let checkoutTexture = new Texture("assets/checkoutButton.png");
let checkoutSkin = new Skin({ width: 291, height: 47, texture: checkoutTexture, variants: 291 });
let whiteSkin = new Skin({fill: "white"});


/****** DATA ******/
// Hardwire Data For Now
let cartData = {
	items: [0, 1, 2, 3, 4, 5], // array of item ids; use itemInfo dictionary for more info
	location: "Unsure what to put here -- Caroline might know better"
}

// item id -> nutitional info
// add more info as needed
let itemInfo = {
	0: { name: "Banana", calories: 10, type: "Produce", subtype: "Fruit" },
	1: { name: "Chocolate Chip Cookies", calories: 150, type: "Sweets", subtype: "Cookies" },
	2: { name: "Whole Wheat Bread", calories: 128, type: "Grains", subtype: "Bread" },
	3: { name: "Ground Beef", calories: 155, type: "Meats", subtype: "Beef" },
	4: { name: "Apple", calories: 30, type: "Produce", subtype: "Fruit" },
	5: { name: "Milk", calories: 110, type: "Dairy", subtype: "Milk" },
}


let LoginScreen = Column.template($ => ({
	contents:[
		mainLogoImg,
		new Container({ left: 0, right: 0, top: 0, bottom: 0, skin: new Skin({ fill: "blue" }) })
	]
}));

let CostOverview = Container.template($ => ({
	left: 0, right: 0, top: 0, height: 265,
	contents: [
		new Label({ top: 0, bottom: 0, string: currentPrice, style: h1style }),
		new Label({ top: 50, bottom: 0, left: 75, right: 0, string: "/ " + userBudget, style: h3style })
	]
	
}));
let CalorieOverview = Column.template($ => ({
	left: 0, right: 0, top: 0, bottom: 20,
	contents: [
		new Label({ top: 10, string: currentCalories, style: h1style }),
		new Label({top: 0, string: "average calories", style: h2style }),
		new Label({top: 0, string: "per serving", style: h3style })
	]
	
}));



let CheckoutButton = Content.template($ => ({
	width: 291, height: 47, bottom: 125,  
	skin: checkoutSkin, variant: 0,
	active: true, 
	behavior: Behavior({
		onTouchBegan: function(button){
			button.variant = 1;
		},
		onTouchEnded: function(button){
			button.variant = 0;
			application.first.delegate("transitionToScreen", { to: "checkout" });
		}
	})
}));


let CheckoutScreen = Line.template($ => ({
	left: 0, right: 0, top: 0, bottom: 0, name: "checkout",
	contents: [new BackArrow({ left: 20, name: navHierarchy[0] })],
	
}));

let OverviewScreen = Column.template($ => ({
	left: 0, right: 0, top: 0, bottom: 0, active: true, name: "overview",
	contents: [	
		new CostOverview,
		new CalorieOverview,	
		new CheckoutButton
	],
}));



application.behavior = Behavior({
	onDisplayed(application) {
        application.discover("p3-device");
    },
    onQuit(application) {
        application.forget("p3-device");
    }, 
    onLaunch(application) {
        let discoveryInstance = Pins.discover(
            connectionDesc => {
                if (connectionDesc.name == "pins-share-alacarte") {
                    trace("Connecting to remote pins\n");
                    remotePins = Pins.connect(connectionDesc);
                    application.distribute("onListening");
                    remotePins.repeat("/cartData/read", 1000, result => {
          				trace("COMPANION: " + result + "\n");
			        }); 
                }
            }, 
            connectionDesc => {
                if (connectionDesc.name == "pins-share") {
                    trace("Disconnected from remote pins\n");
                    remotePins = undefined;
                }
            }
        );
    },
})

let CurrentScreen = Container.template($ => ({
	left: 0, right: 0, top: 70, bottom: 0, name: "currentScreen",
	contents: [$.screen]
}))

let AppContainer = Container.template($ => ({
	left: 0, right: 0, top: 0, bottom: 0, name: "appContainer",
	skin: whiteSkin, active: true,
	contents: [
		new CurrentScreen({ screen: $.screen }), 
		new Header({ string: $.header }), 

	],
	behavior: Behavior({
		transitionToScreen: function(container, params) {
			let toScreen;
	    	switch(params.to){
	    		case "cost":
	    			navHierarchy.unshift("3");
	    			toScreen = new AppContainer({ header: "Price Breakdown", screen: new priceScreen, itemInfo: itemInfo, cartData: cartData });
	    			toScreen.name = "cost";
	    			break;
	    		case "nutrition":
	    			navHierarchy.unshift("4");
	    			toScreen = new AppContainer({ header: "Calorie Breakdown", screen: new calorieScreen({itemInfo, cartData}) });
	    			break;
	    		case "nutritionDetails":
	    			navHierarchy.unshift("5");
		    		toScreen = new AppContainer({ header: params.type + " Breakdown", screen: new calorieDetailsScreen({itemInfo, cartData, type: params.type}), itemInfo: itemInfo, cartData: cartData });
		    		break;
	    		case "search":
	    			navHierarchy.unshift("6");
	    			toScreen = new AppContainer({ header: "Product Search", screen: new itemSearchScreen, itemInfo: itemInfo, cartData: cartData });
	    			break;
	    		case "checkout":
	    			navHierarchy.unshift("2");
	    			toScreen = new AppContainer({ header: "Checkout", screen: new CheckoutScreen, itemInfo: itemInfo, cartData: cartData });
	    			break;
	    		default: // Default is transition to OverviewScreen (triggered when pressing back button)
	    			navHierarchy.unshift("1");
	    			toScreen = new AppContainer({ header: "A La Carte", screen: new OverviewScreen, itemInfo: itemInfo, cartData: cartData });
	    	}	
	    	// Runs transition on AppContainer (which contains Header and CurrentScreen)
	    	var prevScreenNum = navHierarchy.pop();
	    	var currentScreenNum = navHierarchy[0];
	    	var pushDirection;
	    	//trace("CurrentScreen: " + currentScreenNum + "   PreviousScreen: " + prevScreenNum + "\n");
	    	currentScreenNum > prevScreenNum ? pushDirection = "left" : pushDirection = "right";
	    	container.run(new Push(), container.first, toScreen, { duration: 500, direction: pushDirection });
		}
	})
}))



application.add(new AppContainer({ header: "A La Carte", screen: new OverviewScreen }));
application.add(new Footer);
