function initModel() {
	var sUrl = "/sap/opu/odata/sap/ZD_EXP_CONTR_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}