// Configuration
const margin = { top: 60, right: 80, bottom: 100, left: 80 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Add gradient definition
svg.append("defs")
    .append("linearGradient")
    .attr("id", "urbanGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%")
    .selectAll("stop")
    .data([
        { offset: "0%", color: "#67c1ff" },
        { offset: "100%", color: "#c46bff" }
    ])
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

// Scales
const xScale = d3.scaleBand().range([0, width]).padding(0.3);
const yScale = d3.scaleLinear().range([height, 0]);
const colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([0, 100]);

// Tooltip
const tooltip = d3.select("#tooltip");

let currentView = 'urbanization';
let chartData = [];

// Load and process data
d3.csv("./Data/urban.csv").then(function(data) {
    // Process data - use the exact column names from your CSV
    chartData = data.map(d => {
        // Convert string values to numbers and handle quoted numbers
        const cameraFines = +d["Camera_Fines"].replace(/"/g, '');
        const policeFines = +d["Police_Fines"].replace(/"/g, '');
        const totalFines = +d["Total_Fines"].replace(/"/g, '');
        const cameraPercentage = +d["Camera_Percentage"].replace(/"/g, '');
        const policePercentage = +d["Police_Percentage"].replace(/"/g, '');
        const urbanScore = +d["Urban_Score"].replace(/"/g, '');
        
        // Use Camera_Percentage for the bar height (0-100 scale)
        const barHeight = cameraPercentage;
        
        return {
            JURISDICTION: d.JURISDICTION.replace(/"/g, ''),
            Camera_Fines: cameraFines,
            Police_Fines: policeFines,
            Total_Fines: totalFines,
            Camera_Percentage: cameraPercentage,
            Police_Percentage: policePercentage,
            Urban_Score: urbanScore,
            Bar_Height: barHeight
        };
    });

    console.log("Processed data:", chartData);
    
    // Update statistics
    updateStatistics(chartData);
    
    // Create charts
    createUrbanizationChart(chartData);
    setupEventListeners(chartData);
});

function updateStatistics(data) {
    const statsGrid = document.getElementById('statsGrid');
    
    // Calculate overall statistics
    const totalCameraFines = d3.sum(data, d => d.Camera_Fines);
    const totalPoliceFines = d3.sum(data, d => d.Police_Fines);
    const totalFines = totalCameraFines + totalPoliceFines;
    const avgCameraPercentage = d3.mean(data, d => d.Camera_Percentage);
    const avgPolicePercentage = d3.mean(data, d => d.Police_Percentage);
    
    // Find extremes
    const maxCamera = d3.max(data, d => d.Camera_Percentage);
    const minCamera = d3.min(data, d => d.Camera_Percentage);
    const maxCameraJurisdiction = data.find(d => d.Camera_Percentage === maxCamera);
    const minCameraJurisdiction = data.find(d => d.Camera_Percentage === minCamera);
    
    const statsHTML = `
        <div class="stat-item highlight">
            <span class="stat-label">Total Camera Fines</span>
            <span class="stat-value">${(totalCameraFines / 1000000).toFixed(1)}M</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Police Fines</span>
            <span class="stat-value">${(totalPoliceFines / 1000000).toFixed(1)}M</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Avg Camera Enforcement</span>
            <span class="stat-value">${avgCameraPercentage.toFixed(1)}%</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Avg Police Enforcement</span>
            <span class="stat-value">${avgPolicePercentage.toFixed(1)}%</span>
        </div>
        <div class="stat-item highlight">
            <span class="stat-label">Most fines (Camera %)</span>
            <span class="stat-value">${maxCameraJurisdiction.JURISDICTION}: ${maxCamera.toFixed(1)}%</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Least fines (Camera %)</span>
            <span class="stat-value">${minCameraJurisdiction.JURISDICTION}: ${minCamera.toFixed(1)}%</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Jurisdictions</span>
            <span class="stat-value">${data.length}</span>
        </div>
    `;
    
    statsGrid.innerHTML = statsHTML;
}

//
function createUrbanizationChart(data) {
    // Clear previous chart
    svg.selectAll("*").remove();

    // Update scales - use 0-100 for percentage scale
    xScale.domain(data.map(d => d.JURISDICTION));
    yScale.domain([0, 100]);

    // Add grid lines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat("")
        );

    // Create bars with proper positioning and solid colors
    svg.selectAll(".bar-urban")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar bar-urban")
        .attr("x", d => xScale(d.JURISDICTION))
        .attr("y", d => yScale(d.Camera_Percentage))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.Camera_Percentage))
        .attr("fill", "#67c1ff")
        .attr("rx", 4)
        .attr("ry", 4)
        .on("mouseover", function(event, d) {
            // Get the bar position relative to the chart container
            const barRect = this.getBoundingClientRect();
            const chartRect = document.getElementById('chart').getBoundingClientRect();
            
            // Calculate position relative to chart
            const xPos = barRect.left - chartRect.left + (barRect.width / 2);
            const yPos = barRect.top - chartRect.top;
            
            // Highlight bar
            d3.select(this)
                .attr("fill", "#4ecdc4")
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 2);
            
            tooltip.style("opacity", 1)
                .html(`
                    <strong>${d.JURISDICTION}</strong><br/>
                    Camera Enforcement: ${d.Camera_Percentage.toFixed(1)}%<br/>
                    Police Enforcement: ${d.Police_Percentage.toFixed(1)}%<br/>
                    Jurisdiction Score: ${d.Urban_Score.toFixed(1)}<br/>
                    Total Camera Fines: ${d.Camera_Fines.toLocaleString()}<br/>
                    Total Police Fines: ${d.Police_Fines.toLocaleString()}
                `)
                .style("left", xPos + "px")
                .style("top", (yPos - 10) + "px")
                .style("transform", "translateX(-50%)"); // Center the tooltip
        })
        .on("mousemove", function(event, d) {
            // Update tooltip position as mouse moves over bar
            const barRect = this.getBoundingClientRect();
            const chartRect = document.getElementById('chart').getBoundingClientRect();
            
            const xPos = barRect.left - chartRect.left + (barRect.width / 2);
            const yPos = barRect.top - chartRect.top;
            
            tooltip.style("left", xPos + "px")
                .style("top", (yPos - 10) + "px");
        })
        .on("mouseout", function(event, d) {
            // Restore original color
            d3.select(this)
                .attr("fill", "#67c1ff")
                .attr("stroke", "none")
                .attr("stroke-width", 0);
            
            tooltip.style("opacity", 0);
        });

    // Add value labels on bars
    svg.selectAll(".urban-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "urban-label")
        .attr("x", d => xScale(d.JURISDICTION) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.Camera_Percentage) + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .style("pointer-events", "none")
        .text(d => `${d.Camera_Percentage.toFixed(1)}%`);

    // Add axes
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("fill", "#9aa7bf");

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("fill", "#9aa7bf");

    // Add axis labels
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("fill", "#9aa7bf")
        .text("Camera Enforcement Percentage (%)");

    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 20})`)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("fill", "#9aa7bf")
        .text("Jurisdiction");

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#67c1ff")
        .text("Jurisdiction fines level by Camera %");
}




//

function createComparisonChart(data) {
    svg.selectAll("*").remove();

    // Prepare data for stacked bars
    const jurisdictions = data.map(d => d.JURISDICTION);
    xScale.domain(jurisdictions);
    yScale.domain([0, 100]);

    // Add grid lines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat("")
        );

    // Create stacked bars
    const barGroups = svg.selectAll(".bar-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(${xScale(d.JURISDICTION)},0)`);

    // Camera percentage (bottom)
    barGroups.append("rect")
        .attr("class", "bar bar-camera")
        .attr("width", xScale.bandwidth())
        .attr("y", d => yScale(d.Camera_Percentage))
        .attr("height", d => height - yScale(d.Camera_Percentage))
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1)
                .html(`
                    <strong>${d.JURISDICTION}</strong><br/>
                    Camera Enforcement: ${d.Camera_Percentage.toFixed(1)}%<br/>
                    ${d.Camera_Fines.toLocaleString()} fines
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        });

    // Police percentage (top)
    barGroups.append("rect")
        .attr("class", "bar bar-police")
        .attr("width", xScale.bandwidth())
        .attr("y", d => yScale(100))
        .attr("height", d => yScale(100 - d.Police_Percentage) - yScale(100))
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1)
                .html(`
                    <strong>${d.JURISDICTION}</strong><br/>
                    Police Enforcement: ${d.Police_Percentage.toFixed(1)}%<br/>
                    ${d.Police_Fines.toLocaleString()} fines
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        });

    // Add percentage labels
    barGroups.append("text")
        .attr("class", "percentage-label")
        .attr("x", xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.Camera_Percentage) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .text(d => `${d.Camera_Percentage.toFixed(1)}%`);

    // Add axes
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale));

    // Add labels
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("fill", "#9aa7bf")
        .text("Enforcement Percentage (%)");

    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 20})`)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("fill", "#9aa7bf")
        .text("Jurisdiction");

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#67c1ff")
        .text("Camera vs Police Enforcement Distribution");

    // Add legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 120}, -40)`);

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "#67c1ff");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .text("Camera Enforcement")
        .style("font-size", "12px")
        .style("fill", "#9aa7bf");

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 20)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "#c46bff");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 30)
        .text("Police Enforcement")
        .style("font-size", "12px")
        .style("fill", "#9aa7bf");
}

function setupEventListeners(data) {
    document.getElementById("urbanizationBtn").addEventListener("click", function() {
        this.classList.add("active");
        document.getElementById("comparisonBtn").classList.remove("active");
        currentView = 'urbanization';
        createUrbanizationChart(data);
    });

    document.getElementById("comparisonBtn").addEventListener("click", function() {
        this.classList.add("active");
        document.getElementById("urbanizationBtn").classList.remove("active");
        currentView = 'comparison';
        createComparisonChart(data);
    });
}