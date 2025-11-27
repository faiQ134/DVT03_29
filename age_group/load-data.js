// load-data- csv file
function loadData(callback) {
    d3.csv('./Data/Age_Group.csv').then(data => {
        console.log('Raw data loaded:', data); // Debugging: Check if data loads
        if (data.length === 0) {
            console.error('No data found in CSV. Check file path and contents.');
            return;
        }
        // Parse numeric columns
        data.forEach(d => {
            d.fines = +d.fines;
            d.charges = +d.charges;
            d.arrests = +d.arrests;
            d['arrest rate'] = +d['ARREST_RATE'];
            d['charges rate'] = +d['CHARGES_RATE'];
            d['fines per case'] = +d['FINES_PER_CASE'];
        });
        callback(data); // Pass raw data directly
    }).catch(error => {
        console.error('Error loading data:', error);
    });
}