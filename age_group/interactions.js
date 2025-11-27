
// Populate select and set up interactions
loadData((data) => {
    // Populate jurisdiction select
    const select = d3.select("#jurisdictionSelect");
    const jurisdictions = [...new Set(data.filter(d => d.AGE_GROUP === "All ages").map(d => d.JURISDICTION))];
    select.selectAll("option")
        .data([""].concat(jurisdictions)) // Add empty option for "all"
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d || "All Jurisdictions");

    // Draw initial chart
    createJurisdictionButtons(data);
    drawChart(data);

    // Handle select change
    select.on("change", function() {
        const selected = this.value;
        if (selected) {
            drawChart(data, selected);
        } else {
            drawChart(data); // Reset to initial
        }
    });

    // Handle reset button
    d3.select("#resetBtn").on("click", () => {
        select.property("value", ""); // Reset select
        createJurisdictionButtons(data);
        drawChart(data);
    });
});

