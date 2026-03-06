// js/charts/timeline.js
export function createTimelineChart(containerSelector, { width = 900, height = 180 } = {}) {
  const margin = { top: 10, right: 20, bottom: 30, left: 45 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const container = d3.select(containerSelector);

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime().range([0, innerW]);
  const y = d3.scaleLinear().range([innerH, 0]);

  const xAxisG = g.append("g").attr("transform", `translate(0,${innerH})`);
  const yAxisG = g.append("g");

  const barsG = g.append("g").attr("class", "bars");
  const brushG = g.append("g").attr("class", "brush");

  // brush for time range selection
  const brush = d3
    .brushX()
    .extent([
      [0, 0],
      [innerW, innerH],
    ]);

  function render(dailyData, state, onBrushChange) {
    if (!dailyData || dailyData.length === 0) return;

    x.domain(d3.extent(dailyData, (d) => d.date));
    y.domain([0, d3.max(dailyData, (d) => d.count) || 1]);

    xAxisG.call(d3.axisBottom(x).ticks(6));
    yAxisG.call(d3.axisLeft(y).ticks(4));

    // Compute bar width using pixel distance between adjacent dates (robust)
    let barW = 2; // fallback
    if (dailyData.length >= 2) {
        const dx = x(dailyData[1].date) - x(dailyData[0].date);
        if (Number.isFinite(dx) && dx > 0) barW = Math.max(1, dx * 0.9);
    }

    const bars = barsG.selectAll("rect").data(dailyData, (d) => +d.date);

    bars
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => x(d.date) - barW / 2)
            .attr("y", innerH)
            .attr("width", barW)
            .attr("height", 0)
            .attr("rx", 1)
            .attr("ry", 1)
            .call((sel) =>
              sel
                .transition()
                .duration(200)
                .attr("y", (d) => y(d.count))
                .attr("height", (d) => innerH - y(d.count))
            ),
        (update) =>
          update.call((sel) =>
            sel
              .transition()
              .duration(200)
              .attr("x", (d) => x(d.date) - barW / 2)
              .attr("y", (d) => y(d.count))
              .attr("width", barW)
              .attr("height", (d) => innerH - y(d.count))
          ),
        (exit) => exit.remove()
      );

    // Hook up brush
    brush.on("brush end", (event) => {
      if (!event.selection) {
        state.timeRange = null;
        onBrushChange?.(state.timeRange);
        return;
      }
      const [x0, x1] = event.selection;
      const t0 = x.invert(x0);
      const t1 = x.invert(x1);
      state.timeRange = [t0, t1];
      onBrushChange?.(state.timeRange);
    });

    brushG.call(brush);

    // Restore brush selection from state (if any)
    if (state.timeRange) {
      brushG.call(brush.move, state.timeRange.map(x));
    }
  }

  return { render };
}