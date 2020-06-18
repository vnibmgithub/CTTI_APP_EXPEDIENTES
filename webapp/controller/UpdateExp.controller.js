var aFilter = [];

sap.ui.define([
	"CRUD_EXP/CRUD_Exp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/Device"
], function (BaseController, JSONModel, MessageBox, Fragment, Device) {
	"use strict";
	return BaseController.extend("CRUD_EXP.CRUD_Exp.controller.UpdateExp", {
		_oBinding: {},
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onInit: function () {
			var that = this;
			this.getRouter().getTargets().getTarget("UpdateExp").attachDisplay(null, this._onDisplay, this);
			this._oODataModel = this.getOwnerComponent().getModel();
			this._oResourceBundle = this.getResourceBundle();
			this._oViewModel = new JSONModel({
				enableCreate: false,
				delay: 0,
				busy: false,
				mode: "create",
				viewTitle: ""
			});
			
			this.setModel(this._oViewModel, "viewModel");
			
			// Register the view with the message manager
			sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);
			var oMessagesModel = sap.ui.getCore().getMessageManager().getMessageModel();
			this._oBinding = new sap.ui.model.Binding(oMessagesModel, "/", oMessagesModel.getContext("/"));
			this._oBinding.attachChange(function (oEvent) {
				var aMessages = oEvent.getSource().getModel().getData();
				for (var i = 0; i < aMessages.length; i++) {
					if (aMessages[i].type === "Error" && !aMessages[i].technical) {
						that._oViewModel.setProperty("/enableCreate", false);
					}
				}
			});
			if (oMandt === "100") {
				var oObject = this.getView().byId("Tipexp_id");
				oObject.setVisible(false);
				var oObject2 = this.getView().byId("CentreText");
				oObject2.setVisible(false);
			}
		},
		
		onAfterRendering: function () {
			var oSaveAction = this.getView().byId("edit");
			var oButton = oSaveAction.getAggregation("_control");
			oButton.setText("Editar");
			var oSaveAction = this.getView().byId("save");
			var oButton = oSaveAction.getAggregation("_control");
			oButton.setText("Guardar");
			var oCancelAction = this.getView().byId("cancel");
			var oButton = oCancelAction.getAggregation("_control");
			oButton.setText("Cancel\xB7lar");
		},
		
		onSave: function () {
			var that = this,
				oModel = this.getModel();
			// abort if the  model has not been changed
			if (!oModel.hasPendingChanges()) {
				MessageBox.information(this._oResourceBundle.getText("noChangesMessage"), {
					id: "noChangesInfoMessageBox",
					styleClass: that.getOwnerComponent().getContentDensityClass()
				});
				return;
			}
			this.getModel("appView").setProperty("/busy", true);
			if (this._oViewModel.getProperty("/mode") === "edit") {
				// attach to the request completed event of the batch
				oModel.attachEventOnce("batchRequestCompleted", function (oEvent) {
					if (that._checkIfBatchRequestSucceeded(oEvent)) {
						that._fnUpdateSuccess();
					} else {
						that._fnEntityCreationFailed();
						MessageBox.error(that._oResourceBundle.getText("updateError"));
					}
				});
			}
			oModel.submitChanges();
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("UpdateExp", "changeApp");
			sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});
		},
		
		_checkIfBatchRequestSucceeded: function (oEvent) {
			var oParams = oEvent.getParameters();
			var aRequests = oEvent.getParameters().requests;
			var oRequest;
			if (oParams.success) {
				if (aRequests) {
					for (var i = 0; i < aRequests.length; i++) {
						oRequest = oEvent.getParameters().requests[i];
						if (!oRequest.success) {
							return false;
						}
					}
				}
				return true;
			} else {
				return false;
			}
		},
		
		onCancel: function () {
			// check if the model has been changed
			if (this._oViewModel.getProperty("/mode") === "display") {
				this.getModel().resetChanges();
			}
			if (this.getModel().hasPendingChanges()) {
				// get user confirmation first
				this._showConfirmQuitChanges(this._oViewModel); // some other thing here....
			} else {
				this.getModel("appView").setProperty("/addEnabled", true);
				// cancel without confirmation
				if (this._oViewModel.getProperty("/mode") === "edit") {
					this._oViewModel.setProperty("/mode", "display");
					this._oViewModel.setProperty("/enableDel", "None");
				} else {
					//this._navBack();
					this.getView().unbindObject();
					var oEventBus = sap.ui.getCore().getEventBus();
					oEventBus.publish("UpdateExp", "changeApp");
					sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});
				}
			}
		},
		
		_navBack: function () {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();
			this.getView().unbindObject();
			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				this.getRouter().getTargets().display("object");
			}
		},
		
		_showConfirmQuitChanges: function (oViMo) {
			var oComponent = this.getOwnerComponent(),
				oModel = this.getModel();
			var that = this;
			MessageBox.confirm(this._oResourceBundle.getText("confirmCancelMessage"), {
				styleClass: oComponent.getContentDensityClass(),
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						that.getModel("appView").setProperty("/addEnabled", true);
						oModel.resetChanges();
						if (oViMo.getProperty("/mode") === "edit") {
							oViMo.setProperty("/mode", "display");
							oViMo.setProperty("/enableDel", "None");
						} else {
							that._navBack();
							var oEventBus = sap.ui.getCore().getEventBus();
							oEventBus.publish("UpdateExp", "changeApp");
							sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});
						}
					}
				}
			});
		},
		
		_onDisplay: function (oEvent) {
			var oData = oEvent.getParameter("data"),
				oView = this.getView();
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("editViewTitle"));
			var sObjectPath = oView.getElementBinding();
			if (sObjectPath !== oData.objectPath) {
				this._oViewModel.setProperty("/mode", "display");
				this._oViewModel.setProperty("/enableDel", "None");
				oView.bindElement({
					path: oData.objectPath
				});
			}
			var oObject = oView.getModel().getObject(oData.objectPath);

			var oBasat = this.getView().byId("AcordMarcaRel"); oBasat.setVisible(true);
			var oClaEmp = this.getView().byId("Clasempr_id"); oClaEmp.setVisible(true);
			var oDatApr = this.getView().byId("Dataprov_id"); oDatApr.setVisible(true);
			var oDatIni = this.getView().byId("Datinici_id"); oDatIni.setVisible(true);
			var oDatInv = this.getView().byId("Datinvit_id"); oDatInv.setVisible(true);
			var oDatosoba = this.getView().byId("Datosoba_id"); oDatosoba.setVisible(true);
			var oDatosobe = this.getView().byId("Datosobe_id"); oDatosobe.setVisible(true);
			var oDatosobt = this.getView().byId("Datosobt_id"); oDatosobt.setVisible(true);
			var oDpadboe = this.getView().byId("Dpadboe_id"); oDpadboe.setVisible(true);
			var oDpaddogc = this.getView().byId("Dpaddogc_id"); oDpaddogc.setVisible(true);
			var oDpaddoue = this.getView().byId("Dpaddoue_id"); oDpaddoue.setVisible(true);
			var oDpliboe = this.getView().byId("Dpliboe_id"); oDpliboe.setVisible(true);
			var oDplidogc = this.getView().byId("Dplidogc_id"); oDplidogc.setVisible(true);
			var oDplidoue = this.getView().byId("Dplidoue_id"); oDplidoue.setVisible(true);
			var oFormTab = this.getView().byId("FormTab_id"); oFormTab.setVisible(true);
			var oHorosoba = this.getView().byId("Horosoba"); oHorosoba.setVisible(true);
			var oHorosobe = this.getView().byId("Horosobe"); oHorosobe.setVisible(true);
			var oHorosobt = this.getView().byId("Horosobt"); oHorosobt.setVisible(true);
			var oImpliboe = this.getView().byId("Impliboe_id"); oImpliboe.setVisible(true);
			var oImplidogc = this.getView().byId("Implidogc_id"); oImplidogc.setVisible(true);
			var oLloosobe = this.getView().byId("Lloosobe_id"); oLloosobe.setVisible(true);
			var oLloosobt = this.getView().byId("Lloosobt_id"); oLloosobt.setVisible(true);
			var oNumInv = this.getView().byId("Numinvit_id"); oNumInv.setVisible(true);
			var oSimpl = this.getView().byId("Simplifi_id"); oSimpl.setVisible(true);
			var oSimplA = this.getView().byId("Simpabre_id"); oSimplA.setVisible(true);
			var oTabMeses = this.getView().byId("tabMeses_id"); oTabMeses.setVisible(true);
			var oTipTra = this.getView().byId("Tiptrami"); oTipTra.setVisible(true);
			
			switch(oObject.Procedim) {
				case "DA": // Derivat acord marc
					oNumInv.setVisible(false);
					oSimpl.setVisible(false);
					oSimplA.setVisible(false);
					break;
				case "M":  // Menor
					oBasat.setVisible(false);
					oClaEmp.setVisible(false);
					oDatApr.setVisible(false);
					oDatIni.setVisible(false);
					oDatInv.setVisible(false);
					oDatosoba.setVisible(false);
					oDatosobe.setVisible(false);
					oDatosobt.setVisible(false);
					oDpadboe.setVisible(false);
					oDpaddogc.setVisible(false);
					oDpaddoue.setVisible(false);
					oDpliboe.setVisible(false);
					oDplidogc.setVisible(false);
					oDplidoue.setVisible(false);
					oFormTab.setVisible(false);
					oHorosoba.setVisible(false);
					oHorosobe.setVisible(false);
					oHorosobt.setVisible(false);
					oImpliboe.setVisible(false);
					oImplidogc.setVisible(false);
					oLloosobe.setVisible(false);
					oLloosobt.setVisible(false);
					oNumInv.setVisible(false);
					oSimpl.setVisible(false);
					oSimplA.setVisible(false);
					oTabMeses.setVisible(false);
					oTipTra.setVisible(false);
					break;
				case "NS": // Negociat sense publicitat
					oBasat.setVisible(false);
					oSimpl.setVisible(false);
					oSimplA.setVisible(false);
					break;
				case "O": // Obert
					oBasat.setVisible(false);
					oDatInv.setVisible(false);
					oNumInv.setVisible(false);
					break;
			}

			var oTipExp = this.getView().byId("Tipexp_id");
			if (oObject.Descrtipexp === "") {
				oTipExp.setVisible(false);
			} else {
				oBasat.setVisible(true);
			}
			
			var oSuposit = this.getView().byId("Suposit");
			if (oObject.Descrsuposit === "") {
				oSuposit.setVisible(false);
			} else {
				oSuposit.setVisible(true);
			}
			
			var oOfertesTab = this.getView().byId("OfertesTab");
			var oFacturesTab = this.getView().byId("iconTabBarFact");
			var oAnuTable = this.getView().byId("AnuTable");
			var oCriSol = this.getView().byId("CriSol_id");
			var oTabSC = this.getView().byId("iconTabBarSC");
			var oButCPV = this.getView().byId("ChangeCPV");
			var oAdjTab = this.getView().byId("iconTabBarAdjFor");
			var oAdjExeSep = this.getView().byId("AdjExeSep_id");
			var oExeTab = this.getView().byId("iconTabBarExe");
			var oIntTab = this.getView().byId("iconTabBarInt");
			//var oExeFinSep = this.getView().byId("ExeFinSep_id");
			//var oFinTab = this.getView().byId("iconTabBarFin");
			if (oObject.Lots === true) {
				oOfertesTab.setVisible(false);
				oAnuTable.setVisible(false);
				oCriSol.setVisible(false);
				oTabSC.setVisible(false);
				oFacturesTab.setVisible(false);
				oButCPV.setVisible(false);
				oAdjTab.setVisible(false);
				oAdjExeSep.setVisible(false);
				oExeTab.setVisible(false);
				oIntTab.setVisible(false);
				//oExeFinSep.setVisible(false);
				//oFinTab.setVisible(false);
			} else {
				oOfertesTab.setVisible(true);
				oAnuTable.setVisible(true);
				oCriSol.setVisible(true);
				oTabSC.setVisible(true);
				oFacturesTab.setVisible(true);
				oButCPV.setVisible(true);
				oAdjTab.setVisible(true);
				oAdjExeSep.setVisible(true);
				oExeTab.setVisible(true);
				oIntTab.setVisible(true);
				//oExeFinSep.setVisible(true);
				//oFinTab.setVisible(true);
			}
			
			var oCodiPcte = this.getView().byId("Codiprod_id");
			var oSubHom = this.getView().byId("Subhomol_id");
			var oSubAgr = this.getView().byId("Subagreg_id");
			if (oObject.Tipcontr === "SU"){
				oCodiPcte.setVisible(true);
				oSubHom.setVisible(true);
				oSubAgr.setVisible(true);
			} else {
				oCodiPcte.setVisible(false);
				oSubHom.setVisible(false);
				oSubAgr.setVisible(false);
			}
			
			
			this.getView().getModel().resetChanges();
		},
		
		_fnUpdateSuccess: function () {
			this.getModel("appView").setProperty("/busy", false);
			this.getView().unbindObject();
			this.getRouter().getTargets().display("object");
		},
		
		onEdit: function (oEvent) {
			this._oViewModel.setProperty("/mode", "edit");
			this._oViewModel.setProperty("/enableDel", "Delete");
		},

		onAddOferta: function (oEvent) {
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = oView.getModel().getObject(sPath);
			this.getView().getModel().submitChanges();
			this.getRouter().getTargets().display("Oferta", {
				codiexp: oObject.Codiexp,
				codilot: "00",
				mode: "create"
			});
		},

		onSelOferta: function (oEvent) {
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = oView.getModel().getObject(sPath);
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			this.getView().getModel().submitChanges();
			this.getRouter().getTargets().display("Oferta", {
				codiexp: oObject.Codiexp,
				codilot: "00",
				codiofe: oItem.getIntro(),
				mode: this._oViewModel.getProperty("/mode")
			});
		},
		
		onSelLot: function (oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var oCodiExp = oItem.getBindingContext().getProperty("Codiexp");
			var oCodiLot = oItem.getBindingContext().getProperty("Codilot");
			this.getView().getModel().submitChanges();
			this.getRouter().getTargets().display("Lot", {
				codiexp: oCodiExp,
				codilot: oCodiLot
			});
		},
		
		onAddMesa: function (oEvent) {
			var oElementBinding = this.getView().getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = this.getView().getModel().getObject(sPath);
			var oContext = this._oODataModel.createEntry("AssisMesaSet", {
				properties: {
					Codiexp: oObject.Codiexp
				},
				success: this._fnEntityCreated.bind(this),
				error: this._fnEntityCreationFailed.bind(this)
			});
			this.getView().setBindingContext(oContext);
			this.getView().getModel().submitChanges();
		},
		
		_fnEntityCreated: function (oData) {
			var sObjectPath = this.getModel().createKey("AssisMesaSet", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath);
			this.getModel("appView").setProperty("/busy", false);
		},

		_fnEntityCreationFailed: function () {
			this.getModel("appView").setProperty("/busy", false);
		},

		handleDelMesa: function (oEvent) {
			this.getView().getModel().submitChanges();
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var sServiceUrl = window.location.origin + "/sap/opu/odata/sap/ZD_EXP_CONTR_SRV/";
			var oModelMesa = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var oPath = "/AssisMesaSet(Codiexp='" + oItem.getBindingContext().getProperty("Codiexp") + "',Comptador='" + oItem.getBindingContext()
				.getProperty("Comptador") + "')";
			oModelMesa.remove(oPath, {
				success: this.onMesaDel()
			}, function () {
				// 	//var msgs = "Assistent creat";
				// 	//sap.m.MessageBox.show(msgs);
				// 	this.onRefreshMeses(); // no hace nada, hay que borrar también el registro de la tabla
			}, function () {
				// 	//var msgs = "Error a l'esborrar l'assistent";
				// 	//sap.m.MessageBox.show(msgs);
			});
		},
		
		onMesaDel: function () {
			this.getView().getElementBinding().refresh(true);
		},
		
		onChangeCPV: function (oEvent) {
			if (!this.oAttachDialogCPV) {
				this.oAttachDialogCPV = sap.ui.xmlfragment("CRUD_EXP.CRUD_Exp.view.CPV", this.getView().getController());
				this.getView().addDependent(this.oAttachDialogCPV);
				this.oAttachDialogCPV.setResizable(true);
			}
			this.oAttachDialogCPV.open();
		},
		
		onNouCPV: function (oEvent) {
			var cBox = sap.ui.getCore().byId("Codicpv_id");
			var textcpv = cBox.getSelectedItem().getProperty("text");
			this.oAttachDialogCPV.close();
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			this.getView().getModel().setProperty(sPath + "/Descrcpv", textcpv);
		},
		
		onAttachUpload: function (oEvent) {
			var oFieldsRequired = this._checkDocFields();
			if (oFieldsRequired === false) {
				return;
			}
			if (this.getModel().hasPendingChanges()) {
				// get user confirmation first
				//this.getModel().submitChanges(); DA UN ERROR!!!
			}			
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = oView.getModel().getObject(sPath);
			this.oDocModel = new JSONModel({
				entity: "ExpedientSet",
				Codiexp: oObject.Codiexp,
				Codilot: "00",
				Codiofer: "00",
				Tipsc: "",
				Numsc: "00"
			});
			this.attachUpload(this.oDocModel);
			this.onCloseAttachDialogDoc();
			this.getView().getElementBinding().refresh(true);
			this.getModel().resetChanges();
		},
		
		onSelDoc: function (oEvent) {
			this.getFile(oEvent);
		},
		
		onAddAnu: function (oEvent) {
			var oElementBinding = this.getView().getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = this.getView().getModel().getObject(sPath);
			var oContext = this._oODataModel.createEntry("AnualSet", {
				properties: {
					Codiexp: oObject.Codiexp,
					Codilot: "00"
				},
				success: this._fnAnuCreated.bind(this),
				error: this._fnAnuCreationFailed.bind(this)
			});
			this.getView().setBindingContext(oContext);
			this.getView().getModel().submitChanges();
		},
		
		_fnAnuCreated: function (oData) {
			var sObjectPath = this.getModel().createKey("AnualSet", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath);
			this.getModel("appView").setProperty("/busy", false);
		},
		
		_fnAnuCreationFailed: function () {
			this.getModel("appView").setProperty("/busy", false);
		},

		handleDelAnu: function (oEvent) {
			this.getView().getModel().submitChanges();
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var sServiceUrl = window.location.origin + "/sap/opu/odata/sap/ZD_EXP_CONTR_SRV/";
			var oModelAnu = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var oPath = "/AnualSet(Codiexp='" + oItem.getBindingContext().getProperty("Codiexp") + "',Codilot='" + oItem.getBindingContext().getProperty(
				"Codilot") + "',Exercici='" + oItem.getBindingContext().getProperty("Exercici") + "')";
			oModelAnu.remove(oPath, {
				success: this.onAnuDel()
			}, function () {
				// 	//var msgs = "Assistent creat";
				// 	//sap.m.MessageBox.show(msgs);
				// 	this.onRefreshMeses(); // no hace nada, hay que borrar también el registro de la tabla
			}, function () {
				// 	//var msgs = "Error a l'esborrar l'assistent";
				// 	//sap.m.MessageBox.show(msgs);
			});
		},
		
		onAnuDel: function () {
			this.getView().getElementBinding().refresh(true);
		},
		
		onAddCri: function (oEvent) {
			var oElementBinding = this.getView().getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = this.getView().getModel().getObject(sPath);
			var oContext = this._oODataModel.createEntry("CriteriSet", {
				properties: {
					Codiexp: oObject.Codiexp,
					Codilot: "00"
				},
				success: this._fnCriCreated.bind(this),
				error: this._fnCriCreationFailed.bind(this)
			});
			this.getView().setBindingContext(oContext);
			this.getView().getModel().submitChanges();
		},

		_fnCriCreated: function (oData) {
			var sObjectPath = this.getModel().createKey("CriteriSet", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath);
			this.getModel("appView").setProperty("/busy", false);
		},

		_fnCriCreationFailed: function () {
			this.getModel("appView").setProperty("/busy", false);
		},

		handleDelCri: function (oEvent) {
			this.getView().getModel().submitChanges();
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var sServiceUrl = window.location.origin + "/sap/opu/odata/sap/ZD_EXP_CONTR_SRV/";
			var oModelCri = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var oPath = "/CriteriSet(Codiexp='" + oItem.getBindingContext().getProperty("Codiexp") + "',Codilot='" + oItem.getBindingContext().getProperty(
				"Codilot") + "',Comptador='" + oItem.getBindingContext().getProperty("Comptador") + "')";
			oModelCri.remove(oPath, {
				success: this.onCriDel()
			}, function () {
				// 	//var msgs = "Assistent creat";
				// 	//sap.m.MessageBox.show(msgs);
				// 	this.onRefreshMeses(); // no hace nada, hay que borrar también el registro de la tabla
			}, function () {
				// 	//var msgs = "Error a l'esborrar l'assistent";
				// 	//sap.m.MessageBox.show(msgs);
			});
		},
		
		onCriDel: function () {
			this.getView().getElementBinding().refresh(true);
		},
		
		onAddSC: function (oEvent) {
			var oCodiExp = this.getView().getBindingContext().getProperty("Codiexp");
		
			var oAdjudicat = this.checkOfeAdj(oCodiExp,"00");
			
			if ( oAdjudicat === false ){
				sap.m.MessageToast.show("No existeix cap oferta adjudicada");
				return;
			}

			this.getView().getModel().submitChanges();
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = oView.getModel().getObject(sPath);
			
			this.getRouter().getTargets().display("SitCont", {
				codiexp: oObject.Codiexp,
				codilot: "00",
				mode: "create"
			});
		},
		
		onSelSC: function (oEvent) {
			this.getView().getModel().submitChanges();
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var oCodiexp = oItem.getBindingContext().getProperty("Codiexp");
			var oCodilot = oItem.getBindingContext().getProperty("Codilot");
			var oCodiofer = oItem.getBindingContext().getProperty("Codiofer");
			var oTipsc = oItem.getBindingContext().getProperty("Tipsc");
			var oNumsc = oItem.getBindingContext().getProperty("Numsc");
			this.getRouter().getTargets().display("SitCont", {
				codiexp: oCodiexp,
				codilot: oCodilot,
				codiofe: oCodiofer,
				tipsc: oTipsc,
				numsc: oNumsc,
				mode: this._oViewModel.getProperty("/mode")
			});
		},

		onSelFact: function (oEvent) {
			this.getView().getModel().submitChanges();
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var oCodiexp = this.getView().getBindingContext().getProperty("Codiexp");
			var oCodilot = "00";
			var oBuzei = oItem.getBindingContext().getProperty("Buzei");
			var oDocTable = oItem.getBindingContext().getProperty("DocTable");
			var oDocument = oItem.getBindingContext().getProperty("Document");
			var oBukrs = oItem.getBindingContext().getProperty("Bukrs");
			var oGjahr = oItem.getBindingContext().getProperty("Gjahr");
			
			this.getRouter().getTargets().display("Factura", {
				codiexp: oCodiexp,
				codilot: oCodilot,
				buzei: oBuzei,
				doctable: oDocTable,
				document: oDocument,
				bukrs: oBukrs,
				gjahr: oGjahr
			});
		},
		
		onDocListUpdateFinished: function (oEvent) {
			this._oViewModel.setProperty("/numDocs", oEvent.getParameter("total"));			
		},
		
		onSCListUpdateFinished: function (oEvent) {
			this._oViewModel.setProperty("/numSC", oEvent.getParameter("total"));
		},
		
		onFactListUpdateFinished: function (oEvent) {
			this._oViewModel.setProperty("/numFact", oEvent.getParameter("total"));
		},
		
		onOferListUpdateFinished: function (oEvent) {
			this._oViewModel.setProperty("/numOfer", oEvent.getParameter("total"));
		},
		
		onDelOfer: function (oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var sServiceUrl = window.location.origin + "/sap/opu/odata/sap/ZD_EXP_CONTR_SRV/";
			var oModelOfer = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var sPath = oItem.getBindingContext().getPath();
			oModelOfer.remove(sPath, {
				success: this._onOferDeleted.bind(this),
				error: this._onOferDelError.bind(this)
			});
		},

		_onOferDeleted: function (oData) {
			this.getModel("appView").setProperty("/busy", false);
			this.getView().getElementBinding().refresh(true);
		},
		
		_onOferDelError: function (oData) {
			var oMessage = JSON.parse(oData.response.body);
			MessageBox.error(oMessage.error.innererror.errordetails[0].message);
			this.getModel("appView").setProperty("/busy", false);
		},
		
		onDelDoc: function (oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var sServiceUrl = window.location.origin + "/sap/opu/odata/sap/ZD_EXP_CONTR_SRV/";
			var oModelDoc = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var sPath = oItem.getBindingContext().getPath();
			oModelDoc.remove(sPath, {
				success: this._onDocDeleted.bind(this),
				error: this._onDocDelError.bind(this)
			});
		},

		_onDocDeleted: function (oData) {
			this.getModel("appView").setProperty("/busy", false);
			this.getView().getElementBinding().refresh(true);
		},
		
		_onDocDelError: function (oData) {
			var oMessage = JSON.parse(oData.response.body);
			MessageBox.error(oMessage.error.innererror.errordetails[0].message);
			this.getModel("appView").setProperty("/busy", false);
		},
		
		onDelSC: function (oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var sServiceUrl = window.location.origin + "/sap/opu/odata/sap/ZD_EXP_CONTR_SRV/";
			var oModelMM = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var sPath = oItem.getBindingContext().getPath();
			oModelMM.remove(sPath, {
				success: this._onSCDeleted.bind(this),
				error: this._onSCDelError.bind(this)
			});
		},

		_onSCDeleted: function (oData) {
			this.getModel("appView").setProperty("/busy", false);
			this.getView().getElementBinding().refresh(true);
		},
		
		_onSCDelError: function (oData) {
			var oMessage = JSON.parse(oData.response.body);
			MessageBox.error(oMessage.error.innererror.errordetails[0].message);
			this.getModel("appView").setProperty("/busy", false);
		},
		
		_onPresLicIVA: function(oEvent) {
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = oView.getModel().getObject(sPath);

			if (oEvent.getSource().getProperty("name") === "Preslic"){
				if (oObject.Procedim === "M") {
					var oPresLic = this.getView().byId("Preslic_id").getValue();
					oPresLic = oPresLic.replace(/[.*+?^${}()|[\]\\]/g,'');
					oPresLic = oPresLic.replace(",","");
					var oPresLicI = parseInt(oPresLic);
					if (oObject.Tipcontr === "OB" && oPresLicI >= 4000000) {
						sap.m.MessageToast.show("L'import ha de ser inferior a 40.000,00€");
						this.getView().byId("Preslic_id").setValue(0);
						return;
					} else if (oObject.Tipcontr !== "OB" && oPresLicI >= 1500000) {
						sap.m.MessageToast.show("L'import ha de ser inferior a 15.000,00€");
						this.getView().byId("Preslic_id").setValue(0);
						return;
					}
				}
			}
			
			var oPresLic = this.getView().byId("Preslic_id").getValue();
			oPresLic = oPresLic.replace(/[.*+?^${}()|[\]\\]/g,'');
			oPresLic = oPresLic.replace(",","");
			var oPresLicI = parseInt(oPresLic);

			var oAdj = this.getView().byId("Impadjud_id").getValue();
			oAdj = oAdj.replace(/[.*+?^${}()|[\]\\]/g,'');
			oAdj = oAdj.replace(",","");
			var oAdjI = parseInt(oAdj);
			
			if (oAdjI > oPresLicI) {
				sap.m.MessageToast.show("El pressupost de licitació no pot ser inferior a l'import d'adjudicació");
				this.getView().byId("Preslic_id").setValue(0);
			} else {
				this.calcIVA("Preslic_id","Tipiva","Presliciva_id");
			}
		},

		_onAdjIVA: function(oEvent) {
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = oView.getModel().getObject(sPath);
			
			var oPresLic = this.getView().byId("Preslic_id").getValue();
			oPresLic = oPresLic.replace(/[.*+?^${}()|[\]\\]/g,'');
			oPresLic = oPresLic.replace(",","");
			var oPresLicI = parseInt(oPresLic);

			var oAdj = this.getView().byId("Impadjud_id").getValue();
			oAdj = oAdj.replace(/[.*+?^${}()|[\]\\]/g,'');
			oAdj = oAdj.replace(",","");
			var oAdjI = parseInt(oAdj);
			
			if (oAdjI > oPresLicI) {
				sap.m.MessageToast.show("L'import d'adjudicació no pot ser superior al pressupost de licitació");
				this.getView().byId("Impadjud_id").setValue(0);
				return;
			} 
			
			this.calcIVA("Impadjud_id","Ivaadjud","Impadjiva_id");
		},
		
		_onCheckDate: function(oEvent) {
			var oDateMod = oEvent.getSource().getProperty("name");

			var dates = 
				[
					{"name": "Datinici",	"text": "data d'inici", 							"id": "Datinici_id"},
					{"name": "Datinfjur",	"text": "data de l'informe justificatiu",			"id": "Datinfjur_id"},
					{"name": "Datfisca",	"text": "data de fiscalització",					"id": "Datfisca_id"},
					{"name": "Dataprov",	"text": "data d'aprovació", 						"id": "Dataprov_id"},
					{"name": "Dlimpres",	"text": "data límit presentació d'ofertes",			"id": "Dlimpres_id"},
					{"name": "Datinvit",	"text": "Data invitació",							"id": "Datinvit_id"},
					{"name": "Dpliboe",		"text": "Data publicació anunci licitació BOE",		"id": "Dpliboe_id" },
					{"name": "Dplidogc",	"text": "Data publicació anunci licitació DOGC",	"id": "Dplidogc_id" },
					{"name": "Dplidoue",	"text": "Data publicació anunci licitació DOUE",	"id": "Dplidoue_id" },
					{"name": "Dplipscp",	"text": "Data publicació anunci licitació PSCP",	"id": "Dplipscp_id" },
					{"name": "Datosoba",	"text": "Data i hora obertura sobre administratiu",	"id": "Datosoba_id" },
					{"name": "Datosobt",	"text": "Data i hora obertura sobre tècnic",		"id": "Datosobt_id" },
					{"name": "Datosobe",	"text": "Data i hora obertura sobre econòmic",		"id": "Datosobe_id" },
					{"name": "Datadjud",	"text": "Data d'adjudicació",						"id": "Datadjud_id" },
					{"name": "Dpublrpc",	"text": "Data publicació RPC",						"id": "Dpublrpc_id" },
					{"name": "Dpadboe",		"text": "Data publicació anunci adjudicació BOE",	"id": "Dpadboe_id" },
					{"name": "Dpaddogc",	"text": "Data publicació anunci adjudicació DOGC",	"id": "Dpaddogc_id" },
					{"name": "Dpaddoue",	"text": "Data publicació anunci adjudicació DOUE",	"id": "Dpaddoue_id" },
					{"name": "Dpadpscp", 	"text": "Data publicació anunci adjudicació PSCP",	"id": "Dpadpscp_id" },
					{"name": "Datnotif",	"text": "Data de notificació",						"id": "Datnotif_id" },
					{"name": "Datforma",	"text": "Data de formalització",					"id": "Datforma_id" },
					{"name": "Dpfoboe",		"text": "Data publicació anunci formalització BOE",	"id": "Dpfoboe_id" },
					{"name": "Dpfodogc",	"text": "Data publicació anunci formalització DOGC","id": "Dpfodogc_id" },
					{"name": "Dpfodoue",	"text": "Data publicació anunci formalització DOUE","id": "Dpfodoue_id" },
					{"name": "Dpfopscp",	"text": "Data publicació anunci formalització PSCP","id": "Dpfopscp_id" },
					{"name": "Diniexec",	"text": "Data inici execució",						"id": "Diniexec_id" },
					{"name": "Dfinexec",	"text": "Data finalització execució",				"id": "Dfinexec_id" }
				];

				//var regDataMod = dates.filter(d => d.name == oDateMod);
 	 			for (var i = 0; i < dates.length; i++) {
		 			if ( oDateMod === dates[i].name ) {
		 				var regDataMod = dates[i];
		 				break;
		 			}	
		 		}

				var valorDataMod = new Date(this.getView().byId(regDataMod.id).getValue());
				var valorDataModMS = valorDataMod.getTime();
				
				var oComprovacio = ">=";
				
 	 			for (var i = 0; i < dates.length; i++) {
		 			var valorDataComp = new Date(this.getView().byId(dates[i].id).getValue());
		 			var valorDataCompMS = valorDataComp.getTime();
 					
 	 				if ( oDateMod === dates[i].name ) {
 	 					oComprovacio = "<=";
 	 					continue;
 	 				} 
 					
 	 				if ( oComprovacio === ">=" && valorDataModMS < valorDataCompMS ) {
 	 					sap.m.MessageToast.show("La " + regDataMod.text + " no pot ser inferior a la " + dates[i].text);
 	 					this.getView().byId(regDataMod.id).setValue("");
 	 					break;
 	 				} else if ( oComprovacio === "<=" && valorDataModMS > valorDataCompMS ) {
	 					sap.m.MessageToast.show("La " + regDataMod.text + " no pot ser superior a la " + dates[i].text);
 	 					this.getView().byId(regDataMod.id).setValue("");
 	 					break;
 	 				}
 				} 
		},
		
		_onDurada:function (oEvent){
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = oView.getModel().getObject(sPath);

			if (oObject.Procedim === "M") {
				var oDurada = this.getView().byId("Durcontr_id").getValue();
				var oTermini = this.getView().byId("Durcterm_id").getSelectedKey();

				switch(oTermini) {
					case "D":
						if ( oDurada > 365 ) {
							sap.m.MessageToast.show("El termini no pot ser superior a 365 dies");
							this.getView().byId("Durcontr_id").setValue(0);
							this.getView().byId("Durcterm_id").setSelectedKey("");
						}
						break;
					case "M":
						if ( oDurada > 12 ) {
							sap.m.MessageToast.show("El termini no pot ser superior a 12 mesos");
							this.getView().byId("Durcontr_id").setValue(0);
							this.getView().byId("Durcterm_id").setSelectedKey("");
						}
						break;
					case "A":
						if ( oDurada > 1 ) {
							sap.m.MessageToast.show("El termini no pot ser superior a 1 any");
							this.getView().byId("Durcontr_id").setValue(0);
							this.getView().byId("Durcterm_id").setSelectedKey("");
						}
						break;
				}
			}
		},
		
		onAddIntegra: function(oEvent){
			aFilter = [];
			if (!this.oIntDialog) {
				this.oIntDialog = sap.ui.xmlfragment("CRUD_EXP.CRUD_Exp.view.IntExp", this.getView().getController());
				this.getView().addDependent(this.oIntDialog);
			}
			
			this.oIntDialog.setMultiSelect(false);

			this.oIntDialog.open();
		},
		
		handleIntegra: function(oEvent) {
			var oInterfase = oEvent.getParameter("selectedItem").getInfo();
			
			aFilter.push(new sap.ui.model.Filter("Interfase", sap.ui.model.FilterOperator.EQ, oInterfase.substring(0, 5)));
			aFilter.push(new sap.ui.model.Filter("InterfaseSub", sap.ui.model.FilterOperator.EQ, oInterfase.substring(5, 8)));

			if (oEvent.getParameter("selectedItem").getIconDensityAware() === true) {
				if (!this.oDocDialog) {
					this.oDocDialog = sap.ui.xmlfragment("CRUD_EXP.CRUD_Exp.view.DocExp", this.getView().getController());
					this.getView().addDependent(this.oDocDialog);
				}
				
				this.oDocDialog.setMultiSelect(true);
				
				this.oDocDialog.open();
			} else {
				this.launchIntegration();
			}
		},
		
		handleDocClose: function(oEvent) {
			var oDocs = oEvent.getParameter("selectedItems");
			var docsSelected = false;

			for (var oDoc in oDocs) {
				aFilter.push(new sap.ui.model.Filter("Documents", sap.ui.model.FilterOperator.EQ, oDocs[oDoc].getInfo()));
				docsSelected = true;
			}
			if (docsSelected === true) {
				this.launchIntegration();
			} else{
				MessageBox.show("No s'ha seleccionat cap document. Integració cancel·lada");
			}
		},
		
		launchIntegration: function() {
			var that = this;
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = oView.getModel().getObject(sPath);
			this.getView().getModel().submitChanges();

			var sServiceUrl = window.location.origin + "/sap/opu/odata/sap/ZD_EXP_CONTR_SRV/";
			var oModelFile = new sap.ui.model.odata.ODataModel(sServiceUrl, true);

			var pathIntegra = "/IntegraSet";

			aFilter.push(new sap.ui.model.Filter("Codiexp", sap.ui.model.FilterOperator.EQ, oObject.Codiexp));

			oModelFile.read(pathIntegra, {
				filters: aFilter,
				success: function(oData) {
					var oMessageTemplate = new sap.m.MessageItem({
						type: "{type}",
						title: "{title}"
					});
	
					var aMockMessages = [];
		
					for (var i = 0; i < oData.results.length; i++) {
						aMockMessages.push({type: oData.results[i].Tipus, title: oData.results[i].Missatge});
					}
	
					var oModel = new JSONModel();
		
					oModel.setData(aMockMessages);
		
					that.oMessageView = new sap.m.MessageView({
						showDetailsPageHeader: false,
						itemSelect: function () {
							// oBackButton.setVisible(true);
						},
						items: {
							path: "/",
							template: oMessageTemplate
						}
					});
		
					that.oMessageView.setModel(oModel);
	
					that.oDialog = new sap.m.Dialog({
						resizable: true,
						content: that.oMessageView,
						state: "Error",
						beginButton: new sap.m.Button({
							press: function () {
								that.getView().getElementBinding().refresh(true);
								this.getParent().close();
							},
							text: "Close"
						}),
						customHeader: new sap.m.Bar({
							contentMiddle: [
								new sap.m.Text({ text: "Missatges"})
							]
						}),
						contentHeight: "300px",
						contentWidth: "700px",
						verticalScrolling: false
					});
					
					that.oDialog.open();
				},
				error: function() {
					MessageBox.show("Alguna cosa no ha anat bé");
				}
			});
		}
	});
});