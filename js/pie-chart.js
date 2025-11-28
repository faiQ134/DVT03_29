// Global variables
let data = [];
let currentDataType = 'fines';
let currentSortOrder = 'value';

// Color scale
const colorScale = d3.scaleOrdinal()
    .range([
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F1948A', '#73C6B6', '#BB8FCE', '#F7DC6F'
    ]);

// Initialize visualization
async function initializeVisualization() {
    await loadCSVData();
    setupEventListeners();
    updatePieChart();
}

// Load CSV data from external file
async function loadCSVData() {
    try {
        const csvData = await d3.csv('./Data/pie_chart-data.csv');
        
        data = csvData.map(row => ({
            method: row.DETECTION_METHOD,
            fines: parseInt(row['Sum(FINES)']) || 0,
            arrests: parseInt(row['Sum(ARRESTS)']) || 0,
            charges: parseInt(row['Sum(CHARGES)']) || 0
        }));
        
        console.log('Data loaded successfully:', data);
    } catch (error) {
        console.error('Error loading CSV file:', error);
        showError('Failed to load data. Please check if the CSV file exists.');
    }
}

// Set up event listeners
function setupEventListeners() {
    d3.select('#dataType').on('change', function() {
        currentDataType = this.value;
        updatePieChart();
    });
    
    d3.select('#sortOrder').on('change', function() {
        currentSortOrder = this.value;
        updatePieChart();
    });
}

// Update pie chart based on current filters
function updatePieChart() {
    const container = d3.select('#pieChart');
    container.html('');
    
    if (data.length === 0) {
        showLoading(container);
        return;
    }
    
    const chartData = prepareChartData();
    if (chartData.length === 0) {
        showNoData(container);
        return;
    }
    
    createPieChart(container, chartData);
    updateLegend(chartData);
    updateStats(chartData);
}

// Prepare chart data - FILTER OUT DATA LESS THAN 4%
function prepareChartData() {
    const total = d3.sum(data, x => x[currentDataType]);
    
    return data
        .map(d => ({
            method: d.method,
            value: d[currentDataType],
            originalValue: d[currentDataType],
            percentage: (d[currentDataType] / total) * 100
        }))
        .filter(d => d.value > 0 && d.percentage >= 4) // Only keep segments >= 4%
        .map(d => ({
            ...d,
            displayValue: d.value // Use actual value for display
        }));
}

// Create the pie chart
function createPieChart(container, chartData) {
    // Use larger fixed size
    const size = 600;
    const radius = size / 2 - 30;
    
    const svg = container.append('svg')
        .attr('width', size)
        .attr('height', size)
        .style('display', 'block')
        .style('margin', '0 auto');
    
    const g = svg.append('g')
        .attr('transform', `translate(${size / 2},${size / 2})`);
    
    const totalValue = d3.sum(chartData, d => d.originalValue);
    
    // Create pie generator
    const pie = d3.pie()
        .value(d => d.displayValue)
        .sort((a, b) => {
            return currentSortOrder === 'alphabetical' 
                ? a.method.localeCompare(b.method)
                : b.originalValue - a.originalValue;
        });
    
    // Create arc generator
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius * 0.9)
        .padAngle(0.02)
        .cornerRadius(6);
    
    // Create tooltip
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'pie-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('font-size', '14px')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    
    // Create arcs and slices
    const arcs = g.selectAll('.arc')
        .data(pie(chartData))
        .enter()
        .append('g')
        .attr('class', 'arc')
        .attr('data-method', d => d.data.method);
    
    // Draw pie slices with tooltips
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.method))
        .attr('stroke', 'rgba(255, 255, 255, 0.3)')
        .attr('stroke-width', 3)
        .style('opacity', 0.9)
        .on('mouseover', function(event, d) {
            // Highlight segment
            highlightSegment(d.data.method);
            
            // Show tooltip
            const percentage = (d.data.originalValue / totalValue) * 100;
            tooltip
                .style('opacity', 1)
                .html(`
                    <div><strong>${d.data.method}</strong></div>
                    <div>${getDataTypeLabel()}: ${formatValue(d.data.originalValue)}</div>
                    <div>Percentage: ${percentage.toFixed(1)}%</div>
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mousemove', function(event) {
            // Move tooltip with mouse
            tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
            // Remove highlight and hide tooltip
            resetHighlights();
            tooltip.style('opacity', 0);
        })
        .on('click', function(event, d) {
            // Keep tooltip visible on click
            const percentage = (d.data.originalValue / totalValue) * 100;
            tooltip
                .style('opacity', 1)
                .html(`
                    <div><strong>${d.data.method}</strong></div>
                    <div>${getDataTypeLabel()}: ${formatValue(d.data.originalValue)}</div>
                    <div>Percentage: ${percentage.toFixed(1)}%</div>
                    <div style="margin-top: 5px; font-size: 12px; color: #ccc;">Click anywhere to close</div>
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
            
            // Add click handler to close tooltip when clicking elsewhere
            const closeTooltip = function(e) {
                if (!e.target.closest('.arc')) {
                    tooltip.style('opacity', 0);
                    document.removeEventListener('click', closeTooltip);
                }
            };
            setTimeout(() => {
                document.addEventListener('click', closeTooltip);
            }, 100);
        });
    
    // Add clean percentage labels to ALL segments
    arcs.append('text')
        .attr('class', 'percentage-label')
        .attr('transform', d => {
            const pos = arc.centroid(d);
            return `translate(${pos[0]}, ${pos[1]})`;
        })
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', d => {
            const percentage = (d.data.originalValue / totalValue) * 100;
            // Responsive font sizing
            return percentage > 20 ? '16px' : percentage > 10 ? '14px' : '12px';
        })
        .style('font-weight', '700')
        .style('fill', d => getContrastColor(colorScale(d.data.method)))
        .style('pointer-events', 'none')
        .style('font-family', 'Arial, sans-serif')
        .style('text-shadow', '1px 1px 2px rgba(0, 0, 0, 0.5)') // Subtle shadow for readability
        .text(d => {
            const percentage = (d.data.originalValue / totalValue) * 100;
            return `${percentage.toFixed(1)}%`;
        });
}

// Update legend
function updateLegend(chartData) {
    const legend = d3.select('#legend');
    legend.html('');
    
    const legendItems = legend.selectAll('.legend-item')
        .data(chartData)
        .enter()
        .append('div')
        .attr('class', 'legend-item')
        .on('mouseover', function(event, d) {
            highlightSegment(d.method);
        })
        .on('mouseout', resetHighlights);
    
    legendItems.append('div')
        .attr('class', 'legend-color')
        .style('background-color', d => colorScale(d.method));
    
    legendItems.append('div')
        .attr('class', 'legend-text')
        .html(d => {
            const percentage = (d.originalValue / d3.sum(chartData, x => x.originalValue) * 100);
            return `
                <span class="legend-method">${d.method}</span>
                <span class="legend-details">${formatValue(d.originalValue)} (${percentage.toFixed(1)}%)</span>
            `;
        });
}

// Update statistics
function updateStats(chartData) {
    const total = d3.sum(chartData, d => d.originalValue);
    const largestSegment = chartData.reduce((max, d) => 
        d.originalValue > max.originalValue ? d : max, chartData[0]);
    
    d3.select('#totalValue').text(formatValue(total));
    d3.select('#largestSegment').text(largestSegment.method);
}

// Helper functions
function formatValue(value) {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
}

function getContrastColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

function getDataTypeLabel() {
    const labels = {
        'fines': 'Fines',
        'arrests': 'Arrests', 
        'charges': 'Charges'
    };
    return labels[currentDataType];
}

function highlightSegment(method) {
    d3.selectAll('.arc path').style('opacity', 0.3);
    d3.selectAll('.arc[data-method="' + method + '"] path').style('opacity', 1);
    
    d3.selectAll('.legend-item').style('background', 'transparent');
    d3.selectAll('.legend-item').filter(d => d.method === method)
        .style('background', 'rgba(255, 255, 255, 0.1)');
}

function resetHighlights() {
    d3.selectAll('.arc path').style('opacity', 0.9);
    d3.selectAll('.legend-item').style('background', 'transparent');
}

function showLoading(container) {
    container.html(`
        <div style="text-align: center; padding: 50px; color: #b0b0b0;">
            <div>Loading data...</div>
        </div>
    `);
}

function showNoData(container) {
    container.html(`
        <div style="text-align: center; padding: 50px; color: #b0b0b0;">
            <div>No data available for current selection</div>
        </div>
    `);
}

function showError(message) {
    const container = d3.select('#pieChart');
    container.html(`
        <div style="text-align: center; padding: 50px; color: #e74c3c;">
            <div>${message}</div>
        </div>
    `);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeVisualization);