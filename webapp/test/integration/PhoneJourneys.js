jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/App",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/Browser",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/Master",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/Detail",
	"CRUD_EXP/CRUD_Exp/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "CRUD_EXP.CRUD_Exp.view."
	});

	sap.ui.require([
		"CRUD_EXP/CRUD_Exp/test/integration/NavigationJourneyPhone",
		"CRUD_EXP/CRUD_Exp/test/integration/NotFoundJourneyPhone",
		"CRUD_EXP/CRUD_Exp/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});