// js/main.js
import { loadChicagoData, loadTypeCounts } from "./utils/data.js";
import { createTimelineChart } from "./charts/timeline.js";
import { createBarChart } from "./charts/bargraph.js";

const state = {
  timeRange: null, // [Date, Date]
  crimeTypes: new Set(),
  district: "ALL",
  arrest: "ALL",
};

function formatRange(range) {
  if (!range) return "No time filter (showing all).";
  const [a, b] = range;
  return `Selected: ${a.toLocaleDateString()} → ${b.toLocaleDateString()}`;
}

(async function init() {
  // Make sure we’re running with a server (Live Server / Pages)
  const [{ daily, sample }, typeCounts] = await Promise.all([
    loadChicagoData(),
    loadTypeCounts(),
  ]);
  console.log("Daily rows:", daily.length, daily[0], daily[daily.length - 1]);
  console.log("Sample rows:", sample.length, sample[0]);
  console.log("Type counts:", typeCounts.length, typeCounts[0]);

  const timeline = createTimelineChart("#timeline", { width: 950, height: 200 });
  const barChart = createBarChart("#bargraph", { width: 950, height: 660 });

  function render() {
    timeline.render(daily, state, (range) => {
      document.querySelector("#timeline-readout").textContent = formatRange(range);
      console.log("timeRange:", range);
    });

    barChart.render(typeCounts);
  }

  render();
})();