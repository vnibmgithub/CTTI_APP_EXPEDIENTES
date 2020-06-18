/*global location */
sap.ui.define([
	"CRUD_EXP/CRUD_Exp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"CRUD_EXP/CRUD_Exp/model/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (BaseController, JSONModel, formatter, MessageBox, MessageToast) {
	"use strict";
	return BaseController.extend("CRUD_EXP.CRUD_Exp.controller.Detail", {
		formatter: formatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			this._oODataModel = this.getOwnerComponent().getModel();
			this._oResourceBundle = this.getResourceBundle();
		},

		onAfterRendering: function () {
			var oSaveAction = this.getView().byId("edit");
			var oButton = oSaveAction.getAggregation("_control");
			oButton.setText("Expedient");
		},

		onShareEmailPress: function () {
			var oViewModel = this.getModel("detailView");
			sap.m.URLHelper.triggerEmail(null, oViewModel.getProperty("/shareSendEmailSubject"), oViewModel.getProperty(
				"/shareSendEmailMessage"));
		},

		onShareInJamPress: function () {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		onListUpdateFinished: function (oEvent) {
			var sTitle, iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");
			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		onDelete: function () {
			var that = this;
			var oViewModel = this.getModel("detailView"),
				sPath = oViewModel.getProperty("/sObjectPath"),
				sObjectHeader = this._oODataModel.getProperty(sPath + "/Objecte"),
				sQuestion = this._oResourceBundle.getText("deleteText", sObjectHeader),
				sSuccessMessage = this._oResourceBundle.getText("deleteSuccess", sObjectHeader);
			var fnMyAfterDeleted = function () {
				MessageToast.show(sSuccessMessage);
				oViewModel.setProperty("/busy", false);
				var oNextItemToSelect = that.getOwnerComponent().oListSelector.findNextItem(sPath);
				that.getModel("appView").setProperty("/itemToSelect", oNextItemToSelect.getBindingContext().getPath()); //save last deleted
			};
			this._confirmDeletionByUser({
				question: sQuestion
			}, [sPath], fnMyAfterDeleted);
		},

		onEdit: function () {
			this.getModel("appView").setProperty("/addEnabled", false);
			var sObjectPath = this.getView().getElementBinding().getPath();
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("UpdateExp", "changeApp");
			sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});
			this.getRouter().getTargets().display("UpdateExp", {
				objectPath: sObjectPath
			});
		},

		_onObjectMatched: function (oEvent) {
			this.getView().unbindObject();
			var oParameter = oEvent.getParameter("arguments");
			for (var value in oParameter) {
				oParameter[value] = decodeURIComponent(oParameter[value]);
			}
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("ExpedientSet", oParameter);
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");
			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding(),
				oViewModel = this.getModel("detailView"),
				oAppViewModel = this.getModel("appView");
			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}
			var sPath = oElementBinding.getBoundContext().getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Codiexp,
				sObjectName = oObject.Objecte;
			var oBasat = this.getView().byId("AcordMarcaRel");
			if (oObject.Procedim === "DA") {
				oBasat.setVisible(true);
			} else {
				oBasat.setVisible(false);
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
			if (oMandt === "100") {
				var oObject2 = this.getView().byId("CentreText");
				oObject2.setVisible(false);
			}			
			oViewModel.setProperty("/sObjectId", sObjectId);
			oViewModel.setProperty("/sObjectPath", sPath);
			oAppViewModel.setProperty("/itemToSelect", sPath);
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [
				sObjectName,
				sObjectId,
				location.href
			]));
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");
				// oLineItemTable = this.byId("lineItemsList");
//				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();
			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);
			// oLineItemTable.attachEventOnce("updateFinished", function () {
			// 	// Restore original busy indicator delay for line item table
			// 	oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			// });
			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		_confirmDeletionByUser: function (oConfirmation, aPaths, fnAfterDeleted, fnDeleteCanceled, fnDeleteConfirmed) {
			/* eslint-enable */
			// Callback function for when the user decides to perform the deletion
			var fnDelete = function () {
				// Calls the oData Delete service
				this._callDelete(aPaths, fnAfterDeleted);
			}.bind(this);
			// Opens the confirmation dialog
			MessageBox.show(oConfirmation.question, {
				icon: oConfirmation.icon || MessageBox.Icon.WARNING,
				title: oConfirmation.title || this._oResourceBundle.getText("delete"),
				actions: [
					MessageBox.Action.OK,
					MessageBox.Action.CANCEL
				],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.OK) {
						fnDelete();
					} else if (fnDeleteCanceled) {
						fnDeleteCanceled();
					}
				}
			});
		},

		_callDelete: function (aPaths, fnAfterDeleted) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", true);
			var fnFailed = function () {
				this._oODataModel.setUseBatch(true);
			}.bind(this);
			var fnSuccess = function () {
				if (fnAfterDeleted) {
					fnAfterDeleted();
					this._oODataModel.setUseBatch(true);
				}
				oViewModel.setProperty("/busy", false);
			}.bind(this);
			return this._deleteOneEntity(aPaths[0], fnSuccess, fnFailed);
		},

		_deleteOneEntity: function (sPath, fnSuccess, fnFailed) {
			var oPromise = new Promise(function (fnResolve, fnReject) {
				this._oODataModel.setUseBatch(false);
				this._oODataModel.remove(sPath, {
					success: fnResolve,
					error: fnReject,
					async: true
				});
			}.bind(this));
			oPromise.then(fnSuccess, fnFailed);
			return oPromise;
		},

		onSelDoc: function (oEvent) {
			this.getFile(oEvent);
		},
		
		onDocListUpdateFinished: function (oEvent) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/numDocs", oEvent.getParameter("total"));
		},

		onSelLot: function (oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var oCodiExp = oItem.getBindingContext().getProperty("Codiexp");
			var oCodiLot = oItem.getBindingContext().getProperty("Codilot");
			this.getModel("appView").setProperty("/addEnabled", false);
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("Lot", "changeApp");
			sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});
			this.getRouter().getTargets().display("Lot", {
				codiexp: oCodiExp,
				codilot: oCodiLot,
				from: "detail"
			});
		},

		onSelFact: function (oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var oBuzei = oItem.getBindingContext().getProperty("Buzei");
			var oDocTable = oItem.getBindingContext().getProperty("DocTable");
			var oDocument = oItem.getBindingContext().getProperty("Document");
			var oBukrs = oItem.getBindingContext().getProperty("Bukrs");
			var oGjahr = oItem.getBindingContext().getProperty("Gjahr");
			
			this.getModel("appView").setProperty("/addEnabled", false);
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("Factura", "changeApp");
			sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});
			this.getRouter().getTargets().display("Factura", {
				buzei: oBuzei,
				doctable: oDocTable,
				document: oDocument,
				bukrs: oBukrs,
				gjahr: oGjahr,
				from: "detail"
			});
		},
		
		onSCListUpdateFinished: function (oEvent) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/numSC", oEvent.getParameter("total"));
		},
		
		onSelSC: function (oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var oCodiexp = oItem.getBindingContext().getProperty("Codiexp");
			var oCodilot = oItem.getBindingContext().getProperty("Codilot");
			var oCodiofer = oItem.getBindingContext().getProperty("Codiofer");
			var oTipsc = oItem.getBindingContext().getProperty("Tipsc");
			var oNumsc = oItem.getBindingContext().getProperty("Numsc");
			this.getModel("appView").setProperty("/addEnabled", false);
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("SitCont", "changeApp");
			sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});

			this.getRouter().getTargets().display("SitCont", {
				codiexp: oCodiexp,
				codilot: oCodilot,
				codiofe: oCodiofer,
				tipsc: oTipsc,
				numsc: oNumsc,
				mode: "display",
				from: "detail"
			});
		},
		
		onFactListUpdateFinished: function (oEvent) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/numFact", oEvent.getParameter("total"));
		},
		
		onOferListUpdateFinished: function (oEvent) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/numOfer", oEvent.getParameter("total"));
		},
		
		onSelOferta: function (oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var oCodiexp = oItem.getBindingContext().getProperty("Codiexp");
			var oCodilot = oItem.getBindingContext().getProperty("Codilot");
			var oCodiofer = oItem.getBindingContext().getProperty("Codiofer");
			this.getModel("appView").setProperty("/addEnabled", false);
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("Oferta", "changeApp");
			sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});

			this.getRouter().getTargets().display("Oferta", {
				codiexp: oCodiexp,
				codilot: oCodilot,
				codiofe: oCodiofer,
				mode: "display",
				from: "detail"
			});
		}
		
	});
});