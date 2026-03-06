// js/main.js
import { loadChicagoData } from "./utils/data.js";
import { createTimelineChart } from "./charts/timeline.js";

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
  const { daily, sample } = await loadChicagoData();
  console.log("Daily rows:", daily.length, daily[0], daily[daily.length - 1]);
  console.log("Sample rows:", sample.length, sample[0]);

  const timeline = createTimelineChart("#timeline", { width: 950, height: 200 });

  function render() {
    timeline.render(daily, state, (range) => {
      document.querySelector("#timeline-readout").textContent = formatRange(range);
      // Later: when range changes, we’ll filter 'sample' + update other charts
      console.log("timeRange:", range);
    });

    document.querySelector("#chart").textContent =
      "Next implement bar chart + scatter and connect to state.timeRange";
  }

  render();
})();