// bar-chart.js.
let currentSelectedJurisdiction = null;

function createJurisdictionButtons(data) {
    const container = d3.select("#jurisdictionButtons");
    container.selectAll("*").remove(); // clear old buttons

    const jurisdictions = ["All", ...new Set(data.map(d => d.JURISDICTION))];

    jurisdictions.forEach(j => {
        container.append("button")
            .attr("class", "jurisdiction-btn")
            .classed("active", j === "All")
            .text(j)
            .on("click", function () {
                d3.selectAll(".jurisdiction-btn").classed("active", false);
                d3.select(this).classed("active", true);
                drawChart(data, j === "All" ? null : j);
            });
    });
}

function drawChart(data, selectedJurisdiction = null) {
    currentSelectedJurisdiction = selectedJurisdiction;
    // Clear the SVG contents
    d3.select("#chartSvg").selectAll("*").remove();

    console.log('Drawing chart for jurisdiction:', selectedJurisdiction);

    if (!data || data.length === 0) {
        d3.select("#chartContainer").append("p").text("No data available to display. Check CSV file.");
        console.error('No data to draw chart.');
        return;
    }

    // const margin = { top: 80, right: 160, bottom: 60, left: 90 },  // Increased right margin for side legend
    //       width = 980 - margin.left - margin.right,
    //       height = 500 - margin.top - margin.bottom;

    const containerWidth = document.getElementById('chartContainer').clientWidth;

    const margin = { top: 80, right: 160, bottom: 40, left: 100 },
      width = containerWidth - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;


    // Set viewBox for responsive centering and scaling
    const svg = d3.select("#chartSvg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")  // Centers the content
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    console.log('SVG selected:', svg.node());

    let chartData, xDomain, yValue, title, xAxisTitle, yAxisTitle;

    if (selectedJurisdiction) {
        // Drill-down view: Show fines by age group for the selected jurisdiction (exclude "All ages")
        chartData = data.filter(d => d.JURISDICTION === selectedJurisdiction && d.AGE_GROUP !== "All ages");
        if (chartData.length === 0) {
            console.error('No data for selected jurisdiction:', selectedJurisdiction);
            return;
        }
        xDomain = d3.groupSort(chartData, d => -d.fines, d => d.AGE_GROUP);
        yValue = d => d.fines;
        title = `Speeding Fines by Age Group for ${selectedJurisdiction}`;
        xAxisTitle = "Age Group";
        yAxisTitle = "Total Fines";
    } else {
        // Initial view: Show total fines by jurisdiction (use only "All ages" rows)
        chartData = data.filter(d => d.AGE_GROUP === "All ages");
        if (chartData.length === 0) {
            console.error('No "All ages" data found for initial view.');
            return;
        }
        xDomain = chartData.map(d => d.JURISDICTION);
        yValue = d => d.fines;
        title = "Total Fines by Jurisdiction (All Ages)";
        xAxisTitle = "Jurisdiction";
        yAxisTitle = "Total Fines";
    }

    console.log('Filtered chart data:', chartData);

    const x = d3.scaleBand()
        .domain(xDomain)
        .range([0, width])
        .padding(0.1);  // Increased padding to make bars smaller

    // Format y-axis ticks to show 200k, 300k, etc.
    const formatYAxis = (value) => {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'k';
        }
        return value;
    };

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, yValue)])
        .nice()
        .range([height, 0]);

    console.log('X domain:', x.domain(), 'X range:', x.range());

    // Color scale for bars (different colors per category)
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 35)
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(xAxisTitle);

    // Y-axis with formatted ticks
    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(formatYAxis))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(yAxisTitle);

        
    // Create bars with initial height of 0 for animation
    const bars = svg.selectAll(".bar")
        .data(chartData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(selectedJurisdiction ? d.AGE_GROUP : d.JURISDICTION))
        .attr("y", height) // Start from bottom
        .attr("width", x.bandwidth())
        .attr("height", 0) // Start with zero height
        .attr("fill", d => color(selectedJurisdiction ? d.AGE_GROUP : d.JURISDICTION))
        .style("cursor", selectedJurisdiction ? "default" : "pointer");

    // Animate bars rising up
    bars.transition()
        .duration(800) // Animation duration in milliseconds
        .delay((d, i) => i * 100) // Stagger the animation
        .ease(d3.easeCubicOut) // Smooth easing function
        .attr("y", d => y(yValue(d)))
        .attr("height", d => height - y(yValue(d)));

    console.log('Bars created:', bars.size());

    // Add value labels (animate them too)
    const labels = svg.selectAll(".bar-label")
        .data(chartData)
        .enter().append("text")
        .attr("class", "bar-label")
        .attr("x", d => x(selectedJurisdiction ? d.AGE_GROUP : d.JURISDICTION) + x.bandwidth() / 2)
        .attr("y", height) // Start from bottom
        .attr("text-anchor", "middle")
        .style("font-size", "17px")
        .style("font-weight", "bold")
        .style("fill", "#07204a")
        .style("opacity", 0) // Start invisible
        .text(d => formatYAxis(yValue(d)));

    // Animate labels
    labels.transition()
        .duration(800)
        .delay((d, i) => i * 100 + 400) // Start after bars begin animating
        .ease(d3.easeCubicOut)
        .attr("y", d => y(yValue(d)) - 8)
        .style("opacity", 1);

    // Tooltip setup
    bars.on("mouseover", function(event, d) {
            const tooltip = d3.select("#tooltip");
            tooltip.style("display", "block");
            let tooltipText = "";
            if (selectedJurisdiction) {
                tooltipText = `<strong>Age Group:</strong> ${d.AGE_GROUP}<br>
                               <strong>Fines:</strong> ${d.fines.toLocaleString()}<br>
                               <strong>Charges:</strong> ${d.charges}<br>
                               <strong>Arrests:</strong> ${d.arrests}<br>
                               <strong>Arrest Rate:</strong> ${d['arrest rate']}<br>
                               <strong>Charges Rate:</strong> ${d['charges rate']}<br>
                               <strong>Fines per Case:</strong> ${d['fines per case']}`;
            } else {
                tooltipText = `<strong>Jurisdiction:</strong> ${d.JURISDICTION}<br>
                               <strong>Total Fines:</strong> ${d.fines.toLocaleString()}`;
            }
            tooltip.html(tooltipText)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select("#tooltip").style("display", "none");
        });

    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top + 30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text(title);

    // Create legend container on the side within SVG
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 40}, 0)`);

    const legendItems = selectedJurisdiction 
        ? [...new Set(chartData.map(d => d.AGE_GROUP))]
        : chartData.map(d => d.JURISDICTION);

    legendItems.forEach((item, i) => {
        const legendItem = legend.append("g")
            .attr("transform", `translate(0, ${i * 25})`);

        legendItem.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(item));

        legendItem.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .attr("dy", "0.35em")
            .style("font-size", "11px")
            .style("fill", "#07204a")
            .text(item);
    });

    console.log('Chart drawn successfully.');
}
