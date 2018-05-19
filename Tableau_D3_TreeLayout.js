// Initialize the viz variable 
var vizSuperstore;

/* ------------------------------ Part 1: Tableau Section [Start] ------------------------------ */
window.onload= function() {
// When the webpage has loaded, load the viz

	var Tableau_Sheet_Name = "Sales by Five Levels Pair"; // Declare sheet name for the sheet to pass data to D3.

	// Explicitly define ordered dimensions and measure to D3 hierarchical data conversion.
	var Ordered_Dimension_List_to_D3 = ["Customer Segment", "Product Category", "Region", "State or Province", "City"];
	var Measure_Name = "SUM(Sales)";
	
	var placeholder = document.getElementById('mySuperstoreViz');
	var vizURL = 'https://public.tableau.com/views/SampleDashboardSuperstore/D3TreeLayoutDashboardPair';
	//https://public.tableau.com/views/SampleDashboardSuperstore/D3TreeLayoutDashboardPair
	var options = {
		width: '550px',
		height: '600px',
		hideToolbar: true,
		hideTabs: true,
	
		onFirstInteractive: function () {			
			// Function call to get tableau data after Tableau visualization is complete.
			Pass_Tableau_Data_to_D3(vizSuperstore, Tableau_Sheet_Name, Ordered_Dimension_List_to_D3, Measure_Name, Draw_D3_TreeLayout);
		}
	};

	vizSuperstore = new tableau.Viz(placeholder, vizURL, options);
	
	// Listen for filter change/selection for "Superstore Sales Summary Dashboard"
	vizSuperstore.addEventListener('filterchange', function(filterEvent) {
		
		// Function call to get tableau data after Tableau visualization is complete.		
		Pass_Tableau_Data_to_D3(vizSuperstore, Tableau_Sheet_Name, Ordered_Dimension_List_to_D3, Measure_Name, Draw_D3_TreeLayout);
		//console.log("Filter change event ran. ");		
	});
	
};

/* ------------------------------- Part 1: Tableau Section [End] ------------------------------- */


/* --------------- Part 2: Convert Tableau Data to D3 Hierarchical Data [Start] --------------- */

// Import data from target dashboard-worksheet using Tableau Javascript API
// and converting the data into a format for D3 input.
let Pass_Tableau_Data_to_D3 = function(vizName, sheetName, arrayDimensionNames, strMeasureName, callback){
	
	var sheet = vizName.getWorkbook().getActiveSheet().getWorksheets().get(sheetName);
	
	var Array_of_Columns;
	var Tableau_Array_of_Array;
	var TableauTreeData;
			
	options = {
		maxRows: 0, // Max rows to return. Use 0 to return all rows
		ignoreAliases: false,
		ignoreSelection: true,
		includeAllColumns: false
	};

	// Get and reformat tableau data for D3 processing 
	sheet.getSummaryDataAsync(options).then(function(TableauData){
			Array_of_Columns = TableauData.getColumns();
			Tableau_Array_of_Array = TableauData.getData();
			//console.log('***** Debug output getData() *****');	// Debug output
			//console.log(Tableau_Array_of_Array);			// Debug output
			//console.log('***** Debug output getColumns() *****');	// Debug output
			//console.log(Array_of_Columns);												// Debug output
			
			/*Convert Tableau data into Array of Objects for D3 processing. */
			var Tableau_Array_of_Objects = ReduceToObjectTablulated(Array_of_Columns, Tableau_Array_of_Array);
			//console.log('***** Display Tableau Array_Of_Objects *****');	// Debug output
			//console.log(Tableau_Array_of_Objects);			// Debug output

			TableauTreeData = Convert_To_TreeData(Tableau_Array_of_Objects, arrayDimensionNames, strMeasureName);
						
			//console.log('***** Display Tree Data *****');	// Debug output
			//console.log(TableauTreeData);			// Debug output

			//Verify callback object type is a function to call the draw D3 chart
			if(typeof callback === "function"){
				
				//Javascript callback function to dynamically draw D3 chart
				callback(TableauTreeData);
			}
			
	});
	
};


// Tableau .getData() returns an array (rows) of arrays (columns) of objects, 
// which have a formattedValue property.
// Convert and flatten "Array of Arrays" to "Array of objects" in 
// field:values convention for easier data format for D3.
function ReduceToObjectTablulated(cols, data){
	
	var Array_Of_Objects = [];
	
	for (var RowIndex = 0; RowIndex < data.length; RowIndex++) {
		var SingleObject = new Object();
		
		for (var FieldIndex = 0; FieldIndex < Object.keys(data[RowIndex]).length; FieldIndex++) {
			var FieldName = cols[FieldIndex].getFieldName();
			
			SingleObject[FieldName] = data[RowIndex][FieldIndex].formattedValue;

		} // Looping through the object number of properties (aka: Fields) in object
		
		Array_Of_Objects.push(SingleObject);	// Dynamically append object to the array
		

		//console.log('*****************');	// Debug output
		//console.log(SingleObject);		// Debug output
		//console.log(Array_Of_Objects);	// Debug output
		
	} //Looping through data array of objects.
	
	//console.log('***** Display Array_Of_Objects *****');	// Debug output
	//console.log(Array_Of_Objects);												// Debug output	
	return Array_Of_Objects;
}


// Convert tablulated data into hierarchical data for most advanced D3 charts
// Not all D3 charts requires hierarchical data as input (ie: simple D3 line chart, simple D3 bar chart)
function Convert_To_TreeData(FlatData, arrayDimensionNames, strValueName){

	// Remove Tableau Aggregation command text SUM(), ATTR(), COUNT(), etc
	var formatted_Value_Name = strValueName.slice( (strValueName.indexOf("(") + 1) ,99).replace(")", "");
	
	var TreeData = { name : formatted_Value_Name, children : [] };
	var final_Child_Level = arrayDimensionNames.pop();
	var non_Final_Children_Levels = arrayDimensionNames;
	
	// Convert tablulated data to tree data.
	// For each data row, loop through the expected levels traversing the output tree
	FlatData.forEach(function(d){
		// Keep this as a reference to the current level
		var depthCursor = TreeData.children;
		// Go down one level at a time
		non_Final_Children_Levels.forEach(function( property, depth ){

			// Look to see if a branch has already been created
			var index;
			depthCursor.forEach(function(child,i){
				if ( d[property] == child.name ) index = i;
			});
			// Add a branch if it isn't there
			if ( isNaN(index) ) {
				depthCursor.push({ name : d[property], children : []});
				index = depthCursor.length - 1;
			}
			// Now reference the new child array as we go deeper into the tree
			depthCursor = depthCursor[index].children;
			// This is a leaf, so add the last element to the specified branch

			var TempString = d[strValueName].replace(",","");
			Target_Key = Math.round(+TempString); //Convert String to Numeric

			if ( depth === non_Final_Children_Levels.length - 1 ) {
				depthCursor.push({ name : d[final_Child_Level], size : Target_Key });
			}
		});
	});
	
	return TreeData;
}

/* ---------------- Part 2: Convert Tableau Data to D3 Hierarchical Data [End] ---------------- */


/* ------------------- Part 3: D3 Tree Layout (Superstore) Section [Start] ------------------- */
let Draw_D3_TreeLayout = function(nodeData){

	var treeLayout = d3.tree()
		.size([750, 250]) 

	// D3 data function to further format hierarchical data (Type: object)
	// convert each individual node by 
	//   1) nesting it with explicit "data" object
	//   2) added hierarchical "depth" level
	// along with the "name" and "value"
	var root = d3.hierarchy(nodeData)

	// D3 function to further format hierarchical data 
	// by adding assigning x, y plot coordinates relative to
	// the defined D3 treeLayout dimension
	treeLayout(root)

	//Remove and re-create circle & line svg for chart refreshing
	d3.select('svg g.nodes').selectAll("*").remove();
	d3.select('svg g.links').selectAll("*").remove();

	
	// Create D3 svg element:Nodes
	d3.select('svg g.nodes')
		.selectAll('circle.node')
		.data(root.descendants())	// Pass data into D3 svg element
		.enter()
		.append('circle')
		.classed('node', true)
		.attr('cx', function(d) {return d.x;})
		.attr('cy', function(d) {return d.y;})
		.attr('r', 4)	//  Define the size of the node circle

		// Add D3 tooltip
		.append("title")
		.text( Text_ToolTip );	// Initiate and call text tooltip
		
		

	// Create D3 svg element:Links
	d3.select('svg g.links')
		.selectAll('line.link')
		.data(root.links())	// Pass data into D3 svg element
		.enter()
		.append('line')
		.classed('link', true)
		.attr('x1', function(d) {return d.source.x;})
		.attr('y1', function(d) {return d.source.y;})
		.attr('x2', function(d) {return d.target.x;})
		.attr('y2', function(d) {return d.target.y;});

  // Create text tooltip for D3 Chart
  function Text_ToolTip(d){
		var Value_Field_Name = "Sales";
		var Tooltip = ""; 
		var formatComma = d3.format(",");
	
		switch(d.height){
			case 0: 
				Tooltip = d.data.name + "\n" + Value_Field_Name + ": " + "$" + formatComma(d.data.size);
			break;			
			
			default: 
				Tooltip = d.data.name;
		}

		//console.log("Height: " + d.height);			// Debug output
		//console.log("Value_Field_Name: " + Value_Field_Name);	// Debug output
		//console.log("Value: " + d.data.size);			// Debug output
				
		return Tooltip;
  }		
	
};


/* -------------------- Part 3: D3 Tree Layout (Superstore) Section [End] -------------------- */
