var aFilter = [];

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"CRUD_EXP/CRUD_Exp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment"
], function (Controller, BaseController, JSONModel, MessageBox) {
	"use strict";
	return BaseController.extend("CRUD_EXP.CRUD_Exp.controller.Oferta", {
		onInit: function () {
			var that = this;
			this.getRouter().getTargets().getTarget("Oferta").attachDisplay(null, this._onDisplay, this);
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
		_onDisplay: function (oEvent) {
			var oDataEvent = oEvent.getParameter("data");
			this._oViewModel.setProperty("/from", oDataEvent.from);
			this._oViewModel.setProperty("/mode", oDataEvent.mode);
			if (oDataEvent.mode === "create") {
				this._oViewModel.setProperty("/enableDel", "Delete");
				var oContext = this._oODataModel.createEntry("OfeSet", {
					properties: {
						Codiexp: oDataEvent.codiexp,
						Codilot: oDataEvent.codilot
					},
					success: this._fnEntityCreated.bind(this),
					error: this._fnEntityCreationFailed.bind(this)
				});
				this.getView().setBindingContext(oContext);
			} else {
				if (oDataEvent.mode === "display") {
					this._oViewModel.setProperty("/enableDel", "None");
				} else {
					this._oViewModel.setProperty("/enableDel", "Delete");
				}
				var path = "/OfeSet(Codiexp='" + oDataEvent.codiexp + "',Codilot='" + oDataEvent.codilot + "',Codiofer='" + oDataEvent.codiofe +
					"')";
				var oView = this.getView();
				oView.bindElement({
					path: path
				});
			}
		},
		_fnEntityCreated: function (oData) {
			var sObjectPath = this.getModel().createKey("OfeSet", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath);
			this.getModel("appView").setProperty("/busy", false);
			this.getRouter().getTargets().display("object");
		},
		_fnEntityCreationFailed: function () {
			this.getModel("appView").setProperty("/busy", false);
		},
		onSave: function () {
			if (this._oViewModel.getProperty("/mode") === "create") {
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
				// attach to the request completed event of the batch
				oModel.attachEventOnce("batchRequestCompleted", function (oEvent) {
					if (that._checkIfBatchRequestSucceeded(oEvent)) {
						that._fnUpdateSuccess();
					} else {
						that._fnEntityCreationFailed();
						MessageBox.error("Falten dades obligat\xF2ries");
					}
				});
				oModel.submitChanges();
			} else {
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
			} //this._NavBack();
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
		onCancel: function () {
			if (this._oViewModel.getProperty("/mode") === "display") {
				this._NavBack();
			} else {
				this._showConfirmQuitChanges(this._oViewModel);
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
							if (oViMo.getProperty("/mode") === "edit") {
								oViMo.setProperty("/mode", "display");
								oViMo.setProperty("/enableDel", "None");
							} else {
								that._NavBack();
							}
						}
					}
				});
			} else {
				this._oViewModel.setProperty("/mode", "display");
				this._oViewModel.setProperty("/enableDel", "None");
			}
		},
		_NavBack: function () {
			if (this._oViewModel.getProperty("/from") === "detail") {
				this.getView().unbindObject();
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.publish("Oferta", "changeApp");
				sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});
			} else {
				var oCodiExp = this.getView().getBindingContext().getProperty("Codiexp");
				var oCodiLot = this.getView().getBindingContext().getProperty("Codilot");
				this.getView().unbindObject();
				if (oCodiLot === "00") {
					var oPath = "/ExpedientSet('" + oCodiExp + "')";
					this.getRouter().getTargets().display("UpdateExp", {
						objectPath: oPath
					});
				} else {
					this.getRouter().getTargets().display("Lot", {
						codiexp: oCodiExp,
						codilot: oCodiLot
					});
				}
			}
		},
		onEdit: function (oEvent) {
			this._oViewModel.setProperty("/mode", "edit");
			this._oViewModel.setProperty("/enableDel", "Delete");
		},
		onAttachUpload: function (oEvent) {
			var oFieldsRequired = this._checkDocFields();
			if (oFieldsRequired === false) {
				return;
			}
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oOferta = oView.getModel().getObject(sPath);
			this.oDocModel = new JSONModel({
				entity: "ExpedientSet",
				Codiexp: oOferta.Codiexp,
				Codilot: oOferta.Codilot,
				Codiofer: oOferta.Codiofer,
				Tipsc: "",
				Numsc: "00"
			});
			this.attachUpload(this.oDocModel);
			this.onCloseAttachDialogDoc();
			this.getView().getElementBinding().refresh(true);
		},
		onSelDoc: function (oEvent) {
			this.getFile(oEvent);
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
		onDocListUpdateFinished: function (oEvent) {
			this._oViewModel.setProperty("/numDocs", oEvent.getParameter("total"));
		},
		_onOfeIVA: function (oEvent) {
			this.calcIVA("Impofert_id", "Ivaofert", "Impofertiva_id");
		},

		onAdjudicat: function (oEvent) {
			var oAdjudi = this.getView().byId("Adjudicat_id").getSelected();
			var oExclos = this.getView().byId("Exclos_id").getSelected();
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oOferta = oView.getModel().getObject(sPath);
			var oDatVal = this.getView().getBindingContext().getModel();
			var oDatPro = oDatVal.getProperty("/");
			var oDatNom = Object.getOwnPropertyNames(oDatPro);
			var oCodilot = "Codilot='" + oOferta.Codilot + "'";
			var oCodiofer = "Codiofer='" + oOferta.Codiofer + "'";
			
			if ( oAdjudi === true ) {
				// comprovar que no hi hagi cap oferta més adjudicada
 				for (var i = 0; i < oDatNom.length; i++) {
 					if ( oDatNom[i].indexOf('OfeSet') >= 0 && 
 						 oDatNom[i].indexOf(oOferta.Codiexp) >= 0 && 
 						 oDatNom[i].indexOf(oCodilot) >= 0 &&
 						 oDatNom[i].indexOf(oCodiofer) < 0 &&
 						 oDatPro[oDatNom[i]].Adjudicat === true ) {
						sap.m.MessageToast.show("Hi ha una altra oferta adjudicada");
						this.getView().byId("Adjudicat_id").setSelected(false);
						return;
 					}
 				}
				
				if (oExclos === true) {
					sap.m.MessageToast.show("Es desmarca el flag d'exlòs");
					this.getView().byId("Exclos_id").setSelected(false);
					return;
				}
			} else {
				// comprovar que no hi hagi cap oferta més adjudicada
 				for (var i = 0; i < oDatNom.length; i++) {
 					if ( oDatNom[i].indexOf('SitContSet') >= 0 && 
 						 oDatNom[i].indexOf(oOferta.Codiexp) >= 0 && 
 						 oDatNom[i].indexOf(oCodilot) >= 0 &&
 						 oDatNom[i].indexOf(oCodiofer) >= 0  ) {
						sap.m.MessageToast.show("Hi ha alguna situació contractual lligada a aquest oferta. No es pot desadjudicar");
						this.getView().byId("Adjudicat_id").setSelected(true);
						return;
 					}
 				}
			}
		},

		onExclos: function (oEvent) {
			var oAdjudi = this.getView().byId("Adjudicat_id").getSelected();
			var oExclos = this.getView().byId("Exclos_id").getSelected();
			
			if ( oAdjudi === true && oExclos === true){
				sap.m.MessageToast.show("No pot excloure l'oferta adjudicada");
				this.getView().byId("Exclos_id").setSelected(false);
			}
		},
		
		checkSC: function() {
			var oAdjudi = this.getView().byId("Adjudicat_id").getSelected();
			
			if (oAdjudi === false) {
				return false;
			}
			
			return true;
		},
		
		onAddIntegra: function(oEvent){
			aFilter = [];
			if (!this.oIntDialog) {
				this.oIntDialog = sap.ui.xmlfragment("CRUD_EXP.CRUD_Exp.view.IntOfe", this.getView().getController());
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
					this.oDocDialog = sap.ui.xmlfragment("CRUD_EXP.CRUD_Exp.view.DocOfe", this.getView().getController());
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
			aFilter.push(new sap.ui.model.Filter("Codiofer", sap.ui.model.FilterOperator.EQ, oObject.Codiofer));

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