// Global variables
let timelineData = [];

// Chart dimensions and margins
const margin = { top: 40, right: 80, bottom: 80, left: 80 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Color scale
const yearGradient = d3.scaleSequential(d3.interpolatePlasma)
    .domain([2008, 2024]);

// Initialize the application
async function init() {
    await loadData();
    createTimelineChart();
    setupTimelineInteractions();
    // Select the first year by default
    if (timelineData.length > 0) {
        selectYear(timelineData[0].year);
    }
}

// Load data from CSV
async function loadData() {
    try {
        // Load timeline data from your cleaned CSV
        timelineData = await d3.csv('./Data/fines_timeline.csv', d => ({
            year: +d.YEAR,
            fines: +d["Sum(FINES)"]
        }));
        
        // Sort by year to ensure proper order
        timelineData.sort((a, b) => a.year - b.year);
        
        // Calculate growth rates and other metrics
        processData();
        
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to hardcoded data
        createSampleData();
    }
}

function createSampleData() {
    timelineData = [
        {year: 2008, fines: 2639479},
        {year: 2009, fines: 2576271},
        {year: 2010, fines: 2518363},
        {year: 2011, fines: 2856108},
        {year: 2012, fines: 3004162},
        {year: 2013, fines: 2907678},
        {year: 2014, fines: 3669800},
        {year: 2015, fines: 3797740},
        {year: 2016, fines: 3265399},
        {year: 2017, fines: 3691401},
        {year: 2018, fines: 4279816},
        {year: 2019, fines: 3696730},
        {year: 2020, fines: 3773473},
        {year: 2021, fines: 4867138},
        {year: 2022, fines: 4551342},
        {year: 2023, fines: 4236097},
        {year: 2024, fines: 3323227}
    ];
    processData();
}

function processData() {
    // Add growth rate and other metrics
    timelineData.forEach((d, i) => {
        if (i > 0) {
            const prevFines = timelineData[i - 1].fines;
            d.growthRate = ((d.fines - prevFines) / prevFines * 100);
            d.growth = d.fines - prevFines;
        } else {
            d.growthRate = 0;
            d.growth = 0;
        }
        
        // Add performance category
        d.performance = d.growth > 0 ? 'increasing' : 'decreasing';
    });
}

function createTimelineChart() {
    const container = d3.select('#timelineChart');
    container.html('');
    
    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('class', 'timeline-svg')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([2007.5, 2024.5]) // Add padding for better visualization
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([2000000, 5000000]) // Fixed domain based on your data range
        .range([height, 0]);

    // Create gradient for the area
    const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'area-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
    
    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#67c1ff')
        .attr('stop-opacity', 0.3);
    
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#67c1ff')
        .attr('stop-opacity', 0);
    
    // Grid lines
    svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
            .tickSize(-height)
            .tickFormat('')
        )
        .style('opacity', 0.1);
    
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
        )
        .style('opacity', 0.1);
    
    // Area generator
    const area = d3.area()
        .x(d => xScale(d.year))
        .y0(height)
        .y1(d => yScale(d.fines))
        .curve(d3.curveMonotoneX);
    
    // Line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.fines))
        .curve(d3.curveMonotoneX);
    
    // Draw area
    svg.append('path')
        .datum(timelineData)
        .attr('class', 'area')
        .attr('d', area)
        .style('fill', 'url(#area-gradient)')
        .style('opacity', 0.6);
    
    // Draw line
    svg.append('path')
        .datum(timelineData)
        .attr('class', 'timeline-line')
        .attr('d', line)
        .style('fill', 'none')
        .style('stroke', '#67c1ff')
        .style('stroke-width', 4)
        .style('stroke-linecap', 'round');
    
    // Draw points
    const points = svg.selectAll('.data-point')
        .data(timelineData)
        .enter().append('circle')
        .attr('class', 'data-point')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.fines))
        .attr('r', 8)
        .style('fill', d => yearGradient(d.year))
        .style('stroke', '#ffffff')
        .style('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            showTooltip(event, d);
            highlightYear(d.year);
        })
        .on('mouseout', function() {
            hideTooltip();
            unhighlightYear();
        })
        .on('click', function(event, d) {
            selectYear(d.year);
        });
    
    // Add pulse animation to points
    points.each(function(d, i) {
        d3.select(this)
            .transition()
            .delay(i * 100)
            .duration(1000)
            .attr('r', 10)
            .transition()
            .duration(1000)
            .attr('r', 8);
    });
    
    // Axes with enhanced styling
    const xAxis = d3.axisBottom(xScale)
        .tickValues(d3.range(2008, 2025)) // Show all years
        .tickFormat(d3.format('d'))
        .tickSizeOuter(0);
    
    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d => (d / 1000000).toFixed(1) + 'M') // Format as millions
        .tickSizeOuter(0);
    
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .style('font-size', '12px')
        .style('color', '#ffffff')
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");
    
    svg.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .style('font-size', '12px')
        .style('color', '#ffffff');
    
    // Axis labels
    svg.append('text')
        .attr('transform', `translate(${width / 2},${height + margin.bottom - 10})`)
        .style('text-anchor', 'middle')
        .style('fill', '#ffffff')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text('Year');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left + 20)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('fill', '#ffffff')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text('Number of Fines (Millions)');
    
    // Add trend annotations
    addTrendAnnotations(svg, xScale, yScale);
    
    // Add statistics overlay
    addStatisticsOverlay(svg);
}

function addTrendAnnotations(svg, xScale, yScale) {
    // Find significant peaks
    const peaks = findSignificantPeaks();
    
    peaks.forEach(peak => {
        const annotation = svg.append('g')
            .attr('class', 'annotation')
            .attr('transform', `translate(${xScale(peak.year)},${yScale(peak.fines)})`);
        
        annotation.append('circle')
            .attr('r', 12)
            .style('fill', 'none')
            .style('stroke', '#ff6b6b')
            .style('stroke-width', 2)
            .style('opacity', 0.8);
        
        annotation.append('text')
            .attr('x', 20)
            .attr('y', -15)
            .style('fill', '#ff6b6b')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .text(peak.reason);
    });
}

function findSignificantPeaks() {
    const peaks = [];
    
    // Find the absolute maximum (2021)
    const maxPoint = timelineData.reduce((max, d) => d.fines > max.fines ? d : max, timelineData[0]);
    peaks.push({
        year: maxPoint.year,
        fines: maxPoint.fines,
        reason: 'Peak: 4.87M fines'
    });
    
    // Find significant growth points
    const significantGrowth = timelineData.filter(d => Math.abs(d.growthRate) > 15);
    significantGrowth.forEach(d => {
        if (d.growthRate > 0) {
            peaks.push({
                year: d.year,
                fines: d.fines,
                reason: `+${d.growthRate.toFixed(1)}% growth`
            });
        }
    });
    
    return peaks;
}

function addStatisticsOverlay(svg) {
    const stats = calculateOverallStats();
    
    const statsBox = svg.append('g')
        .attr('class', 'stats-overlay')
        .attr('transform', `translate(${width - 220}, 20)`);
    
    statsBox.append('rect')
        .attr('width', 200)
        .attr('height', 120)
        .attr('rx', 8)
        .style('fill', 'rgba(0, 0, 0, 0.8)')
        .style('stroke', '#67c1ff')
        .style('stroke-width', 1);
    
    statsBox.append('text')
        .attr('x', 100)
        .attr('y', 25)
        .style('text-anchor', 'middle')
        .style('fill', '#ffffff')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text('2008-2024 Overview');
    
    const statsContent = [
        `Total: ${d3.format('.3s')(stats.totalFines).replace('G', 'B')}`,
        `Avg/Year: ${d3.format('.3s')(stats.avgFines).replace('G', 'B')}`,
        `Peak: ${stats.peakYear} (${d3.format('.3s')(stats.peakFines).replace('G', 'B')})`,
        `Growth: ${stats.totalGrowth}% overall`
    ];
    
    statsContent.forEach((text, i) => {
        statsBox.append('text')
            .attr('x', 15)
            .attr('y', 50 + i * 18)
            .style('fill', '#e6f7ff')
            .style('font-size', '11px')
            .style('font-weight', '500')
            .text(text);
    });
}

function calculateOverallStats() {
    const totalFines = d3.sum(timelineData, d => d.fines);
    const peakYearData = timelineData.reduce((max, d) => d.fines > max.fines ? d : max, timelineData[0]);
    const avgFines = totalFines / timelineData.length;
    const totalGrowth = ((timelineData[timelineData.length - 1].fines - timelineData[0].fines) / timelineData[0].fines * 100).toFixed(1);
    
    return {
        totalFines,
        avgFines,
        peakYear: peakYearData.year,
        peakFines: peakYearData.fines,
        totalGrowth
    };
}

function setupTimelineInteractions() {
    // Add year selector buttons
    const yearSelector = d3.select('#yearSelector');
    yearSelector.html(''); // Clear existing content
    
    timelineData.forEach((d, i) => {
        yearSelector.append('button')
            .attr('class', 'year-btn')
            .attr('data-year', d.year)
            .text(d.year)
            .on('click', function() {
                const year = +d3.select(this).attr('data-year');
                selectYear(year);
            });
    });
    
    // Add auto-play functionality
    d3.select('#playTimeline').on('click', playTimeline);
    d3.select('#pauseTimeline').on('click', pauseTimeline);
    d3.select('#resetTimeline').on('click', resetTimeline);
}

let timelineInterval;
let currentPlayIndex = 0;

function playTimeline() {
    pauseTimeline(); // Clear any existing interval
    currentPlayIndex = 0;
    
    timelineInterval = setInterval(() => {
        if (currentPlayIndex >= timelineData.length) {
            currentPlayIndex = 0; // Loop back to start
        }
        
        const yearData = timelineData[currentPlayIndex];
        selectYear(yearData.year);
        
        currentPlayIndex++;
    }, 1500); // 1.5 seconds per year
}

function pauseTimeline() {
    if (timelineInterval) {
        clearInterval(timelineInterval);
        timelineInterval = null;
    }
}

function resetTimeline() {
    pauseTimeline();
    unhighlightYear();
    hideTooltip();
    // Reset to first year
    if (timelineData.length > 0) {
        selectYear(timelineData[0].year);
    }
}

function highlightYear(year) {
    d3.selectAll('.data-point')
        .style('opacity', 0.3)
        .filter(d => d.year === year)
        .style('opacity', 1)
        .transition()
        .duration(300)
        .attr('r', 12);
}

function unhighlightYear() {
    d3.selectAll('.data-point')
        .style('opacity', 1)
        .transition()
        .duration(300)
        .attr('r', 8);
}

function selectYear(year) {
    const yearData = timelineData.find(d => d.year === year);
    if (yearData) {
        updateYearDetails(yearData);
        highlightYear(year);
        
        // Update active state in year buttons
        d3.selectAll('.year-btn')
            .classed('active', false)
            .filter(d => +d3.select(d).attr('data-year') === year)
            .classed('active', true);
    }
}

function updateYearDetails(yearData) {
    const details = d3.select('#yearDetails');
    
    details.html(`
        <div class="year-detail-card">
            <h3>${yearData.year} Summary</h3>
            <div class="detail-item">
                <span class="label">Total Fines:</span>
                <span class="value">${d3.format(',')(yearData.fines)}</span>
            </div>
            <div class="detail-item">
                <span class="label">Growth Rate:</span>
                <span class="value ${yearData.growth > 0 ? 'positive' : 'negative'}">
                    ${yearData.growth > 0 ? '+' : ''}${yearData.growthRate.toFixed(1)}%
                </span>
            </div>
            <div class="detail-item">
                <span class="label">Change from Previous:</span>
                <span class="value ${yearData.growth > 0 ? 'positive' : 'negative'}">
                    ${yearData.growth > 0 ? '+' : ''}${d3.format(',')(yearData.growth)}
                </span>
            </div>
            <div class="detail-item">
                <span class="label">Trend:</span>
                <span class="value ${yearData.performance}">
                    ${yearData.performance === 'increasing' ? '📈 Increasing' : '📉 Decreasing'}
                </span>
            </div>
        </div>
    `);
}

function showTooltip(event, d) {
    const tooltip = d3.select('#timelineTooltip');
    
    tooltip.html(`
        <div class="tooltip-year">${d.year}</div>
        <div class="tooltip-fines">${d3.format(',')(d.fines)} fines</div>
        <div class="tooltip-growth ${d.growth > 0 ? 'positive' : 'negative'}">
            ${d.growth > 0 ? '↗' : '↘'} ${d.growthRate.toFixed(1)}% from previous year
        </div>
        <div class="tooltip-change ${d.growth > 0 ? 'positive' : 'negative'}">
            ${d.growth > 0 ? '+' : ''}${d3.format(',')(d.growth)} change
        </div>
    `)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 15) + 'px')
    .style('display', 'block')
    .style('opacity', 1);
}

function hideTooltip() {
    d3.select('#timelineTooltip')
        .style('opacity', 0)
        .style('display', 'none');
}

// Add enhanced CSS
const timelineStyles = `
.timeline-svg {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
}

.data-point {
    transition: all 0.3s ease;
}

.data-point:hover {
    r: 12 !important;
    filter: drop-shadow(0 0 10px rgba(103, 193, 255, 0.8));
}

.timeline-line {
    filter: drop-shadow(0 2px 6px rgba(103, 193, 255, 0.4));
}

.annotation text {
    font-family: 'Segoe UI', sans-serif;
    font-weight: 600;
}

.stats-overlay text {
    font-family: 'Segoe UI', sans-serif;
}

.year-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin: 20px 0;
    padding: 15px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
}

.year-btn {
    padding: 8px 16px;
    border: 1px solid rgba(103, 193, 255, 0.3);
    background: rgba(103, 193, 255, 0.1);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Segoe UI', sans-serif;
    font-size: 12px;
    font-weight: 500;
}

.year-btn:hover {
    background: rgba(103, 193, 255, 0.3);
    transform: translateY(-2px);
}

.year-btn.active {
    background: #67c1ff;
    color: #000;
    font-weight: 600;
}

.control-btn {
    padding: 10px 20px;
    margin: 0 5px;
    border: none;
    background: var(--gradient-secondary);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Segoe UI', sans-serif;
    font-weight: 600;
    transition: all 0.3s ease;
}

.control-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(106, 92, 255, 0.4);
}

.positive {
    color: #4ecdc4;
    font-weight: 600;
}

.negative {
    color: #ff6b6b;
    font-weight: 600;
}

#timelineTooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.95);
    color: white;
    padding: 15px;
    border-radius: 10px;
    border: 1px solid #67c1ff;
    pointer-events: none;
    z-index: 1000;
    backdrop-filter: blur(10px);
    min-width: 160px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.tooltip-year {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 5px;
    color: #67c1ff;
}

.tooltip-fines {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 5px;
}

.tooltip-growth, .tooltip-change {
    font-size: 12px;
    margin-bottom: 3px;
}

.year-details {
    margin-top: 20px;
    padding: 20px;
}

.year-detail-card {
    background: rgba(255, 255, 255, 0.1);
    padding: 25px;
    border-radius: 12px;
    border: 1px solid rgba(103, 193, 255, 0.3);
    backdrop-filter: blur(10px);
}

.year-detail-card h3 {
    color: #67c1ff;
    margin-bottom: 20px;
    font-size: 1.5rem;
    border-bottom: 2px solid rgba(103, 193, 255, 0.3);
    padding-bottom: 10px;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-item .label {
    color: #e6f7ff;
    font-weight: 500;
}

.detail-item .value {
    font-weight: 600;
}

.increasing {
    color: #4ecdc4;
}

.decreasing {
    color: #ff6b6b;
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = timelineStyles;
document.head.appendChild(styleSheet);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);