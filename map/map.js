// draw the map and color states based on fines
const width = 800;
const height = 600;

const svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height);

// Projection for Australia
const projection = d3.geoMercator()
    .center([135, -25])
    .scale(800)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

function updateMap(geoData) {  
    const data = getFilteredData();
    console.log("Data for update:", data.length, "rows");
    
    // Color scale based on fines 
    const color = d3.scaleQuantize()
        .domain([0, d3.max(data, d => d.fines) || 1])  // Avoid division by zero
        .range(d3.schemeBlues[9]);
    
    // Clear previous map
    svg.selectAll("*").remove();
    
    // Draw states
    const states = svg.selectAll(".state")
        .data(geoData.features)  
        .enter()
        .append("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", d => {
            const jurisdiction = d.properties.STATE_NAME;  
            const stateData = data.find(item => jurisdictionMap[item.jurisdiction] === jurisdiction);
            return stateData ? color(stateData.fines) : "#ccc";  // Default gray for no data
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);
    
    // Setup interactions (add tooltips for arrests)
    setupInteractions(states, data);
}