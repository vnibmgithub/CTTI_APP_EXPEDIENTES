var aFilter = [];

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"CRUD_EXP/CRUD_Exp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox"
], function (Controller, BaseController, JSONModel, MessageBox) {
	"use strict";
	return BaseController.extend("CRUD_EXP.CRUD_Exp.controller.SitCont", {
		onInit: function () {
			var that = this;
			this.getRouter().getTargets().getTarget("SitCont").attachDisplay(null, this._onDisplay, this);
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
				var oSelectTipSC = this.getView().byId("Tipsc");
				oSelectTipSC.setEnabled(true);
				var oContext = this._oODataModel.createEntry("SitContSet", {
					properties: {
						Codiexp: oDataEvent.codiexp,
						Codilot: oDataEvent.codilot,
						Codiofer: oDataEvent.codiofe,
						Tipsc: oDataEvent.tipsc,
						Numsc: oDataEvent.numsc
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
				var path = "/SitContSet(Codiexp='" + oDataEvent.codiexp + "',Codilot='" + oDataEvent.codilot + "',Codiofer='" + oDataEvent.codiofe +
					"',Tipsc='" + oDataEvent.tipsc + "',Numsc='" + oDataEvent.numsc + "')";
				var oView = this.getView();
				oView.bindElement({
					path: path
				});
				var oSitCont = oView.getModel().getObject(path);
				this._DisplayForms(oSitCont.Tipsc);
				
				var oSelectTipSC = this.getView().byId("Tipsc");
				oSelectTipSC.setEnabled(false);
			}
		},

		_fnEntityCreated: function (oData) {
			var sObjectPath = this.getModel().createKey("SitContSet", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath);
			this.getModel("appView").setProperty("/busy", false);
		},

		_fnEntityCreationFailed: function (oData) {
			var oMessage = JSON.parse(oData.responseText);
			MessageBox.error(oMessage.error.innererror.errordetails[0].message);
			this.getModel("appView").setProperty("/busy", false);
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

		onSave: function () {
			var oTipSC = this.getView().byId("Tipsc").getSelectedKey();
			if (oTipSC === "") {
				MessageBox.error("Ha d'informar el tipus de situaci\xF3 contractual");
				return;
			}
			var that = this,
				oModel = this.getModel();
			if (this._oViewModel.getProperty("/mode") === "create") {
				if (!oModel.hasPendingChanges()) {
					MessageBox.information(this._oResourceBundle.getText("noChangesMessage"), {
						id: "noChangesInfoMessageBox",
						styleClass: that.getOwnerComponent().getContentDensityClass()
					});
					return;
				}
				this.getModel("appView").setProperty("/busy", true);

				oModel.attachEventOnce("batchRequestCompleted", function (oEvent) {
					if (that._checkIfBatchRequestSucceeded(oEvent)) {
						that._fnUpdateSuccess();
					} else {
						that._fnEntityCreationFailed();
					}
				});
				oModel.submitChanges();
			} else {
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
			}
			this._NavBack();
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
		
		_NavBack: function () {
			if ( this._oViewModel.getProperty("/from") === "detail" ) {
				var oEventBus = sap.ui.getCore().getEventBus();
				this.getView().unbindObject();
				oEventBus.publish("UpdateExp", "changeApp");
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
					}); //This code was generated by the layout editor.			
				}
			}
		},

		onChangeTipSC: function (oEvent) {
			var oTipSC = oEvent.getParameters().selectedItem.getKey(); //oEvent.getSource().getSelectedKey();
			this._DisplayForms(oTipSC);
		},
		
		_DisplayForms: function (oTipSC){
			var oFormCE = this.getView().byId("CE_Form");
			var oFormLI = this.getView().byId("LI_Form");
			var oFormMO = this.getView().byId("MO_Form");
			var oFormPR = this.getView().byId("PR_Form");
			var oCausa = this.getView().byId("Cauliqr_id");
			var oIncGar = this.getView().byId("Incgdefi_id"); 
			var oDatRF = this.getView().byId("Drecfin_id");
			
			switch(oTipSC) {
				case "CE":
					oFormCE.setVisible(true);
					oFormLI.setVisible(false);
					oFormMO.setVisible(false);
					oFormPR.setVisible(false);
					break;
				case "LR":
					oFormCE.setVisible(false);
					oFormLI.setVisible(true);
					oFormMO.setVisible(false);
					oFormPR.setVisible(false);
					oCausa.setVisible(true);
					oIncGar.setVisible(true);
					oDatRF.setVisible(false);
					break;
				case "LC":
					oFormCE.setVisible(false);
					oFormLI.setVisible(true);
					oFormMO.setVisible(false);
					oFormPR.setVisible(false);
					oCausa.setVisible(false);
					oIncGar.setVisible(false);
					oDatRF.setVisible(true);
					break;
				case "MO":
					oFormCE.setVisible(false);
					oFormLI.setVisible(false);
					oFormMO.setVisible(true);
					oFormPR.setVisible(false);
					break;
				case "PO":
					oFormCE.setVisible(false);
					oFormLI.setVisible(false);
					oFormMO.setVisible(false);
					oFormPR.setVisible(true);
					break;
			}
			
		},
		
		onEdit: function (oEvent) {
			this._oViewModel.setProperty("/mode", "edit");
		},
		
		onAttachUpload: function (oEvent) {
			var oFieldsRequired = this._checkDocFields();
			if ( oFieldsRequired === false ) {
				return;
			}
			var oView = this.getView();
			var oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			var oSitCont = oView.getModel().getObject(sPath);
			this.oDocModel = new JSONModel({
				entity: "ExpedientSet",
				Codiexp: oSitCont.Codiexp,
				Codilot: oSitCont.Codilot,
				Codiofer: oSitCont.Codiofer,
				Tipsc: oSitCont.Tipsc,
				Numsc: oSitCont.Numsc
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
		
		_onModeIVA: function(oEvent) {
			this.calcIVA("Impmodif_id","Ivamodif","Impmodifiva_id");
		},		

		_onRestIVA: function(oEvent) {
			this.calcIVA("Imprest_id","Ivarest","Imprestiva_id");
		},
		
		_onLiqIVA: function(oEvent) {
			this.calcIVA("Impliqui_id","Ivaliqui","Impliquiiva_id");
		},
		
		onAddIntegra: function(oEvent){
			aFilter = [];
			if (!this.oIntDialog) {
				this.oIntDialog = sap.ui.xmlfragment("CRUD_EXP.CRUD_Exp.view.IntSC", this.getView().getController());
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
					this.oDocDialog = sap.ui.xmlfragment("CRUD_EXP.CRUD_Exp.view.DocSC", this.getView().getController());
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
			aFilter.push(new sap.ui.model.Filter("Tipsc", sap.ui.model.FilterOperator.EQ, oObject.Tipsc));
			aFilter.push(new sap.ui.model.Filter("Numsc", sap.ui.model.FilterOperator.EQ, oObject.Numsc));

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