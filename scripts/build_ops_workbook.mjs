import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = new URL("../", import.meta.url);
const payload = JSON.parse(await fs.readFile(new URL("dashboard/public/data/pulse_data.json", root), "utf8"));
const outputDir = new URL("excel/", root);
await fs.mkdir(outputDir, { recursive: true });

const wb = Workbook.create();
const dashboard = wb.worksheets.add("Executive Dashboard");
const areas = wb.worksheets.add("Hyderabad Areas");
const attention = wb.worksheets.add("Restaurant Attention");
const stats = wb.worksheets.add("Statistical Tests");
const models = wb.worksheets.add("Model Performance");

const c = {
  navy: "#102A43", white: "#FFFFFF", text: "#243B53", border: "#D9E2EC",
  blue: "#EAF2FF", teal: "#E9F8F6", amber: "#FFF7DF",
  coral: "#FFF0ED", purple: "#EEEAFE", red: "#D64545", green: "#188C75",
};

function band(sheet, endColumn, title, subtitle) {
  sheet.showGridLines = false;
  sheet.mergeCells(`A1:${endColumn}1`);
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${endColumn}1`).format = {
    fill: c.navy, font: { bold: true, color: c.white, size: 20 },
    verticalAlignment: "center", rowHeight: 32,
  };
  sheet.mergeCells(`A2:${endColumn}2`);
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange(`A2:${endColumn}2`).format = {
    fill: c.navy, font: { color: "#B8CDE0", italic: true, size: 10 }, rowHeight: 20,
  };
}

function card(sheet, range, label, value, fill) {
  sheet.mergeCells(range);
  sheet.getRange(range).values = [[`${label}\n${value}`]];
  sheet.getRange(range).format = {
    fill, font: { bold: true, color: c.navy, size: 14 }, wrapText: true,
    horizontalAlignment: "center", verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: c.border },
  };
}

function styleTable(sheet, range, header) {
  sheet.getRange(range).format = {
    font: { color: c.text, size: 10 },
    borders: { preset: "all", style: "thin", color: "#E7EDF3" },
  };
  sheet.getRange(header).format = {
    fill: c.navy, font: { bold: true, color: c.white, size: 10 },
    wrapText: true, verticalAlignment: "center",
  };
}

band(dashboard, "N", "QuickCommerce Pulse | Real-Data Dashboard", "Delivery benchmark and Hyderabad restaurant intelligence are analyzed as separate tracks");
card(dashboard, "A4:C6", "DELIVERY RECORDS", payload.kpis.delivery_records.toLocaleString(), c.blue);
card(dashboard, "D4:F6", "HYDERABAD RESTAURANTS", payload.kpis.hyderabad_restaurants.toLocaleString(), c.teal);
card(dashboard, "G4:I6", "AVG DELIVERY", `${payload.kpis.avg_delivery_time_min.toFixed(1)} min`, c.amber);
card(dashboard, "J4:L6", "UNDER 60 MIN", `${payload.kpis.under_60_rate_pct.toFixed(1)}%`, c.coral);
card(dashboard, "M4:N6", "BEST R2", payload.model_metrics[0].r2.toFixed(3), c.purple);
dashboard.mergeCells("A8:N10");
dashboard.getRange("A8").values = [[`EXECUTIVE SUMMARY\n${payload.executive_summary}`]];
dashboard.getRange("A8:N10").format = {
  fill: "#EAF2F8", font: { color: c.text, size: 11 }, wrapText: true,
  verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: c.border },
};

const topAreas = payload.area_metrics.slice(0, 12);
dashboard.getRange(`A13:C${13 + topAreas.length}`).values = [
  ["Area", "Restaurants", "Avg Listed Delivery"],
  ...topAreas.map((row) => [row.area, row.restaurants, row.avg_delivery_time_min]),
];
styleTable(dashboard, `A13:C${13 + topAreas.length}`, "A13:C13");
dashboard.getRange("A:A").format.columnWidth = 29;
dashboard.getRange("B:C").format.columnWidth = 18;
const areaChart = dashboard.charts.add("bar", dashboard.getRange(`A13:C${13 + topAreas.length}`));
areaChart.title = "Hyderabad Areas by Listed Delivery Time";
areaChart.hasLegend = false;
areaChart.yAxis = { numberFormatCode: "0.0" };
areaChart.setPosition("E13", "N29");

dashboard.getRange("A31:D34").values = [
  ["Model", "R2", "MAE", "RMSE"],
  ...payload.model_metrics.map((row) => [row.model, row.r2, row.mae, row.rmse]),
];
styleTable(dashboard, "A31:D34", "A31:D31");
dashboard.getRange("B32:B34").format.numberFormat = "0.000";
dashboard.getRange("C32:D34").format.numberFormat = "0.00";
dashboard.getRange(`F31:I${31 + payload.weather_metrics.length}`).values = [
  ["Weather", "Records", "Avg Delivery", "Under 60 %"],
  ...payload.weather_metrics.map((row) => [row.weather, row.records, row.avg_delivery_time_min, row.under_60_rate_pct]),
];
styleTable(dashboard, `F31:I${31 + payload.weather_metrics.length}`, "F31:I31");

band(areas, "G", "Hyderabad Area Intelligence", "Real Swiggy listings; areas shown contain at least five restaurants");
areas.getRange("A4:G4").values = [["Area", "Restaurants", "Avg Delivery", "Avg Rating", "Median Price", "Total Reviews", "Priority Listings"]];
areas.getRange(`A5:G${4 + payload.area_metrics.length}`).values = payload.area_metrics.map((row) => [
  row.area, row.restaurants, row.avg_delivery_time_min, row.avg_rating,
  row.median_price, row.total_reviews, row.priority_restaurants,
]);
styleTable(areas, `A4:G${4 + payload.area_metrics.length}`, "A4:G4");
areas.tables.add(`A4:G${4 + payload.area_metrics.length}`, true, "HyderabadAreaTable").style = "TableStyleMedium2";
areas.freezePanes.freezeRows(4);
areas.getRange("A:A").format.columnWidth = 31;
areas.getRange("B:G").format.columnWidth = 16;
areas.getRange(`C5:D${4 + payload.area_metrics.length}`).format.numberFormat = "0.0";
areas.getRange(`E5:E${4 + payload.area_metrics.length}`).format.numberFormat = "₹#,##0";
areas.getRange(`F5:F${4 + payload.area_metrics.length}`).format.numberFormat = "#,##0";
areas.getRange(`C5:C${4 + payload.area_metrics.length}`).conditionalFormats.add("colorScale", {
  colors: ["#DDF5EA", "#FFF2C7", "#F7C6C6"], thresholds: ["min", "50%", "max"],
});

band(attention, "I", "Restaurant Attention Board", "Heuristic: 45% delivery pressure, 35% rating weakness, 20% review uncertainty");
attention.getRange("A4:I4").values = [["Restaurant", "Area", "Cuisine", "Price", "Rating", "Reviews", "Delivery", "Attention Score", "Tier"]];
attention.getRange(`A5:I${4 + payload.restaurant_attention.length}`).values = payload.restaurant_attention.map((row) => [
  row.name, row.area, row.primary_cuisine, row.price, row.avg_rating,
  row.total_ratings, row.delivery_time_min, row.attention_score, row.attention_tier,
]);
styleTable(attention, `A4:I${4 + payload.restaurant_attention.length}`, "A4:I4");
attention.tables.add(`A4:I${4 + payload.restaurant_attention.length}`, true, "RestaurantAttentionTable").style = "TableStyleMedium2";
attention.freezePanes.freezeRows(4);
attention.getRange("A:A").format.columnWidth = 30;
attention.getRange("B:C").format.columnWidth = 22;
attention.getRange("D:I").format.columnWidth = 14;
attention.getRange(`D5:D${4 + payload.restaurant_attention.length}`).format.numberFormat = "₹#,##0";
attention.getRange(`E5:H${4 + payload.restaurant_attention.length}`).format.numberFormat = "0.0";
attention.getRange(`H5:H${4 + payload.restaurant_attention.length}`).conditionalFormats.add("colorScale", {
  colors: ["#DDF5EA", "#FFF2C7", "#F7C6C6"], thresholds: ["min", "50%", "max"],
});
attention.getRange(`I5:I${4 + payload.restaurant_attention.length}`).conditionalFormats.add(
  "containsText", { text: "Priority", format: { fill: "#FDE2E2", font: { bold: true, color: c.red } } },
);

band(stats, "F", "Statistical Validation", "Tests performed on the real delivery benchmark");
stats.getRange("A4:F4").values = [["Question", "Method", "Statistic", "P-value", "Effect / Coefficient", "Conclusion"]];
stats.getRange(`A5:F${4 + payload.statistical_tests.length}`).values = payload.statistical_tests.map((row) => [
  row.test, row.method, row.statistic, row.p_value, row.effect_min, row.conclusion,
]);
styleTable(stats, `A4:F${4 + payload.statistical_tests.length}`, "A4:F4");
stats.getRange("A:A").format.columnWidth = 34;
stats.getRange("B:B").format.columnWidth = 26;
stats.getRange("C:F").format.columnWidth = 19;
stats.getRange(`C5:E${4 + payload.statistical_tests.length}`).format.numberFormat = "0.0000";
stats.getRange(`F5:F${4 + payload.statistical_tests.length}`).conditionalFormats.add(
  "containsText", { text: "Statistically significant", format: { fill: "#DDF5EA", font: { bold: true, color: c.green } } },
);

band(models, "K", "Delivery Model Performance", "Holdout comparison and permutation feature importance");
models.getRange("A4:D4").values = [["Model", "R2", "MAE", "RMSE"]];
models.getRange("A5:D7").values = payload.model_metrics.map((row) => [row.model, row.r2, row.mae, row.rmse]);
styleTable(models, "A4:D7", "A4:D4");
models.getRange("A:A").format.columnWidth = 24;
models.getRange("B:D").format.columnWidth = 16;
models.getRange("B5:B7").format.numberFormat = "0.000";
models.getRange("C5:D7").format.numberFormat = "0.00";
models.getRange("A10:B10").values = [["Feature", "Permutation Importance"]];
models.getRange(`A11:B${10 + payload.feature_importance.length}`).values = payload.feature_importance.map((row) => [row.feature, row.importance]);
styleTable(models, `A10:B${10 + payload.feature_importance.length}`, "A10:B10");
models.getRange("A:A").format.columnWidth = 27;
models.getRange(`B11:B${10 + payload.feature_importance.length}`).format.numberFormat = "0.000";
const importanceChart = models.charts.add("bar", models.getRange(`A10:B${10 + payload.feature_importance.length}`));
importanceChart.title = "Top Delivery-Time Drivers";
importanceChart.hasLegend = false;
importanceChart.yAxis = { numberFormatCode: "0.00" };
importanceChart.setPosition("D10", "K25");

for (const sheet of [dashboard, areas, attention, stats, models]) sheet.getUsedRange().format.font.name = "Aptos";

const previews = [
  ["Executive Dashboard", "ops_dashboard_preview.png"],
  ["Hyderabad Areas", "area_performance_preview.png"],
  ["Restaurant Attention", "restaurant_attention_preview.png"],
  ["Statistical Tests", "statistics_preview.png"],
  ["Model Performance", "model_performance_preview.png"],
];
for (const [sheetName, fileName] of previews) {
  const image = await wb.render({ sheetName, autoCrop: "all", scale: 1.1, format: "png" });
  await fs.writeFile(new URL(fileName, outputDir), new Uint8Array(await image.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(wb);
const outputPath = fileURLToPath(new URL("QuickCommerce_Pulse_Ops_Report.xlsx", outputDir));
await xlsx.save(outputPath);
const errors = await wb.inspect({
  kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 }, summary: "formula error scan",
});
console.log(errors.ndjson);
await fs.rm(`${outputPath}.inspect.ndjson`, { force: true });
