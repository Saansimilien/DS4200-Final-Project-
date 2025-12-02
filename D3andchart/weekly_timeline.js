// Set dimensions
const margin = {top: 40, right: 80, bottom: 80, left: 80};
const width = 1100 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3.select(".tooltip");

// Load data
d3.csv("weekly_aggregated_data.csv").then(data => {
    // Parse data
    data.forEach(d => {
        d.year = +d.year;
        d.week = +d.week;
        d.positive_cases = +d.positive_cases;
        d.total_tests = +d.total_tests;
        d.total_mosquitoes = +d.total_mosquitoes;
        d.positive_rate = +d.positive_rate;
    });
    
    // Get unique years for buttons
    const years = [...new Set(data.map(d => d.year))].sort();
    
    // Add year buttons
    const yearSelector = d3.select(".year-selector");
    years.forEach(year => {
        yearSelector.append("button")
            .attr("class", "year-button")
            .attr("data-year", year)
            .text(year)
            .on("click", function() {
                d3.selectAll(".year-button").classed("active", false);
                d3.select(this).classed("active", true);
                updateChart(year);
            });
    });
    
    // Function to filter and update chart
    function updateChart(selectedYear) {
        // Filter data
        let filteredData = selectedYear === "all" ? data : 
                          data.filter(d => d.year === selectedYear);
        
        // Aggregate by week if showing all years
        if (selectedYear === "all") {
            const weekMap = new Map();
            filteredData.forEach(d => {
                if (!weekMap.has(d.week)) {
                    weekMap.set(d.week, {
                        week: d.week,
                        positive_cases: 0,
                        total_mosquitoes: 0,
                        total_tests: 0
                    });
                }
                const entry = weekMap.get(d.week);
                entry.positive_cases += d.positive_cases;
                entry.total_mosquitoes += d.total_mosquitoes;
                entry.total_tests += d.total_tests;
            });
            filteredData = Array.from(weekMap.values());
            filteredData.forEach(d => {
                d.positive_rate = (d.positive_cases / d.total_tests * 100) || 0;
            });
        }
        
        // Sort by week
        filteredData.sort((a, b) => a.week - b.week);
        
        // Clear previous chart
        svg.selectAll("*").remove();
        
        // Set up scales
        const xScale = d3.scaleLinear()
            .domain([1, 52])
            .range([0, width]);
        
        const yScaleTop = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.positive_cases) * 1.15])
            .range([height / 2 - 50, 0]);
        
        const yScaleBottom = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.total_mosquitoes) * 1.15])
            .range([height, height / 2 + 50]);
        
        // Add divider line between panels
        svg.append("line")
            .attr("class", "divider")
            .attr("x1", 0)
            .attr("y1", height / 2)
            .attr("x2", width)
            .attr("y2", height / 2);
        
        // TOP PANEL: Positive cases
        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", width / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("WNV-Positive Mosquito Cases (Weekly)");
        
        // Area chart for positive cases
        const areaTop = d3.area()
            .x(d => xScale(d.week))
            .y0(height / 2 - 50)
            .y1(d => yScaleTop(d.positive_cases))
            .curve(d3.curveMonotoneX);
        
        svg.append("path")
            .datum(filteredData)
            .attr("class", "area")
            .attr("d", areaTop)
            .attr("fill", "#ff6b6b");
        
        // Line for positive cases
        const lineTop = d3.line()
            .x(d => xScale(d.week))
            .y(d => yScaleTop(d.positive_cases))
            .curve(d3.curveMonotoneX);
        
        svg.append("path")
            .datum(filteredData)
            .attr("class", "line")
            .attr("d", lineTop)
            .attr("stroke", "#c92a2a");
        
        // BOTTOM PANEL: Total mosquitoes
        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", width / 2)
            .attr("y", height / 2 + 35)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Total Mosquito Abundance (Weekly)");
        
        // Area chart for total mosquitoes
        const areaBottom = d3.area()
            .x(d => xScale(d.week))
            .y0(height)
            .y1(d => yScaleBottom(d.total_mosquitoes))
            .curve(d3.curveMonotoneX);
        
        svg.append("path")
            .datum(filteredData)
            .attr("class", "area")
            .attr("d", areaBottom)
            .attr("fill", "#4dabf7");
        
        // Line for total mosquitoes
        const lineBottom = d3.line()
            .x(d => xScale(d.week))
            .y(d => yScaleBottom(d.total_mosquitoes))
            .curve(d3.curveMonotoneX);
        
        svg.append("path")
            .datum(filteredData)
            .attr("class", "line")
            .attr("d", lineBottom)
            .attr("stroke", "#1971c2");
        
        // Add axes
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height / 2 - 50})`)
            .call(d3.axisBottom(xScale).ticks(12));
        
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScaleTop).ticks(6));
        
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(12));
        
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScaleBottom).ticks(6));
        
        // X-axis labels
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", height / 2 - 20)
            .attr("text-anchor", "middle")
            .text("Week of Year");
        
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .attr("text-anchor", "middle")
            .text("Week of Year");
        
        // Y-axis labels
        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 4 - 25))
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .text("WNV-Positive Cases");
        
        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height * 3/4 + 25))
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .text("Total Mosquitoes");
        
        // Add interactive circles for tooltips - TOP
        svg.selectAll(".dot-top")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "dot-top")
            .attr("cx", d => xScale(d.week))
            .attr("cy", d => yScaleTop(d.positive_cases))
            .attr("r", 5)
            .attr("fill", "#c92a2a")
            .attr("opacity", 0)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 1);
                tooltip.style("opacity", 1)
                    .html(`
                        <strong>Week ${d.week}</strong>
                        <div style="margin-top: 5px;">
                        Positive Cases: <strong>${d.positive_cases}</strong><br/>
                        Total Tests: ${d.total_tests.toLocaleString()}<br/>
                        Positive Rate: <strong>${d.positive_rate.toFixed(2)}%</strong>
                        </div>
                    `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0);
                tooltip.style("opacity", 0);
            });
        
        // Add interactive circles for tooltips - BOTTOM
        svg.selectAll(".dot-bottom")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "dot-bottom")
            .attr("cx", d => xScale(d.week))
            .attr("cy", d => yScaleBottom(d.total_mosquitoes))
            .attr("r", 5)
            .attr("fill", "#1971c2")
            .attr("opacity", 0)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 1);
                tooltip.style("opacity", 1)
                    .html(`
                        <strong>Week ${d.week}</strong>
                        <div style="margin-top: 5px;">
                        Total Mosquitoes: <strong>${d.total_mosquitoes.toLocaleString()}</strong><br/>
                        Tests Conducted: ${d.total_tests.toLocaleString()}<br/>
                        Positive Cases: ${d.positive_cases}
                        </div>
                    `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0);
                tooltip.style("opacity", 0);
            });
    }
    
    // Initial chart with all years
    updateChart("all");
    
}).catch(error => {
    console.error("Error loading data:", error);
    d3.select("#chart").append("div")
        .style("color", "red")
        .style("padding", "20px")
        .style("text-align", "center")
        .html(`
            <h3>Error Loading Data</h3>
            <p>Could not find 'weekly_aggregated_data.csv'</p>
            <p>Make sure the CSV file is in the same folder as this HTML file.</p>
            <p style="font-size: 12px; color: #666;">Error: ${error.message}</p>
        `);
});