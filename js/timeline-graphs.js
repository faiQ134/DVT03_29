// Global variables
let rawData = [];
let filteredData = [];
let aggregatedData = [];

// Chart dimensions and margins
const margin = { top: 20, right: 30, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 350 - margin.top - margin.bottom;

// Color scales
const jurisdictionColors = {
    'NSW': '#ff6b6b',
    'VIC': '#4ecdc4',
    'QLD': '#45b7d1',
    'WA': '#96ceb4',
    'SA': '#feca57',
    'TAS': '#ff9ff3',
    'ACT': '#54a0ff',
    'NT': '#5f27cd'
};

const ageGroupColors = {
    '0-16': '#ff9ff3',
    '17-25': '#feca57',
    '26-39': '#ff6b6b',
    '40-64': '#48dbfb',
    '65 and over': '#1dd1a1'
};

// Initialize the application
async function init() {
    await loadData();
    populateFilters();
    setupEventListeners();
    updateCharts();
}

// Load data from CSV
async function loadData() {
    try {
        rawData = await d3.csv('./Data/fines.csv', d => ({
            year: +d.YEAR,
            startDate: new Date(d.START_DATE),
            endDate: new Date(d.END_DATE),
            jurisdiction: d.JURISDICTION,
            ageGroup: d.AGE_GROUP,
            metric: d.METRIC,
            detectionMethod: d.DETECTION_METHOD,
            fines: +d.FINES,
            arrests: +d.ARRESTS,
            charges: +d.CHARGES,
            prediction: +d.prediction
        }));
        
        processData();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data. Please check if fines_data.csv is available.');
    }
}

// Process and aggregate data
function processData() {
    // Aggregate data by month and jurisdiction/age group
    aggregatedData = rawData;
}

// Populate filter dropdowns
function populateFilters() {
    const jurisdictions = [...new Set(rawData.map(d => d.jurisdiction))];
    const ageGroups = [...new Set(rawData.map(d => d.ageGroup))];
    
    const jurisdictionSelect = d3.select('#jurisdiction');
    const ageGroupSelect = d3.select('#ageGroup');
    
    jurisdictions.forEach(jurisdiction => {
        jurisdictionSelect.append('option')
            .attr('value', jurisdiction)
            .text(jurisdiction);
    });
    
    ageGroups.forEach(ageGroup => {
        ageGroupSelect.append('option')
            .attr('value', ageGroup)
            .text(ageGroup);
    });
}

// Setup event listeners for filters
function setupEventListeners() {
    document.getElementById('jurisdiction').addEventListener('change', updateCharts);
    document.getElementById('ageGroup').addEventListener('change', updateCharts);
    document.getElementById('timeRange').addEventListener('change', updateCharts);
    document.getElementById('chartType').addEventListener('change', updateCharts);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

// Reset all filters
function resetFilters() {
    document.getElementById('jurisdiction').value = 'all';
    document.getElementById('ageGroup').value = 'all';
    document.getElementById('timeRange').value = 'all';
    document.getElementById('chartType').value = 'line';
    updateCharts();
}

// Update all charts based on current filters
function updateCharts() {
    applyFilters();
    createLineChart();
    createAgeGroupChart();
    createJurisdictionChart();
    updateStatistics();
    updateDataTable();
}

// Apply current filters to data
function applyFilters() {
    const jurisdiction = document.getElementById('jurisdiction').value;
    const ageGroup = document.getElementById('ageGroup').value;
    const timeRange = document.getElementById('timeRange').value;
    
    let filtered = [...rawData];
    
    // Apply jurisdiction filter
    if (jurisdiction !== 'all') {
        filtered = filtered.filter(d => d.jurisdiction === jurisdiction);
    }
    
    // Apply age group filter
    if (ageGroup !== 'all') {
        filtered = filtered.filter(d => d.ageGroup === ageGroup);
    }
    
    // Apply time range filter
    if (timeRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (timeRange) {
            case '1year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case '2years':
                startDate.setFullYear(now.getFullYear() - 2);
                break;
        }
        
        filtered = filtered.filter(d => d.startDate >= startDate);
    }
    
    filteredData = filtered;
}

// Create main line chart
function createLineChart() {
    const chartType = document.getElementById('chartType').value;
    const container = d3.select('#lineChart');
    container.html('');
    
    // Aggregate data by month
    const monthlyData = d3.rollup(filteredData,
        v => d3.sum(v, d => d.fines),
        d => d3.timeFormat('%Y-%m')(d.startDate)
    );
    
    const monthlyArray = Array.from(monthlyData, ([month, fines]) => ({
        month: new Date(month + '-01'),
        fines: fines,
        formattedMonth: d3.timeFormat('%b %Y')(new Date(month + '-01'))
    })).sort((a, b) => a.month - b.month);
    
    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(monthlyArray, d => d.month))
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(monthlyArray, d => d.fines)])
        .range([height, 0])
        .nice();
    
    // Axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(monthlyArray.length > 12 ? 3 : 1))
        .tickFormat(d3.timeFormat('%b %Y'));
    
    const yAxis = d3.axisLeft(yScale);
    
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);
    
    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
    
    // Grid lines
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
        );
    
    // Create line
    const line = d3.line()
        .x(d => xScale(d.month))
        .y(d => yScale(d.fines))
        .curve(d3.curveMonotoneX);
    
    if (chartType === 'stacked') {
        // For stacked area chart, we need to aggregate by jurisdiction or age group
        createStackedAreaChart(svg, xScale, yScale);
    } else {
        // Regular line chart
        svg.append('path')
            .datum(monthlyArray)
            .attr('class', 'line')
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', '#67c1ff')
            .style('stroke-width', 3);
        
        // Dots
        svg.selectAll('.dot')
            .data(monthlyArray)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.month))
            .attr('cy', d => yScale(d.fines))
            .attr('r', 4)
            .style('fill', '#67c1ff')
            .style('stroke', '#fff')
            .style('stroke-width', 2);
    }
    
    // Add labels
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('fill', 'rgba(255, 255, 255, 0.7)')
        .text('Number of Fines');
}

// Create age group distribution chart
function createAgeGroupChart() {
    const container = d3.select('#ageGroupChart');
    container.html('');
    
    // Aggregate by age group
    const ageGroupData = d3.rollup(filteredData,
        v => d3.sum(v, d => d.fines),
        d => d.ageGroup
    );
    
    const ageGroupArray = Array.from(ageGroupData, ([ageGroup, fines]) => ({
        ageGroup: ageGroup,
        fines: fines
    })).sort((a, b) => b.fines - a.fines);
    
    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleBand()
        .domain(ageGroupArray.map(d => d.ageGroup))
        .range([0, width])
        .padding(0.2);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(ageGroupArray, d => d.fines)])
        .range([height, 0])
        .nice();
    
    // Axes
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');
    
    svg.append('g')
        .attr('class', 'y axis')
        .call(d3.axisLeft(yScale));
    
    // Bars
    svg.selectAll('.bar')
        .data(ageGroupArray)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.ageGroup))
        .attr('y', d => yScale(d.fines))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.fines))
        .style('fill', d => ageGroupColors[d.ageGroup] || '#67c1ff')
        .style('opacity', 0.8);
}

// Create jurisdiction comparison chart
function createJurisdictionChart() {
    const container = d3.select('#jurisdictionChart');
    container.html('');
    
    // Aggregate by jurisdiction
    const jurisdictionData = d3.rollup(filteredData,
        v => d3.sum(v, d => d.fines),
        d => d.jurisdiction
    );
    
    const jurisdictionArray = Array.from(jurisdictionData, ([jurisdiction, fines]) => ({
        jurisdiction: jurisdiction,
        fines: fines
    })).sort((a, b) => b.fines - a.fines);
    
    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleBand()
        .domain(jurisdictionArray.map(d => d.jurisdiction))
        .range([0, width])
        .padding(0.2);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(jurisdictionArray, d => d.fines)])
        .range([height, 0])
        .nice();
    
    // Axes
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale));
    
    svg.append('g')
        .attr('class', 'y axis')
        .call(d3.axisLeft(yScale));
    
    // Bars
    svg.selectAll('.bar')
        .data(jurisdictionArray)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.jurisdiction))
        .attr('y', d => yScale(d.fines))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.fines))
        .style('fill', d => jurisdictionColors[d.jurisdiction] || '#67c1ff')
        .style('opacity', 0.8);
}

// Update statistics cards
function updateStatistics() {
    if (filteredData.length === 0) return;
    
    // Total fines
    const totalFines = d3.sum(filteredData, d => d.fines);
    document.getElementById('totalFines').textContent = totalFines.toLocaleString();
    
    // Peak month
    const monthlyData = d3.rollup(filteredData,
        v => d3.sum(v, d => d.fines),
        d => d3.timeFormat('%Y-%m')(d.startDate)
    );
    
    const monthlyArray = Array.from(monthlyData, ([month, fines]) => ({
        month: new Date(month + '-01'),
        fines: fines
    }));
    
    if (monthlyArray.length > 0) {
        const peakMonth = monthlyArray.reduce((max, d) => d.fines > max.fines ? d : max, monthlyArray[0]);
        document.getElementById('peakMonth').textContent = d3.timeFormat('%B %Y')(peakMonth.month);
        document.getElementById('peakMonthCount').textContent = `${peakMonth.fines} fines`;
    }
    
    // Dominant age group
    const ageGroupData = d3.rollup(filteredData,
        v => d3.sum(v, d => d.fines),
        d => d.ageGroup
    );
    
    const ageGroupArray = Array.from(ageGroupData, ([ageGroup, fines]) => ({
        ageGroup: ageGroup,
        fines: fines
    }));
    
    if (ageGroupArray.length > 0) {
        const dominantAge = ageGroupArray.reduce((max, d) => d.fines > max.fines ? d : max, ageGroupArray[0]);
        document.getElementById('dominantAge').textContent = dominantAge.ageGroup;
    }
    
    // Prediction rate
    const totalPredictions = d3.sum(filteredData, d => d.prediction);
    const predictionRate = (totalPredictions / filteredData.length) * 100;
    document.getElementById('predictionRate').textContent = `${predictionRate.toFixed(1)}%`;
}

// Update data table
function updateDataTable() {
    const tableBody = d3.select('#finesTable tbody');
    tableBody.html('');
    
    // Show recent data (last 10 entries)
    const recentData = filteredData
        .sort((a, b) => b.startDate - a.startDate)
        .slice(0, 10);
    
    const rows = tableBody.selectAll('tr')
        .data(recentData)
        .enter()
        .append('tr');
    
    rows.append('td')
        .text(d => d3.timeFormat('%d/%m/%Y')(d.startDate));
    
    rows.append('td')
        .text(d => d.jurisdiction);
    
    rows.append('td')
        .text(d => d.ageGroup);
    
    rows.append('td')
        .text(d => d.fines.toLocaleString());
    
    rows.append('td')
        .text(d => d.arrests);
    
    rows.append('td')
        .text(d => d.charges);
    
    rows.append('td')
        .text(d => d.prediction ? 'High Risk' : 'Low Risk')
        .attr('class', d => d.prediction ? 'risk-high' : 'risk-low');
}

// Helper function for stacked area chart (simplified)
function createStackedAreaChart(svg, xScale, yScale) {
    // This would create a more complex stacked area chart
    // For simplicity, we'll show a basic implementation
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .style('fill', 'rgba(255, 255, 255, 0.5)')
        .text('Stacked view available with more data');
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);
