// js/utils/data.js
function pickColumn(columns, candidates) {
  // columns: array of header strings
  // candidates: array of possible names (case-insensitive)
  const lowered = columns.map((c) => c.toLowerCase());
  for (const cand of candidates) {
    const idx = lowered.indexOf(cand.toLowerCase());
    if (idx !== -1) return columns[idx];
  }
  return null;
}

function toBool(v) {
  return String(v).trim().toLowerCase() === "true";
}

export async function loadChicagoData() {
  // Load raw so we can inspect headers via .columns
  const dailyRaw = await d3.csv("data/chicago_crimes_daily_2024_2025.csv");
  const sampleRaw = await d3.csv("data/chicago_crimes_sample_120k.csv");

  // ---- DAILY column mapping ----
  const dailyDateCol = pickColumn(dailyRaw.columns, ["day", "date", "Date"]);
  const dailyCountCol = pickColumn(dailyRaw.columns, ["count", "Count"]);
  const dailyArrestRateCol = pickColumn(dailyRaw.columns, ["arrest_rate", "arrest rate", "Arrest Rate"]);

  if (!dailyDateCol || !dailyCountCol) {
    console.error("Daily CSV headers:", dailyRaw.columns);
    throw new Error("Daily CSV missing required columns (date/count).");
  }

  const daily = dailyRaw
    .map((d) => {
      const dt = new Date(d[dailyDateCol]); // expects YYYY-MM-DD or parseable string
      const count = +d[dailyCountCol];
      const arrest_rate =
        dailyArrestRateCol && d[dailyArrestRateCol] !== "" ? +d[dailyArrestRateCol] : null;

      return { date: dt, count, arrest_rate };
    })
    .filter((d) => d.date instanceof Date && !isNaN(+d.date) && Number.isFinite(d.count))
    .sort((a, b) => a.date - b.date);

  // ---- SAMPLE column mapping ----
  const sampleDateCol = pickColumn(sampleRaw.columns, ["date", "Date"]);
  const sampleTypeCol = pickColumn(sampleRaw.columns, ["primary_type", "Primary Type", "primary type"]);
  const sampleDescCol = pickColumn(sampleRaw.columns, ["description", "Description"]);
  const sampleLocDescCol = pickColumn(sampleRaw.columns, ["location_description", "Location Description", "location description"]);
  const sampleArrestCol = pickColumn(sampleRaw.columns, ["arrest", "Arrest"]);
  const sampleDistrictCol = pickColumn(sampleRaw.columns, ["district", "District"]);
  const sampleLatCol = pickColumn(sampleRaw.columns, ["latitude", "Latitude"]);
  const sampleLonCol = pickColumn(sampleRaw.columns, ["longitude", "Longitude"]);

  if (!sampleDateCol || !sampleTypeCol || !sampleArrestCol) {
    console.error("Sample CSV headers:", sampleRaw.columns);
    throw new Error("Sample CSV missing required columns (date/primary type/arrest).");
  }

  const parsePortal = d3.timeParse("%m/%d/%Y %I:%M:%S %p"); // Chicago portal common format

  const sample = sampleRaw
    .map((d) => {
      const rawDate = d[sampleDateCol];
      const dt = parsePortal(rawDate) || new Date(rawDate);

      return {
        date: dt,
        primary_type: d[sampleTypeCol],
        description: sampleDescCol ? d[sampleDescCol] : undefined,
        location_description: sampleLocDescCol ? d[sampleLocDescCol] : undefined,
        arrest: toBool(d[sampleArrestCol]),
        district: sampleDistrictCol && d[sampleDistrictCol] !== "" ? +d[sampleDistrictCol] : null,
        latitude: sampleLatCol && d[sampleLatCol] !== "" ? +d[sampleLatCol] : null,
        longitude: sampleLonCol && d[sampleLonCol] !== "" ? +d[sampleLonCol] : null,
      };
    })
    .filter((d) => d.date instanceof Date && !isNaN(+d.date) && d.primary_type); // drop garbage rows

  return { daily, sample };
}

export async function loadTypeCounts() {
  const raw = await d3.csv("data/chicago_crimes_type_counts.csv");
  return raw
    .map((d) => ({ type: d["Primary Type"], count: +d["count"] }))
    .filter((d) => d.type && Number.isFinite(d.count) && d.count > 0);
}