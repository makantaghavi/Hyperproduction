var ContainerMapNode = require("hp/model/ContainerMapNode");
var ComputeModules = require("hp/model/ComputeModules");
var OscDeviceModules = require("hp/model/OscDeviceModules");
var bb = require("hp/model/benb_utils");
var ipc = require('ipc');
var l = require("hp/model/log");

var PanelFailoverDisplay = function (id) {
	var that = this;
	this.id = id;

	this.initPanel = function (container, componentState) {
		that.headsUpContainer = document.createElement('div');
		that.headsUpContainer.id = id;
		that.headsUpContainer.className="headsup";

		container.getElement()[0].appendChild(that.headsUpContainer);

		// that.headsUpContainer.appendChild(that.makeIndicatorLight("Auto Select","auto-indicator","#444"));
		// that.headsUpContainer.appendChild(that.makeButton("Auto Select","autobtn","#444"));

		// that.headsUpContainer.appendChild(that.makeIndicatorLight("Auto Select","wifi24-indicator","#444"));
		// that.headsUpContainer.appendChild(that.makeButton("Wireless 2.4Ghz","wifi24","#444"));

		// that.headsUpContainer.appendChild(that.makeIndicatorLight("Auto Select","uhf-indicator","#444"));
		// that.headsUpContainer.appendChild(that.makeButton("Wireless UHF","uhf","#444"));

		// that.headsUpContainer.appendChild(that.makeIndicatorLight("Auto Select","wifi58-indicator","#444"));
		// that.headsUpContainer.appendChild(that.makeButton("Wireless 5.8Ghz","wifi58","#444"));

		//document.getElementById("auto").className += " btn-selected";

		var tblLeft = that.makeTable("left",["Receiving Data", "Source Active", "Select Source"], ["auto", "wifi24", "uhf"]);
		var tblRight = that.makeTable("right",["Receiving Data", "Source Active", "Select Source"], ["auto", "wifi24", "uhf"]);



		var gloveLeft = document.createElement("div")
		gloveLeft.appendChild(that.makeLabel("Glove Left Status"));
		gloveLeft.appendChild(tblLeft)
		gloveLeft.className="failover-panel"

		var gloveRight = document.createElement("div")
		gloveRight.appendChild(that.makeLabel("Glove Right Status"));
		gloveRight.appendChild(tblRight)
		gloveRight.className="failover-panel"


		that.headsUpContainer.appendChild(gloveLeft);
		that.headsUpContainer.appendChild(gloveRight);

		ipc.on('failover-ui-event', function(refcon){
		   //console.log('failover event', refcon);
	       switch (refcon.action) {
	          case 'packet-counts':
	            //console.log("Packet-count", refcon);
	            that.setPacketCounts(refcon.counts,refcon.name);
	            break;
	          case 'switched-input-source':
	          	that.setActiveSource(refcon.source, refcon.name);
	          	break;
	          case 'select-btn':
	          	that.selectBtn(refcon.source,refcon.name);
	          default:
	            break;
	        }
		});


		document.addEventListener('DOMContentLoaded', that.ready, false);
	}

	this.setPacketCounts = function(counts,globalid) {
		bb.forEachObjKey(counts, function(src,cnt){
			//console.log(src,cnt,globalid);
	        $("#pps-"+src+"-"+globalid).html(cnt);
	        if (parseInt(cnt)>=40) $("#"+src+"-"+globalid+" > td.data-good-lgt").addClass("active");
	        else $("#"+src+"-"+globalid+" > td.data-good-lgt").removeClass("active");
	    });
	}

	this.setActiveSource = function(source,globalid) {
		$("#"+globalid+" td.source-active-lgt").removeClass("active").html("");
		$("#"+source+"-"+globalid+" > td.source-active-lgt").addClass("active").html("<label class='active-txt'>ACTIVE</label>");
	}


	this.makeLabel = function (text) {
		var l = document.createElement("label");
		l.innerHTML = text;
		return l;
	}

	this.makeField = function (id,text, defval) {
		defval = defval || "";
		var f = document.createElement("div");
		f.appendChild(this.makeLabel(text+": "));
		var val = document.createElement("span")
		val.id = id;
		val.innerHTML=defval
		f.appendChild(val);
		f.className = 'failover-field'
		return f;

	}
 
	this.makeTable = function (globalid, header, rows) {

		var that = this;
		var tbl = document.createElement("table");
		tbl.className = 'failover-tbl'
		tbl.id = globalid;
		// var thead = document.createElement("thead");
		var tbody = document.createElement("tbody");


		// var tr = document.createElement("tr");
		// header.forEach(function (el){
		// 	var l = document.createTextNode(el);
		// 	var td = document.createElement("td");
		// 	td.appendChild(l);
		// 	tr.appendChild(td);
		// });

		rows.forEach(function (el) {
			tbody.appendChild(that.makeIndicatorRow(el, globalid, el !== 'auto'));
		});

		// thead.appendChild(tr);
		//tbl.appendChild(thead);
		tbl.appendChild(tbody);

		return tbl
	}

	this.makeIndicatorRow = function (key,globalid,dataSource) {
		var tr = document.createElement("tr");
		var that = this;
		tr.id = key+"-"+globalid;

		var dataGood = document.createElement("td");
		dataGood.className = "data-good-lgt";

		var goodDataStatus = document.createElement("div");
		goodDataStatus.appendChild(this.makeField("pps-"+key+"-"+globalid, "pps", "0"));

		if (dataSource) {
			dataGood.appendChild(goodDataStatus);
		}

		var sourceActive = document.createElement("td");
		sourceActive.className = "source-active-lgt";

		var selectSource= document.createElement("td");
		selectSource.className = "select-source-btn";
		selectSource.setAttribute("data-globalid",globalid);

		selectSource.innerHTML = key;
		selectSource.addEventListener('click', function(e) {
		  console.log("Clicked", key, globalid);
		  ipc.send('ui-event', {
		    "action": "ui-event",
		    "id": globalid,
		    "source": key
		  });
		});

		tr.appendChild(dataGood);
		tr.appendChild(sourceActive);
		tr.appendChild(selectSource);

		return tr
	}

	this.makeButton = function (text,id,color) {
		var btn = document.createElement('button')
		btn.className = 'btn-base';
		btn.id = id;
		btn.innerHTML = text;
		return btn;
	}

	this.makeIndicatorLight = function (text,id,color) {
		var light = document.createElement('div')
		light.className = 'light-base';
		light.id = id;
		return light;
	}

	this.selectBtn = function (source,globalid) {
		console.log("Selecting btn", source, globalid);
		$("#"+globalid+" tr").removeClass("btn-selected");
		$("#"+source+"-"+globalid).addClass("btn-selected");
	}

	this.ready = function () {
		//console.log(that.headsUpContainer);
	}

}


module.exports = PanelFailoverDisplay;