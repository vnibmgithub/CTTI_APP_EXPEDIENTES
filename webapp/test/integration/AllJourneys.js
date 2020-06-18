jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 ExpedientSet in the list
// * All 3 ExpedientSet have at least one ExpToLot

sap.ui.require([
	"sap/ui/test/Opa5",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/App",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/Browser",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/Master",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/Detail",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/Create",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "CRUD_EXP.CRUD_Exp.view."
	});

	sap.ui.require([
		"CRUD_EXP/CRUD_Exp/test/integration/MasterJourney",
		"CRUD_EXP/CRUD_Exp/test/integration/NavigationJourney",
		"CRUD_EXP/CRUD_Exp/test/integration/NotFoundJourney",
		"CRUD_EXP/CRUD_Exp/test/integration/BusyJourney",
		"CRUD_EXP/CRUD_Exp/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});