// js/charts/bargraph.js
export function createBarChart(containerSelector, { width = 950, height = 660 } = {}) {
  const margin = { top: 10, right: 60, bottom: 50, left: 270 };
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

  const x = d3.scaleLinear().range([0, innerW]);
  const y = d3.scaleBand().range([0, innerH]).padding(0.25);

  const xAxisG = g.append("g").attr("transform", `translate(0,${innerH})`);
  const yAxisG = g.append("g");
  const barsG  = g.append("g").attr("class", "bars");
  const hoverG = g.append("g").attr("class", "hover-targets");

  // Axis labels
  g.append("text")
    .attr("class", "axis-label")
    .attr("x", innerW / 2)
    .attr("y", innerH + 44)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Number of Incidents");


  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "bar-tooltip");

  function render(data) {
    if (!data || data.length === 0) return;

    // Sort descending by count
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const total = d3.sum(sorted, (d) => d.count);

    x.domain([0, d3.max(sorted, (d) => d.count)]);
    y.domain(sorted.map((d) => d.type));

    // X axis: compact tick format
    xAxisG.call(
      d3.axisBottom(x)
        .ticks(6)
        .tickFormat(d3.format("~s"))
    );

    // Y axis
    yAxisG.call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove();

    yAxisG.selectAll(".tick text")
      .style("font-size", "11px")
      .attr("dx", "-4");

    // Bars
    barsG.selectAll("rect")
      .data(sorted, (d) => d.type)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("y", (d) => y(d.type))
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", 0)
            .attr("rx", 3)
            .attr("fill", "#4a7fb5")
            .call((sel) =>
              sel.transition().duration(400)
                .attr("width", (d) => x(d.count))
            ),
        (update) =>
          update.call((sel) =>
            sel.transition().duration(400)
              .attr("y", (d) => y(d.type))
              .attr("width", (d) => x(d.count))
              .attr("height", y.bandwidth())
          ),
        (exit) => exit.remove()
      )
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "#2a5f9a");
        const pct = ((d.count / total) * 100).toFixed(1);
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.type}</strong><br>` +
            `Count: <strong>${d3.format(",")(d.count)}</strong><br>` +
            `Share: <strong>${pct}%</strong> of all crimes`
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", (event.pageX + 14) + "px")
          .style("top",  (event.pageY - 36) + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "#4a7fb5");
        tooltip.style("opacity", 0);
      });

    // Invisible full-width overlay rects so small bars are hoverable across the whole row
    hoverG.selectAll("rect")
      .data(sorted, (d) => d.type)
      .join("rect")
      .attr("y", (d) => y(d.type))
      .attr("x", 0)
      .attr("width", innerW)
      .attr("height", y.bandwidth())
      .attr("fill", "transparent")
      .on("mouseover", function (event, d) {
        barsG.selectAll("rect").filter((b) => b.type === d.type).attr("fill", "#2a5f9a");
        const pct = ((d.count / total) * 100).toFixed(1);
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.type}</strong><br>` +
            `Count: <strong>${d3.format(",")(d.count)}</strong><br>` +
            `Share: <strong>${pct}%</strong> of all crimes`
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", (event.pageX + 14) + "px")
          .style("top",  (event.pageY - 36) + "px");
      })
      .on("mouseout", function (event, d) {
        barsG.selectAll("rect").filter((b) => b.type === d.type).attr("fill", "#4a7fb5");
        tooltip.style("opacity", 0);
      });
  }

  return { render };
}
