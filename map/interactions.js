// interactions.js
let selectedState = null;

function fadeUpdateInfo(html) {
    const box = d3.select("#info-content");

    box.classed("fade-out", true);

    setTimeout(() => {
        box.html(html);
        box.classed("fade-out", false);
    }, 400); // matches CSS duration
}

function setupInteractions(states, data) {
    const totalFines = d3.sum(data, d => d.fines);

    states
        .on("mouseover", function(event, d) {
            const jurisdiction = d.properties.STATE_NAME;
            const stateData = data.find(item => jurisdictionMap[item.jurisdiction] === jurisdiction);

            if (stateData) {
                d3.select("#tooltip")
                    .style("opacity", 0.9)
                    .html(`<strong>${jurisdiction}</strong><br>Fines: ${stateData.fines}<br>Arrests: ${stateData.arrests}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function() {
            d3.select("#tooltip").style("opacity", 0);
        })
        .on("click", function(event, d) {
            const jurisdiction = d.properties.STATE_NAME;
            const stateData = data.find(item => jurisdictionMap[item.jurisdiction] === jurisdiction);

            if (stateData) {
                selectedState = selectedState === jurisdiction ? null : jurisdiction;
                d3.selectAll(".state").classed("selected", false);
                d3.select(this).classed("selected", true);

                const percentage = totalFines > 0 ? ((stateData.fines / totalFines) * 100).toFixed(2) : 0;

                fadeUpdateInfo(`
                    <strong>${jurisdiction}</strong><br>
                    Total Fines: ${stateData.fines}<br>
                    Percentage of Total Fines: ${percentage}%
                `);
            }
        });
}
