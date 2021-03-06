sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"CRUD_EXP/CRUD_Exp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment"
], function (Controller,BaseController, JSONModel, MessageBox) {
	"use strict";

	return BaseController.extend("CRUD_EXP.CRUD_Exp.controller.Factura", {
		onInit: function () {
			var that = this;
			this.getRouter().getTargets().getTarget("Factura").attachDisplay(null, this._onDisplay, this);
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

		_onDisplay: function(oEvent) {
			var oDataEvent = oEvent.getParameter("data");
			this._oViewModel.setProperty("/from", oDataEvent.from);
			this._oViewModel.setProperty("/mode", "display");
			this._oViewModel.setProperty("/enableDel", "None");	
			this._oViewModel.setProperty("/QuanVis", false);
			this._oViewModel.setProperty("/CodiExp", oDataEvent.codiexp);
			this._oViewModel.setProperty("/CodiLot",oDataEvent.codilot);
			if (oDataEvent.doctable === "EKKO"){
				this._oViewModel.setProperty("/QuanVis", true);
			}
			var path = "/FacturesSet(Buzei='" + oDataEvent.buzei + "',DocTable='" + oDataEvent.doctable 
						+ "',Document='" + oDataEvent.document + "',Bukrs='" + oDataEvent.bukrs + 
						"',Gjahr='" + oDataEvent.gjahr + "')";
			var oView = this.getView();
			oView.bindElement({
				path: path
			});
		},

		onCancel: function() {
			if ( this._oViewModel.getProperty("/from") === "detail" ) {
				var oEventBus = sap.ui.getCore().getEventBus();
				this.getView().unbindObject();
				oEventBus.publish("Detail", "changeApp");
				sap.ui.core.UIComponent.getRouterFor(this).navTo("master", {});
			} else {			
				var oCodiExp = this._oViewModel.getProperty("/CodiExp");
				var oCodiLot = this._oViewModel.getProperty("/CodiLot");
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
		}
	});

});