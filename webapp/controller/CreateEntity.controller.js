sap.ui.define([
	"CRUD_EXP/CRUD_Exp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox"
], function (BaseController, JSONModel, MessageBox) {
	"use strict";
	return BaseController.extend("CRUD_EXP.CRUD_Exp.controller.CreateEntity", {
		_oBinding: {},
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onInit: function () {
			var that = this;
			this.getRouter().getTargets().getTarget("create").attachDisplay(null, this._onCreate, this);
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
			if (oMandt === "100"){
				var oObject = this.getView().byId("selecttipex");
				oObject.setVisible(false);
				var oObject2 = this.getView().byId("selectcentre");
				oObject2.setVisible(false);
			}

		},
		onAfterRendering: function () {
			var oSaveAction = this.getView().byId("save");
			var oButton = oSaveAction.getAggregation("_control");
			oButton.setText("Crear");
			var oCancelAction = this.getView().byId("cancel");
			var oButton = oCancelAction.getAggregation("_control");
			oButton.setText("Cancel\xB7lar");
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Event handler (attached declaratively) for the view save button. Saves the changes added by the user. 
		 * @function
		 * @public
		 */
		onSave: function () {
			var oObject = this.getView().byId("area0").getValue();
			if (oObject === "") {
				MessageBox.error("Ha d'informar l'objecte");
				return;
			}
			
			var oModalitat = this.getView().byId("selectmod").getSelectedKey();
			if (oModalitat === "") {
				MessageBox.error("Ha d'informar la modalitat");
				return;
			}
			
			var oProcediment = this.getView().byId("selectproc").getSelectedKey();
			if (oProcediment === "") {
				MessageBox.error("Ha d'informar el procediment");
				return;
			}
			
			var oAcordMarc = this.getView().byId("Acordmr_id").getValue();
			if (oProcediment === "DA" && oAcordMarc === "") {
				MessageBox.error("Ha d'informar l'acord marc relacionat");
				return;
			}
						
			var oSuposit = this.getView().byId("selectsup").getSelectedKey();
			if (oProcediment === "NS" && oSuposit === "") {
				MessageBox.error("Ha d'informar el supòsit de negociat");
				return;
			}

			var oTipus = this.getView().byId("selectcont").getSelectedKey();
			if (oTipus === "") {
				MessageBox.error("Ha d'informar el tipus de contracte");
				return;
			}

			var oSubTipus = this.getView().byId("selectsub").getSelectedKey();
			if (oSubTipus === "") {
				MessageBox.error("Ha d'informar el subtipus de contracte");
				return;
			}

			var oLots = this.getView().byId("Lots_id").getSelected();
			var oNumLots = this.getView().byId("Numlots_id").getValue();
			if (oLots === true && oNumLots === "") {
				MessageBox.error("Ha d'informar el número de lots");
				return;
			}

			var oTipex = this.getView().byId("selecttipex").getSelectedKey();
			if (oMandt === "200" && oTipex === ""){
				MessageBox.error("Ha d'informar el tipus d'expedient");
				return;
			}

			var oCentre = this.getView().byId("selectcentre").getSelectedKey();
			if (oMandt === "200" && oCentre === ""){
				MessageBox.error("Ha d'informar el centre");
				return;
			}

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
			if (this._oViewModel.getProperty("/mode") === "create") {
				// attach to the request completed event of the batch
				oModel.attachEventOnce("batchRequestCompleted", function (oEvent) {
					if (that._checkIfBatchRequestSucceeded(oEvent)) {
						that._fnUpdateSuccess(oEvent);
					} else {
						that._fnEntityCreationFailed();
						MessageBox.error("Falten dades obligatòries");
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

		onCancel: function () {
			if (this.getModel().hasPendingChanges()) {
				this._showConfirmQuitChanges(); // some other thing here....
			} else {
				this.getModel("appView").setProperty("/addEnabled", true);
				this._navBack();
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

		_showConfirmQuitChanges: function () {
			var oComponent = this.getOwnerComponent(),
				oModel = this.getModel();
			var that = this;
			MessageBox.confirm(this._oResourceBundle.getText("confirmCancelMessage"), {
				styleClass: oComponent.getContentDensityClass(),
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						that.getModel("appView").setProperty("/addEnabled", true);
						oModel.resetChanges();
						that._navBack();
					}
				}
			});
		},

		_onCreate: function (oEvent) {
			if (oEvent.getParameter("name") && oEvent.getParameter("name") !== "create") {
				this._oViewModel.setProperty("/enableCreate", false);
				this.getRouter().getTargets().detachDisplay(null, this._onDisplay, this);
				this.getView().unbindObject();
				return;
			}
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("createViewTitle"));
			this._oViewModel.setProperty("/mode", "create");
			var oContext = this._oODataModel.createEntry("ExpedientSet", {
				success: this._fnEntityCreated.bind(this),
				error: this._fnEntityCreationFailed.bind(this)
			});
			this.getView().setBindingContext(oContext);
		},

		_fnUpdateSuccess: function (oEvent) {
			this.getModel("appView").setProperty("/busy", false);
			this.getView().unbindObject();
			this.getRouter().getTargets().display("object");
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("UpdateExp", "changeApp");
			sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});
			var oUrl = oEvent.getParameters().requests[0].response.headers.location.toString();
			var sObjectPath = oUrl.substr(oUrl.lastIndexOf('/'));
			this.getRouter().getTargets().display("UpdateExp", {
				objectPath: sObjectPath
			});
			
		},

		_fnEntityCreated: function (oData) {
			var sObjectPath = this.getModel().createKey("ExpedientSet", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath);
			this.getModel("appView").setProperty("/busy", false);
			this.getRouter().getTargets().display("object");
		},

		_fnEntityCreationFailed: function () {
			this.getModel("appView").setProperty("/busy", false);
		},

		onLots: function (oEvent) {
			var selected = oEvent.getSource().getSelected();
			var oNumLots = this.getView().byId("Numlots_id");
			oNumLots.setVisible(selected);
		},

		onChangeProcediment: function (oEvent) {
			var oProced = oEvent.getSource().getSelectedKey();
			var oBasat = this.getView().byId("Acordmr_id");
			var oSuposit = this.getView().byId("selectsup");
			
			if (oProced === "DA" || oProced === "B"){
				oBasat.setVisible(true);
			} else {
				oBasat.setVisible(false);
			}
			if (oProced === "NS" || oProced === "S"){
				oSuposit.setVisible(true);
			} else {
				oSuposit.setVisible(false);
			}
		}
	});
});