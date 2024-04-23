/*
	Move Art Between Art Layers
	
	A macro script for swapping, replacing, duplicating, merging or deleting art between art layers for all exposed cells. 
	This script is compatible with Harmony 15 and up.
	
		v1.3 - Added "Merge All" operation
		v1.4 - Dialog can now stay open. Function can be called from any toolbar.
			   No longer change selection tool's property and current art layer after running script.
			   Shortcut buttons has been added.
		v1.5 - On Harmony 16 and up, having "Apply to All Frames" button turned on will no longer cause an issue. 
		v1.6 - This script no longer changes the current tool, Select tool properties and art layer modes.
		v1.7 - Turned "Apply to all frames" option into a radio button for better user experience.
		v1.8 - Main dialog widget acts as a child of Harmony application.
		v1.81 - "drawing.elementMode" attribute is changed to "drawing.ELEMENT_MODE" to accomodate Harmony 22 update.
			   
	
	Installation:
	
	1) Download and Unarchive the zip file.
	2) Locate to your user scripts folder (a hidden folder):
	   https://docs.toonboom.com/help/harmony-17/premium/scripting/import-script.html	
	   
	3) There is a folder named "src" inside the zip file. Copy all its contents directly to the folder above.
	4) In Harmony, add ANM_Art_Layer_Wizard to any toolbar.
	5) Optinally, you can add shortcut buttons of each functions to any toolbar:
	
			ANM_Swap_Art, ANM_Merge_Art, ANM_Merge_All_Art, ANM_Duplicate_Art, ANM_Replace_Art, ANM_Clear_Art

	   	  
	Direction (Art Layer Wizard):

	1) Select a drawing node from camera, node or timeline view.
	2) Run ANM_Art_Layer_Wizard.
	3a) If you want to run this script on specific frame(s), toggle "Apply to selected frame(s)" radio button then highlight the frames.
	3b) If you want to run this script on all frames on the selected drawing node, toggle "Apply to all frames" radio button.
	4) Set source and destination art layer and then click on the button of the function you want to call.
	5) Preferences will be automatically saved each time you leave or close the dialog, unless no change is made.
	   
	 
	Direction (Shortcut Buttons):
	
	1) Select a drawing node from camera, node or timeline view.
	2) Click on the shortcut button.

		
	Author:

	Yu Ueda (raindropmoment.com)
	
	The core function of this script is based on eAthis, Marie-EveChartrand, stefman, nickyb2k16,
	TheRaider, and lillyV's code found on the following forum posts. (Thank you!):
	https://forums.toonboom.com/harmony/support-and-troubleshooting/how-set-focus-lineedit-qtscript		
	https://forums.toonboom.com/harmony/general-discussion/custom-script
	https://forums.toonboom.com/toon-boom-animate-family/general-discussion/my-scripting-issues
	Additional thanks to MattiasG and Mathieu C for providing feedbacks.
	Also thanks for Liza and Toon Boom for managing the amazing Discord channels!
*/

var scriptVer = "1.81";	


function ANM_Art_Layer_Wizard()
{
	var pd = new private_dialog();
	pd.showUI();
}

function ANM_Swap_Art()
{
	var pf = new private_functions();	
	pf.directCall("swap");
}

function ANM_Merge_Art()
{
	var pf = new private_functions();	
	pf.directCall("merge");
}

function ANM_Merge_All_Art()
{
	var pf = new private_functions();	
	pf.directCall("mergeAll");
}

function ANM_Duplicate_Art()
{
	var pf = new private_functions();	
	pf.directCall("duplicate");
}

function ANM_Replace_Art()
{
	var pf = new private_functions();	
	pf.directCall("replace");
}

function ANM_Clear_Art()
{
	var pf = new private_functions();	
	pf.directCall("clear");
}




function private_dialog()
{
	var pf = new private_functions();
	
	// load UI
	this.ui = pf.createUI();	

	// load preference, set ui state
	this.showUI = function()
	{
		var pref = pf.loadPref();
		this.ui.show();
		
		this.toolTipString = "";
		
		this.savedData = pref.savedData;
		var coord = pf.loadUiCoord();
		this.ui.move(coord.x, coord.y);	
		this.applyAll = !!(pref.applyAll);
		this.ui.applyAllFramesRB.checked = !!(pref.applyAll);
		this.ui.applySelFramesRB.checked = !this.applyAll;
		this.ui.srcOverlayRB.checked = !!(pref.srcLayer & (1 << 3));
		this.ui.srcLineRB.checked = !!(pref.srcLayer & (1 << 2));
		this.ui.srcColorRB.checked = !!(pref.srcLayer & (1 << 1));
		this.ui.srcUnderlayRB.checked = !!(pref.srcLayer & 1);
		this.ui.dstOverlayRB.checked = !!(pref.dstLayer & (1 << 3));
		this.ui.dstLineRB.checked = !!(pref.dstLayer & (1 << 2));
		this.ui.dstColorRB.checked = !!(pref.dstLayer & (1 << 1));
		this.ui.dstUnderlayRB.checked = !!(pref.dstLayer & 1);
		
		this.refreshSelection();
	}

	this.refreshSelection = function()
	{			
		var sNode = selection.selectedNodes(0);
		if (selection.numberOfNodesSelected == 0 || node.type(sNode) !== "READ")
		{	
			this.node = null;
			this.ui.toolTipLabel.setStyleSheet("QLabel{color: red}");	
			this.toolTipString = "No drawing selected"
			this.ui.toolTipLabel.text = this.toolTipString;
			this.ui.clearButton.enabled = false;
			this.ui.swapButton.enabled = false;
			this.ui.mergeButton.enabled = false;
			this.ui.mergeAllButton.enabled = false;
			this.ui.replaceButton.enabled = false;
			this.ui.duplicateButton.enabled = false;
		}
		else
		{
			this.node = sNode;
			this.ui.toolTipLabel.setStyleSheet("");	
			this.toolTipString = "";	
			this.ui.toolTipLabel.text = this.toolTipString;	
			this.ui.clearButton.enabled = true;
			this.ui.mergeAllButton.enabled = true;			
						
			if (this.mode !== "clear" && this.mode !== "mergeAll" && this.dstLayer == this.srcLayer)
			{
				this.ui.swapButton.enabled = false;
				this.ui.mergeButton.enabled = false;
				this.ui.replaceButton.enabled = false;
				this.ui.duplicateButton.enabled = false;
			}			
			else
			{
				this.ui.swapButton.enabled = true;
				this.ui.mergeButton.enabled = true;
				this.ui.replaceButton.enabled = true;
				this.ui.duplicateButton.enabled = true;									
			}		
		}
	}
		
	// list of functions called when user interact
	this.applySelFramesRBToggled = function(boolVal)
	{	
		this.applyAll = !boolVal;
	}	
	this.applyAllFramesRBToggled = function(boolVal)
	{	
		this.applyAll = boolVal;
	}
	this.srcOverlayRBToggled = function(boolVal)
	{
		if (boolVal)
			this.srcLayer = 8;
		this.refreshSelection();	
	}	
	this.srcLineRBToggled = function(boolVal)
	{
		if (boolVal)
			this.srcLayer = 4;
		this.refreshSelection();		
	}
	this.srcColorRBToggled = function(boolVal)
	{
		if (boolVal)
			this.srcLayer = 2;
		this.refreshSelection();	
	}
	this.srcUnderlayRBToggled = function(boolVal)
	{
		if (boolVal)
			this.srcLayer = 1;
		this.refreshSelection();	
	}
	this.dstOverlayRBToggled = function(boolVal)
	{
		if (boolVal)
			this.dstLayer = 8;
		this.refreshSelection();	
	}	
	this.dstLineRBToggled = function(boolVal)
	{
		if (boolVal)
			this.dstLayer = 4;
		this.refreshSelection();
	}
	this.dstColorRBToggled = function(boolVal)
	{
		if (boolVal)
			this.dstLayer = 2;
		this.refreshSelection();	
	}
	this.dstUnderlayRBToggled = function(boolVal)
	{
		if (boolVal)
			this.dstLayer = 1;
		this.refreshSelection();	
	}	
	this.clearButtonReleased = function()
	{
		this.mode = "clear";
		pf.junction(this);				
	}
	this.swapButtonReleased = function()
	{
		this.mode = "swap";
		pf.junction(this);				
	}	
	this.mergeButtonReleased = function()
	{
		this.mode = "merge";
		pf.junction(this);			
	}	
	this.mergeAllButtonReleased = function()
	{
		this.mode = "mergeAll";
		pf.junction(this);				
	}	
	this.replaceButtonReleased = function()
	{
		this.mode = "replace";
		pf.junction(this);				
	}	
	this.duplicateButtonReleased = function()
	{	
		this.mode = "duplicate";
		pf.junction(this);				
	}	
	this.closeButtonReleased = function()
	{
		pf.savePref(this);
		pf.saveUiCoord(this);				
		this.ui.close();
	}
	
	/* if software version is 16 or higher, use SCN class to signal when selection is changed.
	else, use QWidget::changeEvent instead */
	var main = this;
	var softwareVer = pf.getSoftwareVer();		
	if (softwareVer >= 16)
	{
		var scn = new SceneChangeNotifier(this.ui);
		scn.selectionChanged.connect(this, this.refreshSelection);
		
		// save preference everytime user leaves dialog and also pref is different from the last save
		this.ui.changeEvent = function()
		{
			if (!main.ui.isActiveWindow)
				main.savedData = pf.savePref(main);
		}	
	}
	else
	{
		this.ui.changeEvent = function()
		{
			if (!main.ui.isActiveWindow)
			{
				main.ui.toolTipLabel.setStyleSheet("");
				main.ui.applyAllFramesRB.enabled = false;
				main.ui.opBox.enabled = false;
				main.ui.toolTipLabel.text = "Select this dialog after selecting a drawing";
				main.savedData = pf.savePref(main);
			}
			else
			{
				main.ui.toolTipLabel.setStyleSheet("");
				main.ui.applyAllFramesRB.enabled = true;
				main.ui.opBox.enabled = true;
				main.refreshSelection();		
			}
		}
	}

	// mouse hover events on buttons
	this.ui.applySelFramesRB.enterEvent = function()
	{
		main.ui.toolTipLabel.setStyleSheet("");
		main.ui.toolTipLabel.text = "Repeat the same operation on the selected frames range";	
	}
	this.ui.applySelFramesRB.leaveEvent = function()
	{		
		main.ui.toolTipLabel.text = main.toolTipString;			
	}	
	this.ui.applyAllFramesRB.enterEvent = function()
	{
		main.ui.toolTipLabel.setStyleSheet("");
		main.ui.toolTipLabel.text = "Repeat the same operation on all frames";	
	}
	this.ui.applyAllFramesRB.leaveEvent = function()
	{		
		main.ui.toolTipLabel.text = main.toolTipString;			
	}
	this.ui.clearButton.enterEvent = function()
	{
		if (main.ui.clearButton.enabled)
		{
			main.ui.toolTipLabel.setStyleSheet("");
			main.ui.toolTipLabel.text = "Clear source layer";
			main.ui.dstBox.enabled = false;
		}
	}
	this.ui.clearButton.leaveEvent = function()
	{
		if (main.ui.clearButton.enabled)
		{		
			main.ui.toolTipLabel.text = main.toolTipString;
			main.ui.dstBox.enabled = true;		
		}
	}	
	this.ui.mergeAllButton.enterEvent = function()
	{	
		if (main.ui.mergeAllButton.enabled)
		{
			main.ui.toolTipLabel.setStyleSheet("");
			main.ui.toolTipLabel.text = "Merge all arts and then move it to destination layer";
			main.ui.srcBox.enabled = false;	
		}
	}
	this.ui.mergeAllButton.leaveEvent = function()
	{
		if (main.ui.mergeAllButton.enabled)		
		{
			main.ui.srcBox.enabled = true;	
			main.ui.toolTipLabel.text = main.toolTipString;
		}
	}	
	this.ui.swapButton.enterEvent = function()
	{
		if (main.ui.swapButton.enabled || main.dstLayer == main.srcLayer)
		{				
			if (main.dstLayer == main.srcLayer)
			{
				main.ui.toolTipLabel.text = "Source and Destination layers cannot be the same";
				main.ui.toolTipLabel.setStyleSheet("QLabel{color: red}");				
			}
			else
			{
				main.ui.toolTipLabel.setStyleSheet("");
				main.ui.srcBox.title = "Source Layer      <═>";	
				main.ui.toolTipLabel.text = "Swap arts between source and destination layers";	
			}
		}
	}
	this.ui.swapButton.leaveEvent = function()
	{
		if (main.ui.swapButton.enabled || main.dstLayer == main.srcLayer)
		{		
			main.ui.srcBox.title = "Source Layer";			
			main.ui.toolTipLabel.text = main.toolTipString;			
		}
	}
	this.ui.replaceButton.enterEvent = function()
	{
		if (main.ui.replaceButton.enabled || main.dstLayer == main.srcLayer)
		{
			if (main.dstLayer == main.srcLayer)
			{
				main.ui.toolTipLabel.text = "Source and Destination layers cannot be the same";
				main.ui.toolTipLabel.setStyleSheet("QLabel{color: red}");				
			}
			else
			{
				main.ui.toolTipLabel.setStyleSheet("");
				main.ui.srcBox.title = "Source Layer       ═>";		
				main.ui.toolTipLabel.text = "Clear destination layer and then paste source art";
			}
		}
	}
	this.ui.replaceButton.leaveEvent = function()
	{
		if (main.ui.replaceButton.enabled || main.dstLayer == main.srcLayer)
		{		
			main.ui.srcBox.title = "Source Layer";			
			main.ui.toolTipLabel.text = main.toolTipString;			
		}
	}
	this.ui.mergeButton.enterEvent = function()
	{
		if (main.ui.mergeButton.enabled || main.dstLayer == main.srcLayer)
		{	
			if (main.dstLayer == main.srcLayer)
			{
				main.ui.toolTipLabel.text = "Source and Destination layers cannot be the same";
				main.ui.toolTipLabel.setStyleSheet("QLabel{color: red}");				
			}
			else
			{
				main.ui.toolTipLabel.setStyleSheet("");
				main.ui.srcBox.title = "Source Layer       ═>";	
				main.ui.toolTipLabel.text = "Cut and paste source art on top of destination art";
			}
		}
	}
	this.ui.mergeButton.leaveEvent = function()
	{
		if (main.ui.mergeButton.enabled || main.dstLayer == main.srcLayer)
		{	
			main.ui.srcBox.title = "Source Layer";			
			main.ui.toolTipLabel.text = main.toolTipString;			
		}
	}	
	this.ui.duplicateButton.enterEvent = function()
	{
		if (main.ui.duplicateButton.enabled || main.dstLayer == main.srcLayer)
		{	
			if (main.dstLayer == main.srcLayer)
			{
				main.ui.toolTipLabel.text = "Source and Destination layers cannot be the same";
				main.ui.toolTipLabel.setStyleSheet("QLabel{color: red}");
			}
			else
			{	
				main.ui.toolTipLabel.setStyleSheet("");
				main.ui.srcBox.title = "Source Layer       ═>";	
				main.ui.toolTipLabel.text = "Copy and paste source art on top of destination art";
			}
		}
	}
	this.ui.duplicateButton.leaveEvent = function()
	{
		if (main.ui.duplicateButton.enabled || main.dstLayer == main.srcLayer)
		{		
			main.ui.srcBox.title = "Source Layer";			
			main.ui.toolTipLabel.text = main.toolTipString;		
		}
	}
	this.ui.closeEvent = function()    // when title bar "x" is clicked
	{
		main.closeButtonReleased();
	}

	this.ui.applySelFramesRB.toggled.connect(this, this.applySelFramesRBToggled);
	this.ui.applyAllFramesRB.toggled.connect(this, this.applyAllFramesRBToggled);
	
	this.ui.srcOverlayRB.toggled.connect(this, this.srcOverlayRBToggled);	
	this.ui.srcLineRB.toggled.connect(this, this.srcLineRBToggled);	
	this.ui.srcColorRB.toggled.connect(this, this.srcColorRBToggled);	
	this.ui.srcUnderlayRB.toggled.connect(this, this.srcUnderlayRBToggled);
	this.ui.dstOverlayRB.toggled.connect(this, this.dstOverlayRBToggled);	
	this.ui.dstLineRB.toggled.connect(this, this.dstLineRBToggled);	
	this.ui.dstColorRB.toggled.connect(this, this.dstColorRBToggled);	
	this.ui.dstUnderlayRB.toggled.connect(this, this.dstUnderlayRBToggled);		
	
	this.ui.clearButton.released.connect(this, this.clearButtonReleased);	
	this.ui.swapButton.released.connect(this, this.swapButtonReleased);	
	this.ui.mergeButton.released.connect(this, this.mergeButtonReleased);	
	this.ui.mergeAllButton.released.connect(this, this.mergeAllButtonReleased);	
	this.ui.replaceButton.released.connect(this, this.replaceButtonReleased);	
	this.ui.duplicateButton.released.connect(this, this.duplicateButtonReleased);		
}





	
function private_functions()
{
	this.junction = function(_pd)
	{		
		if (_pd.dstLayer == _pd.srcLayer && _pd.mode !== "clear" && _pd.mode !== "mergeAll")
			return;			
		else if (_pd.node == null)
			return;
		
		var useTiming = node.getAttr(_pd.node, 1, "drawing.ELEMENT_MODE").boolValue();
		var drawCol = node.linkedColumn(_pd.node, useTiming ? "drawing.element" : "drawing.customName.timing");  		
		var celList = column.getDrawingTimings(drawCol);
		
		var startFrame = Timeline.firstFrameSel;		
		var endFrame = startFrame + Timeline.numFrameSel -1;
		
		if (_pd.applyAll)
		{
			startFrame = 1;
			endFrame = frame.numberOf();	
		}
		

		var softwareVer = this.getSoftwareVer();
		var OGSettings = this.captureOGSettingsThenApplyPresets(softwareVer);	
		var OGFrame = frame.current();		
		Action.perform("onActionChooseSelectTool()", "drawingView,cameraView");


		scene.beginUndoRedoAccum("Move art between art layers");	
		
		var checkedCels = [];
		for (var f = startFrame; f <= endFrame; f++)
		{
			frame.setCurrent(f);
			var curCel = column.getEntry (drawCol, 1, f);
			if (celList.indexOf(curCel) !== -1 && checkedCels.indexOf(curCel) == -1)
			{
				switch (_pd.mode)
				{
					case "swap": 		this.swap(_pd.node, f, _pd); 		break;
					case "merge": 		this.merge(_pd.node, f, _pd); 	break;
					case "mergeAll": 	this.merge(_pd.node, f, _pd); 	break;						
					case "duplicate": 	this.duplicate(_pd.node, f, _pd); break;
					case "replace": 	this.replace(_pd.node, f, _pd); 	break;
					case "clear": 		this.clear(_pd.node, f, _pd);
				}
				checkedCels.push(curCel);
			}
			else if (checkedCels.length == celList.length)
				break;		
		}
		
		scene.endUndoRedoAccum();
		
			
		this.restoreOGSettings(softwareVer, OGSettings);
		frame.setCurrent(OGFrame);
		selection.addDrawingColumnToSelection(drawCol);
	};


	this.directCall = function(mode)
	{
		var sNode = selection.selectedNodes(0);
		if (selection.numberOfNodesSelected == 0 || node.type(sNode) !== "READ")
			return;

		var pref = this.loadPref();
		pref.node = sNode;	
		pref.mode = mode;		
		
		this.junction(pref);
	};
	
	
	this.swap = function(argNode, f, pref)
	{
		// on src layer, cut the art 
		DrawingTools.setCurrentDrawingFromNodeName(argNode, f);		
		DrawingTools.setCurrentArt(pref.srcLayer);
		Action.perform("selectAll()", "cameraView");
		
		var validateAction = Action.validate("cut()", "cameraView");		
		if (validateAction.enabled)
		{		
			Action.perform("cut()", "cameraView");

			// on dst layer, paste src art, reverse the selection, and then cut dst art
			DrawingTools.setCurrentDrawingFromNodeName(argNode, f);			
			DrawingTools.setCurrentArt(pref.dstLayer);				
			Action.perform("paste()", "cameraView");
			Action.perform("invertSelection()", "cameraView");				
			
			validateAction = Action.validate("cut()", "cameraView");		
			if (validateAction.enabled)
			{	
				Action.perform("cut()", "cameraView");	

				// paste dst art on src layer
				DrawingTools.setCurrentArt(pref.srcLayer);
				Action.perform("paste()", "cameraView");
				Action.perform("deselectAll()", "cameraView");	
			}
		}
		// if selection is empty, only move dst art to src layer
		else
		{
			DrawingTools.setCurrentArt(pref.dstLayer);
			Action.perform("selectAll()", "cameraView");	
			
			validateAction = Action.validate("cut()", "cameraView");		
			if (validateAction.enabled)
			{
				Action.perform("cut()", "cameraView");
			
				DrawingTools.setCurrentArt(pref.srcLayer);
				Action.perform("paste()", "cameraView");
				Action.perform("deselectAll()", "cameraView");					
			}
		}
	};
	

	this.merge = function(argNode, f, pref)
	{	
		DrawingTools.setCurrentDrawingFromNodeName(argNode, f);
		
		if (pref.mode == "mergeAll")
			ToolProperties.setApplyAllArts(true);
		else
			DrawingTools.setCurrentArt(pref.srcLayer);
		
		Action.perform("selectAll()", "cameraView");					
		var validateAction = Action.validate("cut()", "cameraView");		
		if (validateAction.enabled)
		{
			Action.perform("cut()", "cameraView");
			
			if (pref.mode == "mergeAll")
				ToolProperties.setApplyAllArts(false);

			DrawingTools.setCurrentArt(pref.dstLayer);
			Action.perform("paste()", "cameraView");
			Action.perform("deselectAll()", "cameraView");					
		}
	};
	
	
	this.duplicate = function(argNode, f, pref)
	{
		DrawingTools.setCurrentDrawingFromNodeName(argNode, f);
		DrawingTools.setCurrentArt(pref.srcLayer);
		Action.perform("selectAll()", "cameraView");	
		
		// Check selection. If selection is empty, operation ends for the current frame.
		var validateAction = Action.validate("copy()", "cameraView");		
		if (validateAction.enabled)
		{
			Action.perform("copy()", "cameraView");
		
			DrawingTools.setCurrentArt(pref.dstLayer);
			Action.perform("paste()", "cameraView");
			Action.perform("deselectAll()", "cameraView");				
		}
	};
		
	
	this.replace = function(argNode, f, pref)
	{
		DrawingTools.setCurrentDrawingFromNodeName(argNode, f);
		DrawingTools.setCurrentArt(pref.srcLayer);
		Action.perform("selectAll()", "cameraView");	
		
		var validateAction = Action.validate("cut()", "cameraView");		
		if (validateAction.enabled)
		{
			Action.perform("cut()", "cameraView");
		
			DrawingTools.setCurrentArt(pref.dstLayer);
			Action.perform("selectAll()", "cameraView");	
			Action.perform("deleteSelection()", "cameraView");
			Action.perform("paste()", "cameraView");
			Action.perform("deselectAll()", "cameraView");				
		}
		// If selection is empty, just clear destination layer:
		else
		{
			DrawingTools.setCurrentArt(pref.dstLayer);
			Action.perform("selectAll()", "cameraView");	
			Action.perform("deleteSelection()", "cameraView");	
		}
	};
		
	
	this.clear = function(argNode, f, pref)
	{
		DrawingTools.setCurrentDrawingFromNodeName(argNode, f);
		DrawingTools.setCurrentArt(pref.srcLayer);
		Action.perform("selectAll()", "cameraView");	
		
		var validateAction = Action.validate("deleteSelection()", "cameraView");		
		if (validateAction.enabled)
		{
			Action.perform("deleteSelection()", "cameraView");
		}
	};
	

	this.loadPref = function()	
	{	
		var pref = {};		
		var localPath = specialFolders.userScripts + "/YU_Script_Prefs";
		localPath += "/ANM_Move_Art_Between_Art_Layers_Pref";
		var file = new File(localPath);
	
		try
		{
			if (file.exists)
			{
				file.open(1) // read only
				var savedData = file.read();
				file.close();

				pref.savedData = "" + savedData;
				pref.applyAll = parseInt(savedData.charAt(0));			
				pref.srcLayer = parseInt(savedData.charAt(1));
				pref.dstLayer = parseInt(savedData.charAt(2));				
			}
		}
		catch(err){}			
		
		if (Object.keys(pref).length == 0)
		{	
			MessageLog.trace("Move Art Between Art Layers: Preference file is not found. Loading default setting.");
			var preset = {};
			preset.savedData = "042";			
			preset.applyAll = 0;
			preset.srcLayer = 4;
			preset.dstLayer = 2;
					
			pref = preset;
		}		
		return pref;
	};
	

	this.savePref = function(main)
	{
		var pref = [];		
		pref.push(Number(main.applyAll));		
		pref.push(main.srcLayer);
		pref.push(main.dstLayer);
		pref = pref.join("");
		
		// if pref has not been changed, cancel saving
		if (pref === main.savedData || main.savedData == undefined)
		{	return pref;	}

		var localPath = specialFolders.userScripts + "/YU_Script_Prefs";
		var dir = new Dir;
		if (!dir.fileExists(localPath))
			dir.mkdir(localPath);
		localPath += "/ANM_Move_Art_Between_Art_Layers_Pref";		
		var file = new File(localPath);
		
		try
		{	
			file.open(2); // write only
			file.write(pref);
			file.close();
		}
		catch(err){}
		
		return pref;
	};
	
	
	this.loadUiCoord  = function()	
	{	
		var coord = {};		
		var localPath = specialFolders.userScripts + "/YU_Script_Prefs";
		localPath += "/ANM_Move_Art_Between_Art_Layers_position";
		var file = new File(localPath);
	
		try
		{
			if (file.exists)
			{
				file.open(1) // read only
				var sd = file.readLines();
				file.close();
				
				coord.x = sd[0];	
				coord.y = sd[1];			
			}
		}
		catch(err){}			
		
		if (Object.keys(coord).length == 0)
		{	
			MessageLog.trace("Move Art Between Art Layers: Positon save data is not found. Loading default setting.");
			var pref = {};
			pref.x = 300;
			pref.y = 200;
					
			coord = pref;
		}		
		return coord;
	};
	

	this.saveUiCoord = function(main)
	{
		var localPath = specialFolders.userScripts + "/YU_Script_Prefs";
		var dir = new Dir;
		if (!dir.fileExists(localPath))
			dir.mkdir(localPath);
		localPath += "/ANM_Move_Art_Between_Art_Layers_position";		
		var file = new File(localPath);
		
		try
		{	
			file.open(2); // write only
			file.writeLine(main.ui.x);			
			file.write(main.ui.y);
			file.close();
		}
		catch(err){}
	};
	

	this.getSoftwareVer = function()
	{
		var info = about.getVersionInfoStr();
		info = info.split(" ");
		return parseFloat(info[7]);
	};
	
	
	this.captureOGSettingsThenApplyPresets = function(softwareVer)
	{
		// capture current tool, Select tool settings and the art layer mode...
		var settings = this.captureSelectToolSettings(softwareVer);		
		settings.tool = this.captureCurrentTool(softwareVer);
		settings.artLayer = this.captureArtLayerSettings(softwareVer);		
		
		//...and then set the custom settings
		ToolProperties.setMarkeeMode(false);
		ToolProperties.setSelectByColourMode(false);	
		ToolProperties.setPermanentSelectionMode(false);
		ToolProperties.setApplyAllArts(false);
		
		// if Preview All Art Layers is set on, turn it off
		if (settings.artLayer.boolViewAll)
			Action.perform("onActionPreviewModeToggle()", "artLayerResponder");

		if (softwareVer >= 16)
		{
			settings.frameModeButton.checked = false;
			settings.elementModeButton.checked = false;
		}
		else
		{
			ToolProperties.setApplyAllDrawings(false);	
			settings.syncedDrawingButton.checked = false;
			settings.singleDrawingButton.checked = false;
		}
		return settings;
	};


	this.captureSelectToolSettings = function(softwareVer)
	{
		var settings = {
			boolMarkee: false,
			boolSelectByColor: false,
			boolPermanentSelection:	Action.validate("onActionTogglePermanentSelection()","drawingView").checked,
			boolApplyAllLayers: Action.validate("onActionToggleApplyToolToAllLayers()","drawingView").checked,
			boolSyncedDrawing: false,	syncedDrawingButton: {},
			boolSingleDrawing: false,	singleDrawingButton: {},
			boolElementMode: false,		elementModeButton: {},
			boolFrameMode: false,		frameModeButton: {}
		};	
			
		if (softwareVer < 16)
			settings.boolApplyAllDrawings = Action.validate("onActionToggleApplyToAllDrawings()","drawingView").checked;
			
		var widgets = QApplication.allWidgets();
		for (var w in widgets)
		{
			var widget = widgets[w];
			if (widget.objectName == "SelectProperties")
			{
				var child = widget.children();
				for (var ch in child)
				{
					if (child[ch].objectName == "boxOptions")
					{
						var boxChild = child[ch].children();		
						for (var bx in boxChild)
						{
							if (boxChild[bx].objectName == "frameOptions1")
							{
								var frameChild = boxChild[bx].children();
								for (var fr in frameChild)
								{
									if (frameChild[fr].objectName == "buttonSelectTool" &&
									(frameChild[fr].toolTip == "Lasso" || frameChild[fr].toolTip == "Marquee"))
										settings.boolMarkee = (frameChild[fr].toolTip == "Lasso") ? true : false;
									else if (frameChild[fr].objectName == "buttonSelectByColor")
										settings.boolSelectByColor = frameChild[fr].checked;								
								}
							}
							else if (boxChild[bx].objectName == "frameOptions2")
							{
								var frameChild = boxChild[bx].children();	
								for (var fr in frameChild)
								{
									switch (frameChild[fr].objectName)
									{
										case "buttonElementMode" :
											settings.boolElementMode = frameChild[fr].checked;
											settings.elementModeButton = frameChild[fr]; break;
										case "buttonFrameMode" :
											settings.boolFrameMode = frameChild[fr].checked;										
											settings.frameModeButton = frameChild[fr]; break;
										case "buttonSingleDrawing" :
											settings.boolSingleDrawing = frameChild[fr].checked;										
											settings.singleDrawingButton = frameChild[fr]; break;
										case "buttonApplyLinkedDrawings" :
											settings.boolSyncedDrawing = frameChild[fr].checked;											
											settings.syncedDrawingButton = frameChild[fr];
									}
								}
							}
						}
						break;
					}
				}
				break;				
			}				
		}
		return settings;
	};


	this.captureArtLayerSettings = function()
	{
		var artLayerSettings = {};
		artLayerSettings.boolViewAll = Action.validate("onActionPreviewModeToggle()", "artLayerResponder").checked;
	
		var boolOverlay = Action.validate("onActionOverlayArtSelected()", "artLayerResponder").checked;
		var boolLine = Action.validate("onActionLineArtSelected()", "artLayerResponder").checked;
		var boolColor = Action.validate("onActionColorArtSelected()", "artLayerResponder").checked;

		if (boolOverlay)		artLayerSettings.activeArt = 8;
		else if (boolLine)		artLayerSettings.activeArt = 4;				
		else if (boolColor)	artLayerSettings.activeArt = 2;		
		else /*boolUnderlay*/	artLayerSettings.activeArt = 1;

		return artLayerSettings;
	};
	
	
	this.captureCurrentTool = function(softwareVer)
	{
		if (softwareVer >= 16)	
			return Tools.getToolSettings().currentTool.id;			
		else
		{
			var toolList = [
				"onActionChooseSelectTool()", "onActionChooseCutterTool()", "onActionChooseRepositionAllDrawingsTool()",
				"onActionChooseContourEditorTool()", "onActionChooseCenterlineEditorTool()", "onActionChoosePencilEditorTool()",
				"onActionChooseSpSmoothEditingTool()", "onActionChoosePerspectiveTool()", "onActionChooseEnvelopeTool()",
				"onActionChooseEditTransformTool()", "onActionChooseBrushTool()", "onActionChoosePencilTool()", "onActionChooseTextTool()",
				"onActionChooseEraserTool()", "onActionChoosePaintToolInPaintMode()", "onActionChooseInkTool()",
				"onActionChoosePaintToolInPaintUnpaintedMode()", "onActionChoosePaintToolInRepaintMode()",
				"onActionChoosePaintToolInUnpaintMode()", "onActionChooseStrokeTool()", "onActionChooseCloseGapTool()",
				"onActionChooseLineTool()", "onActionChooseRectangleTool()", "onActionChooseEllipseTool()", "onActionChoosePolylineTool()",
				"onActionChooseDropperTool()", "onActionChoosePivotTool()", "onActionChooseMorphTool()", "onActionChooseGrabberTool()",
				"onActionChooseZoomTool()", "onActionChooseRotateTool()", "onActionChooseSpTransformTool()", "onActionChooseSpInverseKinematicsTool()",
				"onActionChooseSpTranslateTool()", "onActionChooseSpRotateTool()", "onActionChooseSpScaleTool()", "onActionChooseSpSkewTool()",
				"onActionChooseSpMaintainSizeTool()", "onActionChooseSpSplineOffsetTool()", "onActionChooseSpRepositionTool()",
				"onActionChooseSpTransformTool()", "onActionChooseSpInverseKinematicsTool()",
			];	
			for (var tl in toolList)
				if (Action.validate(toolList[tl], "sceneUI").checked)
					return toolList[tl];	
		}
	};
	
	
	this.restoreOGSettings = function(softwareVer, settings)
	{
		if (softwareVer >= 16)	
		{
			Tools.setCurrentTool(settings.tool);
			settings.frameModeButton.checked = settings.boolFrameMode;
			settings.elementModeButton.checked = settings.boolElementMode;		
		}
		else
		{
			Action.perform(settings.tool, "sceneUI");	
			ToolProperties.setApplyAllDrawings(settings.boolApplyAllDrawings);	
			settings.syncedDrawingButton.checked = settings.boolSyncedDrawing;
			settings.singleDrawingButton.checked = settings.boolSingleDrawing;
		}		
		ToolProperties.setMarkeeMode(settings.boolMarkee);	
		ToolProperties.setSelectByColourMode(settings.boolSelectByColor);
		ToolProperties.setPermanentSelectionMode(settings.boolPermanentSelection);
		ToolProperties.setApplyAllArts(settings.boolApplyAllLayers);
		
		DrawingTools.setCurrentArt(settings.artLayer.activeArt);
		if (settings.artLayer.boolViewAll != Action.validate("onActionPreviewModeToggle()", "artLayerResponder").checked)
			Action.perform("onActionPreviewModeToggle()", "artLayerResponder");		
	};
	
	
	this.getParentWidget = function()
	{
		var topWidgets = QApplication.topLevelWidgets();
		for (var i in topWidgets)
			if (topWidgets[i] instanceof QMainWindow && !topWidgets[i].parentWidget())
				return topWidgets[i];
		return "";
	};


	this.createUI = function()
	{
		this.dialog = new QWidget(this.getParentWidget());	
		this.dialog.setWindowTitle("Art Layer Wizard v" + scriptVer);	
		this.dialog.setWindowFlags(Qt.Tool);
		this.dialog.setAttribute(Qt.WA_DeleteOnClose);
		this.dialog.setMinimumSize (314, 330);				
		this.dialog.setFocus(true);
		this.dialog.mouseTracking = true;
		
		this.dialog.mainLayout = new QVBoxLayout(this.dialog);
		
		this.dialog.applyLayout = new QHBoxLayout(this.dialog);		
		this.dialog.applySelFramesRB = new QRadioButton("Apply to selected frame(s)");	
		this.dialog.mainLayout.addWidget(this.dialog.applySelFramesRB, 0, 0);			
		this.dialog.applyAllFramesRB = new QRadioButton("Apply to all frames");		
		this.dialog.mainLayout.addWidget(this.dialog.applyAllFramesRB, 0, 1);				

		this.dialog.opBox = new QGroupBox("");
		this.dialog.opBoxLayout = new QGridLayout(this.dialog);		
		this.dialog.opBox.setLayout(this.dialog.opBoxLayout);
		this.dialog.mainLayout.addWidget(this.dialog.opBox, 0, 2);

		this.dialog.toolTipLabel = new QLabel("");
		this.dialog.toolTipLabel.alignment = (Qt.AlignCenter);		
		this.dialog.mainLayout.addWidget(this.dialog.toolTipLabel, 0, 3);		
					

		this.dialog.srcBox = new QGroupBox("Source Layer");
		this.dialog.srcBoxLayout = new QVBoxLayout(this.dialog);		
		this.dialog.srcBox.setLayout(this.dialog.srcBoxLayout);		
		this.dialog.opBoxLayout.addWidget(this.dialog.srcBox, 0, 0);
		
		this.dialog.srcOverlayRB = new QRadioButton("Overlay");	
		this.dialog.srcBoxLayout.addWidget(this.dialog.srcOverlayRB, 0, 0);
		this.dialog.srcLineRB = new QRadioButton("Line Art");	
		this.dialog.srcBoxLayout.addWidget(this.dialog.srcLineRB, 0, 1);
		this.dialog.srcColorRB = new QRadioButton("Color Art");	
		this.dialog.srcBoxLayout.addWidget(this.dialog.srcColorRB, 0, 2);
		this.dialog.srcUnderlayRB = new QRadioButton("Underlay");	
		this.dialog.srcBoxLayout.addWidget(this.dialog.srcUnderlayRB, 0, 3);
		
		
		this.dialog.dstBox = new QGroupBox("Destination Layer");
		this.dialog.dstBoxLayout = new QVBoxLayout(this.dialog);		
		this.dialog.dstBox.setLayout(this.dialog.dstBoxLayout);		
		this.dialog.opBoxLayout.addWidget(this.dialog.dstBox, 0, 1);
		
		this.dialog.dstOverlayRB = new QRadioButton("Overlay");	
		this.dialog.dstBoxLayout.addWidget(this.dialog.dstOverlayRB, 0, 0);
		this.dialog.dstLineRB = new QRadioButton("Line Art");	
		this.dialog.dstBoxLayout.addWidget(this.dialog.dstLineRB, 0, 1);
		this.dialog.dstColorRB = new QRadioButton("Color Art");	
		this.dialog.dstBoxLayout.addWidget(this.dialog.dstColorRB, 0, 2);
		this.dialog.dstUnderlayRB = new QRadioButton("Underlay");	
		this.dialog.dstBoxLayout.addWidget(this.dialog.dstUnderlayRB, 0, 3);		
		
		var imagePath = specialFolders.userScripts + "/script-icons";	

		this.dialog.clearButton = new QPushButton("Clear Layer");
		this.dialog.clearButton.setStyleSheet("QPushButton{text-align: left; padding-left: 18px;}");
		this.dialog.clearButton.setMinimumSize (100, 36);			
		this.dialog.clearButton.icon = new QIcon(imagePath + "/ANM_Clear_Art.png");
		this.dialog.clearButton.setIconSize(new QSize(28,28));	
		this.dialog.opBoxLayout.addWidget(this.dialog.clearButton, 1, 0);	
		
		this.dialog.mergeAllButton = new QPushButton("Merge All");
		this.dialog.mergeAllButton.setStyleSheet("QPushButton{text-align: left; padding-left: 18px;}");
		this.dialog.mergeAllButton.setMinimumSize (100, 36);			
		this.dialog.mergeAllButton.icon = new QIcon(imagePath + "/ANM_Merge_All_Art.png");
		this.dialog.mergeAllButton.setIconSize(new QSize(28,28));	
		this.dialog.opBoxLayout.addWidget(this.dialog.mergeAllButton, 1, 1);
		
		this.dialog.swapButton = new QPushButton("Swap");	
		this.dialog.swapButton.setStyleSheet("QPushButton{text-align: left; padding-left: 18px;}");
		this.dialog.swapButton.setMinimumSize (100, 36);			
		this.dialog.swapButton.icon = new QIcon(imagePath + "/ANM_Swap_Art.png");
		this.dialog.swapButton.setIconSize(new QSize(28,28));			
		this.dialog.opBoxLayout.addWidget(this.dialog.swapButton, 2, 0);
		
		this.dialog.replaceButton = new QPushButton("Replace");
		this.dialog.replaceButton.setStyleSheet("QPushButton{text-align: left; padding-left: 18px;}");
		this.dialog.replaceButton.setMinimumSize (100, 36);			
		this.dialog.replaceButton.icon = new QIcon(imagePath + "/ANM_Replace_Art.png");
		this.dialog.replaceButton.setIconSize(new QSize(28,28));			
		this.dialog.opBoxLayout.addWidget(this.dialog.replaceButton, 2, 1);
		
		this.dialog.mergeButton = new QPushButton("Merge");
		this.dialog.mergeButton.setStyleSheet("QPushButton{text-align: left; padding-left: 18px;}");
		this.dialog.mergeButton.setMinimumSize (100, 36);			
		this.dialog.mergeButton.icon = new QIcon(imagePath + "/ANM_Merge_Art.png");
		this.dialog.mergeButton.setIconSize(new QSize(28,28));			
		this.dialog.opBoxLayout.addWidget(this.dialog.mergeButton, 3, 0);	
		
		this.dialog.duplicateButton = new QPushButton("Duplicate");
		this.dialog.duplicateButton.setStyleSheet("QPushButton{text-align: left; padding-left: 18px;}");
		this.dialog.duplicateButton.setMinimumSize (100, 36);			
		this.dialog.duplicateButton.icon = new QIcon(imagePath + "/ANM_Duplicate_Art.png");
		this.dialog.duplicateButton.setIconSize(new QSize(28,28));		
		this.dialog.opBoxLayout.addWidget(this.dialog.duplicateButton, 3, 1);	

		return this.dialog;
	};
}