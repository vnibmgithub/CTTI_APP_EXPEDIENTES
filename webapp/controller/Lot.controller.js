var aFilter = [];

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"CRUD_EXP/CRUD_Exp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment"
], function (Controller,BaseController, JSONModel, MessageBox) {
	"use strict";

	return BaseController.extend("CRUD_EXP.CRUD_Exp.controller.Lot", {

			onInit: function() {
				var that = this;
				this.getRouter().getTargets().getTarget("Lot").attachDisplay(null, this._onDisplay, this);
				this._oODataModel = this.getOwnerComponent().getModel();
				this._oResourceBundle = this.getResourceBundle();
				this._oViewModel = new JSONModel({
					enableCreate: false,
					delay: 0,
					busy: false,
					mode: "display",
					viewTitle: ""
				});
				this.setModel(this._oViewModel, "viewModel");

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
			},

		onAfterRendering: function () {
			var oEditAction = this.getView().byId("edit");
			var oEditButton = oEditAction.getAggregation("_control");
			oEditButton.setText("Editar");
			var oSaveAction = this.getView().byId("save");
			var oSaveButton = oSaveAction.getAggregation("_control");
			oSaveButton.setText("Guardar");
			var oCancelAction = this.getView().byId("cancel");
			var oCancelButton = oCancelAction.getAggregation("_control");
			oCancelButton.setText("Cancel\xB7lar");
		},

		_onDisplay: function(oEvent) {
			var oDataEvent = oEvent.getParameter("data");
			this._oViewModel.setProperty("/from", oDataEvent.from);
			this._oViewModel.setProperty("/mode", "display");
			this._oViewModel.setProperty("/enableDel", "None");			
			var path = "/LotSet(Codiexp='" + oDataEvent.codiexp + "',Codilot='" + oDataEvent.codilot + "')";
			var oView = this.getView();
			oView.bindElement({
				path: path
			});
		},

		onSave: function () {
			var that = this,
				oModel = this.getModel();

			if (!oModel.hasPendingChanges()) {
				MessageBox.information(this._oResourceBundle.getText("noChangesMessage"), {
					id: "noChangesInfoMessageBox",
					styleClass: that.getOwnerComponent().getContentDensityClass()
				});
				return;
			}
			this.getModel("appView").setProperty("/busy", true);
			if (this._oViewModel.getProperty("/mode") === "edit") {
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
		
		_fnUpdateSuccess: function () {
			this.getModel("appView").setProperty("/busy", false);
			this._NavBack();
		},
		
		onCancel: function() {
			if ( this._oViewModel.getProperty("/mode") === "display") {
				this._NavBack();
			} else { this._showConfirmQuitChanges(this._oViewModel);
			}
		},
		
		_showConfirmQuitChanges: function (oViMo) {
			var oComponent = this.getOwnerComponent(),
				oModel = this.getModel();
			var that = this;
			if (this.getModel().hasPendingChanges()) {
				MessageBox.confirm(this._oResourceBundle.getText("confirmCancelMessage"), {
					styleClass: oComponent.getContentDensityClass(),
					onClose: function (oAction) {
						if (oAction === sap.m.MessageBox.Action.OK) {
							that.getModel("appView").setProperty("/addEnabled", true);
							oModel.resetChanges();
							oViMo.setProperty("/mode", "display");
							oViMo.setProperty("/enableDel", "None");
						}
					}
				});
			} else {
				this._oViewModel.setProperty("/mode", "display");
				this._oViewModel.setProperty("/enableDel", "None");			
			}
		},		

		_NavBack: function() {
			if ( this._oViewModel.getProperty("/from") === "detail" ) {
				this.getView().unbindObject();
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.publish("UpdateExp", "changeApp");
				sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});
			} else {
				var oCodiExp = this.getView().getBindingContext().getProperty("Codiexp");
				this.getView().unbindObject();
		
				var oPath = "/ExpedientSet('" + oCodiExp + "')";
				this.getRouter().getTargets().display("UpdateExp", {
						objectPath: oPath });
			}
		},

		onAddOferta: function (oEvent) {
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = oView.getModel().getObject(sPath);
			this.getRouter().getTargets().display("Oferta", {
				codiexp: oObject.Codiexp,
				codilot: oObject.Codilot,
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
				codilot: oObject.Codilot,
				codiofe: oItem.getIntro(),
				mode: this._oViewModel.getProperty("/mode")
			});
		},
		
		
		onEdit: function (oEvent) {
			this._oViewModel.setProperty("/mode", "edit");
			this._oViewModel.setProperty("/enableDel", "Delete");
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
			this.getView().getModel().setProperty(sPath+"/Descrcpv",textcpv);
		},
		
		onAddAnu: function (oEvent) {
			var oElementBinding = this.getView().getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = this.getView().getModel().getObject(sPath);
			var oContext = this._oODataModel.createEntry("AnualSet", {
				properties: {Codiexp: oObject.Codiexp, Codilot: oObject.Codilot},
				success: this._fnEntityCreated.bind(this),
				error: this._fnEntityCreationFailed.bind(this)
			});
			this.getView().setBindingContext(oContext);	
			this.getView().getModel().submitChanges();
		},

		_fnEntityCreated: function (oData) {
			var sObjectPath = this.getModel().createKey("AnualSet", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath);
			//save last created
			this.getModel("appView").setProperty("/busy", false);
			this.getRouter().getTargets().display("object");
		},

		_fnEntityCreationFailed: function () {
			this.getModel("appView").setProperty("/busy", false);
		},
		
		handleDelAnu: function (oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var sServiceUrl = window.location.origin + "/sap/opu/odata/sap/ZD_EXP_CONTR_SRV/";
			var oModelAnu = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var oPath = 
				"/AnualSet(Codiexp='" + oItem.getBindingContext().getProperty("Codiexp") + 
				"',Codilot='" + oItem.getBindingContext().getProperty("Codilot") + 
				"',Exercici='" + oItem.getBindingContext().getProperty("Exercici") + "')";
			oModelAnu.remove(oPath, {success: this.onAnuDel()}, function () {
			// 	//var msgs = "Assistent creat";
			// 	//sap.m.MessageBox.show(msgs);
			// 	this.onRefreshMeses(); // no hace nada, hay que borrar también el registro de la tabla
			 }, function () {
			// 	//var msgs = "Error a l'esborrar l'assistent";
			// 	//sap.m.MessageBox.show(msgs);
			 });
		},

		onAnuDel: function() {
			this.getView().getElementBinding().refresh(true);
		},
		
		onAddCri: function (oEvent) {
			var oElementBinding = this.getView().getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oObject = this.getView().getModel().getObject(sPath);
			var oContext = this._oODataModel.createEntry("CriteriSet", {
				properties: {Codiexp: oObject.Codiexp, Codilot: oObject.Codilot},
				success: this._fnCriCreated.bind(this),
				error: this._fnCriCreationFailed.bind(this)
			});
			this.getView().setBindingContext(oContext);	
			this.getView().getModel().submitChanges();
		},

		_fnCriCreated: function (oData) {
			var sObjectPath = this.getModel().createKey("CriteriSet", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath);
			//save last created
			this.getModel("appView").setProperty("/busy", false);
			this.getRouter().getTargets().display("object");
		},


		_fnCriCreationFailed: function () {
			this.getModel("appView").setProperty("/busy", false);
		},
		
		handleDelCri: function (oEvent) {
			this.getView().getModel().submitChanges();
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var sServiceUrl = window.location.origin + "/sap/opu/odata/sap/ZD_EXP_CONTR_SRV/";
			var oModelCri = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var oPath = 
				"/CriteriSet(Codiexp='" + oItem.getBindingContext().getProperty("Codiexp") + 
				"',Codilot='" + oItem.getBindingContext().getProperty("Codilot") + 
				"',Comptador='" + oItem.getBindingContext().getProperty("Comptador") + "')";
			oModelCri.remove(oPath, {success: this.onCriDel()}, function () {
			// 	//var msgs = "Assistent creat";
			// 	//sap.m.MessageBox.show(msgs);
			// 	this.onRefreshMeses(); // no hace nada, hay que borrar también el registro de la tabla
			 }, function () {
			// 	//var msgs = "Error a l'esborrar l'assistent";
			// 	//sap.m.MessageBox.show(msgs);
			 });
		},

		onCriDel: function() {
			this.getView().getElementBinding().refresh(true);
		},
		
		onAddSC: function (oEvent) {
			var oCodiExp = this.getView().getBindingContext().getProperty("Codiexp");
			var oCodiLot = this.getView().getBindingContext().getProperty("Codilot");
			var oAdjudicat = this.checkOfeAdj(oCodiExp,oCodiLot);
			
			if ( oAdjudicat === false ){
				sap.m.MessageToast.show("No existeix cap oferta adjudicada");
				return;
			}
			
			this.getView().getModel().submitChanges();
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oLot = oView.getModel().getObject(sPath);
			this.getRouter().getTargets().display("SitCont", {
				codiexp: oLot.Codiexp,
				codilot: oLot.Codilot,
				mode: "create"
			});			
		},
		
		onSelSC: function (oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var oCodiexp = oItem.getBindingContext().getProperty("Codiexp");
			var oCodilot = oItem.getBindingContext().getProperty("Codilot");
			var oCodiofer = oItem.getBindingContext().getProperty("Codiofer");
			var oTipsc = oItem.getBindingContext().getProperty("Tipsc");
			var oNumsc = oItem.getBindingContext().getProperty("Numsc");			
			this.getView().getModel().submitChanges();
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
			var oCodilot = this.getView().getBindingContext().getProperty("Codilot");
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
		
		onAttachUpload: function (oEvent) {
			var oFieldsRequired = this._checkDocFields();
			if ( oFieldsRequired === false ) {
				return;
			}
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oLot = oView.getModel().getObject(sPath);
			this.oDocModel = new JSONModel({
				entity: "ExpedientSet",
				Codiexp: oLot.Codiexp,
				Codilot: oLot.Codilot,
				Codiofer: "00",
				Tipsc: "",
				Numsc: "00"
			});
			this.attachUpload(this.oDocModel);
			this.onCloseAttachDialogDoc();
			this.getView().getElementBinding().refresh(true);
		},
		
		onSelDoc: function (oEvent) {
			//This code was generated by the layout editor.
			this.getFile(oEvent);
		},
		
		onDocListUpdateFinished: function (oEvent) {
			this._oViewModel.setProperty("/numDocs", oEvent.getParameter("total"));			
		},
		
		onSCListUpdateFinished: function (oEvent) {
			this._oViewModel.setProperty("/numSC", oEvent.getParameter("total"));
		},
		
		onOferListUpdateFinished: function (oEvent) {
			this._oViewModel.setProperty("/numOfer", oEvent.getParameter("total"));
		},

		onFactListUpdateFinished: function (oEvent) {
			this._oViewModel.setProperty("/numFact", oEvent.getParameter("total"));
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
			this.calcIVA("Preslic_id","Tipiva","Presliciva_id");
		},

		_onAdjIVA: function(oEvent) {
			this.calcIVA("Impadjud_id","Ivaadjud","Impadjiva_id");
		},
		
		onAddIntegra: function(oEvent){
			aFilter = [];
			if (!this.oIntDialog) {
				this.oIntDialog = sap.ui.xmlfragment("CRUD_EXP.CRUD_Exp.view.IntLot", this.getView().getController());
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
					this.oDocDialog = sap.ui.xmlfragment("CRUD_EXP.CRUD_Exp.view.DocLot", this.getView().getController());
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
			aFilter.push(new sap.ui.model.Filter("Codilot", sap.ui.model.FilterOperator.EQ, oObject.Codilot));

			oModelFile.read(pathIntegra, {
				filters: [aFilter],
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