// // // load-data.js
let rawData = [];
let aggregatedData = [];
let geojson = null;

Promise.all([
    d3.json("./Data/map_data.json"),
    d3.csv("./Data/jurisdiction_fines.csv")
]).then(([geoData, csvData]) => {
    geojson = geoData;
    
    aggregatedData = csvData.map(d => ({
        year: +d.year,
        jurisdiction: d.jurisdiction,
        fines: +d.fines,
        arrests: +d.arrests
    }));
    
    console.log("Aggregated Data Sample:", aggregatedData.slice(0, 5));
    
    // Populate year slider
    const years = [...new Set(aggregatedData.map(d => d.year))].sort(d3.ascending);
    const yearSlider = d3.select("#year-slider");
    yearSlider.attr("min", d3.min(years))
             .attr("max", d3.max(years))
             .attr("value", "all");  // Start with "all" (all years)
    
    // Add a label for "All Years"
    d3.select("#year-label").text("All Years");
    
    // Initial render (show all years)
    updateMap(geojson);
    
    // Event listener for slider
    yearSlider.on("input", function() {
        const selectedYear = +this.value;
        d3.select("#year-label").text(selectedYear === "all" ? "All Years" : selectedYear);
        updateMap(geojson);
    });
}).catch(error => {
    console.error("Error loading data:", error);
});

function getFilteredData() {
    const selectedYear = d3.select("#year-slider").property("value");
    let filtered;
    if (selectedYear === "all") {
        filtered = aggregatedData;  // Show all years
    } else {
        filtered = aggregatedData.filter(d => d.year === +selectedYear);
    }
    console.log("Filtered Data for Year", selectedYear, ":", filtered.length, "rows");  // Debug: Check if data exists
    return filtered;
}

// Mapping (adjust based on GeoJSON properties)
const jurisdictionMap = {
    "ACT": "Australian Capital Territory",
    "NSW": "New South Wales",
    "NT": "Northern Territory",
    "QLD": "Queensland",
    "SA": "South Australia",
    "TAS": "Tasmania",
    "VIC": "Victoria",
    "WA": "Western Australia"
};