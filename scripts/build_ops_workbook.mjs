import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = new URL("../", import.meta.url);
const payload = JSON.parse(
  await fs.readFile(new URL("dashboard/public/data/pulse_data.json", root), "utf8"),
);
const outputDir = new URL("excel/", root);
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const dashboard = workbook.worksheets.add("Ops Dashboard");
const areas = workbook.worksheets.add("Area Performance");
const risks = workbook.worksheets.add("Restaurant Risk");
const stats = workbook.worksheets.add("Statistics");
const models = workbook.worksheets.add("Model Performance");

const colors = {
  navy: "#102A43",
  blue: "#1677FF",
  cyan: "#12B8B0",
  coral: "#F97360",
  amber: "#F6B73C",
  green: "#25A18E",
  red: "#D64545",
  surface: "#F4F7FA",
  paleBlue: "#EAF2FF",
  paleCoral: "#FFF0ED",
  border: "#D9E2EC",
  text: "#243B53",
  muted: "#627D98",
  white: "#FFFFFF",
};

function titleBand(sheet, range, title, subtitle) {
  sheet.showGridLines = false;
  sheet.mergeCells(range);
  const titleRange = sheet.getRange(range);
  titleRange.values = [[title]];
  titleRange.format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white, size: 20 },
    verticalAlignment: "center",
  };
  const startCell = range.split(":")[0];
  const row = Number(startCell.match(/\d+/)[0]);
  sheet.getRange(`A${row + 1}:N${row + 1}`).merge();
  sheet.getRange(`A${row + 1}`).values = [[subtitle]];
  sheet.getRange(`A${row + 1}:N${row + 1}`).format = {
    fill: colors.navy,
    font: { color: "#B8CDE0", italic: true, size: 10 },
  };
}

function writeCard(sheet, range, label, value, fill) {
  const [start, end] = range.split(":");
  sheet.mergeCells(range);
  const card = sheet.getRange(range);
  card.values = [[`${label}\n${value}`]];
  card.format = {
    fill,
    font: { color: colors.navy, bold: true, size: 14 },
    wrapText: true,
    verticalAlignment: "center",
    horizontalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.border },
  };
  const rowStart = Number(start.match(/\d+/)[0]);
  const rowEnd = Number(end.match(/\d+/)[0]);
  sheet.getRange(`${start.replace(/\d+/, "")}${rowStart}:${end.replace(/\d+/, "")}${rowEnd}`).format.rowHeight = 26;
}

function styleTable(sheet, range, headerRange) {
  sheet.getRange(range).format = {
    font: { color: colors.text, size: 10 },
    borders: { preset: "all", style: "thin", color: "#E7EDF3" },
  };
  sheet.getRange(headerRange).format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white, size: 10 },
    wrapText: true,
    verticalAlignment: "center",
  };
}

titleBand(
  dashboard,
  "A1:N2",
  "QuickCommerce Pulse | Hyderabad Operations",
  "Delivery intelligence, restaurant risk, event impact, and predictive model performance",
);
dashboard.getRange("A1:N1").format.rowHeight = 32;
dashboard.getRange("A2:N2").format.rowHeight = 21;
writeCard(dashboard, "A4:C6", "TOTAL ORDERS", payload.kpis.total_orders.toLocaleString("en-IN"), colors.paleBlue);
writeCard(dashboard, "D4:F6", "AVG DELIVERY", `${payload.kpis.avg_delivery_time_min.toFixed(1)} min`, "#E9F8F6");
writeCard(dashboard, "G4:I6", "ON-TIME RATE", `${payload.kpis.on_time_rate_pct.toFixed(1)}%`, "#FFF7DF");
writeCard(dashboard, "J4:L6", "AVG DELAY", `${payload.kpis.avg_delay_min.toFixed(1)} min`, colors.paleCoral);
writeCard(dashboard, "M4:N6", "MODEL R²", payload.model_metrics[0].r2.toFixed(3), "#EEEAFE");

dashboard.mergeCells("A8:N10");
dashboard.getRange("A8").values = [[`EXECUTIVE PULSE\n${payload.executive_summary}`]];
dashboard.getRange("A8:N10").format = {
  fill: "#EAF2F8",
  font: { color: colors.text, size: 11 },
  wrapText: true,
  verticalAlignment: "center",
  borders: { preset: "outside", style: "thin", color: colors.border },
};

const areaChartRows = payload.area_metrics
  .slice()
  .sort((a, b) => b.avg_delivery_time_min - a.avg_delivery_time_min)
  .map((row) => [row.restaurant_area, row.avg_delivery_time_min, row.on_time_rate_pct]);
dashboard.getRange(`A13:C${13 + areaChartRows.length}`).values = [
  ["Locality", "Avg Delivery (min)", "On-time Rate (%)"],
  ...areaChartRows,
];
styleTable(dashboard, `A13:C${13 + areaChartRows.length}`, "A13:C13");
dashboard.getRange("A13:A23").format.columnWidth = 18;
dashboard.getRange("B13:C23").format.columnWidth = 16;
dashboard.getRange("B14:B23").format.numberFormat = "0.0";
dashboard.getRange("C14:C23").format.numberFormat = "0.0";

const areaChart = dashboard.charts.add("bar", dashboard.getRange(`A13:B${13 + areaChartRows.length}`));
areaChart.title = "Delivery Pressure by Locality";
areaChart.hasLegend = false;
areaChart.yAxis = { numberFormatCode: "0.0" };
areaChart.setPosition("E13", "N29");

dashboard.getRange("A31:D34").values = [
  ["Model", "R²", "MAE", "RMSE"],
  ...payload.model_metrics.map((row) => [row.model, row.r2, row.mae, row.rmse]),
];
styleTable(dashboard, "A31:D34", "A31:D31");
dashboard.getRange("A31:A34").format.columnWidth = 22;
dashboard.getRange("B32:B34").format.numberFormat = "0.000";
dashboard.getRange("C32:D34").format.numberFormat = "0.00";

dashboard.getRange("F31:I34").values = [
  ["Event Period", "Orders", "Avg Delivery", "On-time %"],
  ...payload.event_metrics.map((row) => [
    row.period_type, row.orders, row.avg_delivery_time_min, row.on_time_rate_pct,
  ]),
];
styleTable(dashboard, "F31:I34", "F31:I31");
dashboard.getRange("F31:F34").format.columnWidth = 18;
dashboard.getRange("G32:G34").format.numberFormat = "#,##0";
dashboard.getRange("H32:I34").format.numberFormat = "0.0";

titleBand(areas, "A1:H2", "Area Performance", "Operational KPIs by Hyderabad locality");
const rankedAreas = payload.area_metrics
  .slice()
  .sort((a, b) => b.avg_delivery_time_min - a.avg_delivery_time_min);
areas.getRange("A4:H4").values = [[
  "Locality", "Orders", "Avg Delivery", "P90 Delivery", "On-time %",
  "Avg Delay", "Avg Order Value", "Pressure Rank",
]];
areas.getRange(`A5:H${4 + rankedAreas.length}`).values = rankedAreas.map((row, index) => [
  row.restaurant_area, row.orders, row.avg_delivery_time_min, row.p90_delivery_time_min,
  row.on_time_rate_pct, row.avg_delay_min, row.avg_order_value, index + 1,
]);
styleTable(areas, `A4:H${4 + rankedAreas.length}`, "A4:H4");
areas.tables.add(`A4:H${4 + rankedAreas.length}`, true, "AreaPerformanceTable").style = "TableStyleMedium2";
areas.freezePanes.freezeRows(4);
areas.getRange("A:A").format.columnWidth = 20;
areas.getRange("B:H").format.columnWidth = 15;
areas.getRange("B5:B14").format.numberFormat = "#,##0";
areas.getRange("C5:G14").format.numberFormat = "0.0";
areas.getRange("G5:G14").format.numberFormat = "₹#,##0";
areas.getRange(`C5:C${4 + rankedAreas.length}`).conditionalFormats.add("colorScale", {
  colors: ["#DDF5EA", "#FFF2C7", "#F7C6C6"],
  thresholds: ["min", "50%", "max"],
});

titleBand(risks, "A1:K2", "Restaurant Risk Board", "Composite score: volume decline, rating movement, delay, and reliability");
risks.getRange("A4:K4").values = [[
  "Restaurant", "Area", "Cuisine", "Recent Orders", "Order Growth %",
  "Recent Rating", "Rating Change", "Avg Delay", "On-time %", "Risk Score", "Tier",
]];
risks.getRange(`A5:K${4 + payload.restaurant_risk.length}`).values = payload.restaurant_risk.map((row) => [
  row.name, row.area, row.cuisine_type, row.recent_orders, row.order_growth_pct,
  row.recent_rating, row.rating_change, row.recent_delay, row.recent_on_time * 100,
  row.risk_score, row.risk_tier,
]);
styleTable(risks, `A4:K${4 + payload.restaurant_risk.length}`, "A4:K4");
risks.tables.add(`A4:K${4 + payload.restaurant_risk.length}`, true, "RestaurantRiskTable").style = "TableStyleMedium2";
risks.freezePanes.freezeRows(4);
risks.getRange("A:A").format.columnWidth = 26;
risks.getRange("B:C").format.columnWidth = 17;
risks.getRange("D:K").format.columnWidth = 14;
risks.getRange("E5:J34").format.numberFormat = "0.0";
risks.getRange(`J5:J${4 + payload.restaurant_risk.length}`).conditionalFormats.add("colorScale", {
  colors: ["#DDF5EA", "#FFF2C7", "#F7C6C6"],
  thresholds: ["min", "50%", "max"],
});
risks.getRange(`K5:K${4 + payload.restaurant_risk.length}`).conditionalFormats.add(
  "containsText",
  { text: "Critical", format: { fill: "#FDE2E2", font: { bold: true, color: colors.red } } },
);

titleBand(stats, "A1:F2", "Statistical Validation", "Hypothesis tests quantify whether operational effects are significant");
stats.getRange("A4:F4").values = [[
  "Question", "Method", "Statistic", "P-value", "Effect (min)", "Conclusion",
]];
stats.getRange(`A5:F${4 + payload.statistical_tests.length}`).values = payload.statistical_tests.map((row) => [
  row.test, row.method, row.statistic, row.p_value, row.effect_min, row.conclusion,
]);
styleTable(stats, `A4:F${4 + payload.statistical_tests.length}`, "A4:F4");
stats.getRange("A:A").format.columnWidth = 31;
stats.getRange("B:B").format.columnWidth = 25;
stats.getRange("C:F").format.columnWidth = 18;
stats.getRange("C5:E7").format.numberFormat = "0.0000";
stats.getRange("F5:F7").conditionalFormats.add(
  "containsText",
  { text: "Statistically significant", format: { fill: "#DDF5EA", font: { bold: true, color: "#167D67" } } },
);

titleBand(models, "A1:F2", "Predictive Model Performance", "Holdout evaluation and permutation feature importance");
models.getRange("A4:D4").values = [["Model", "R²", "MAE (min)", "RMSE (min)"]];
models.getRange(`A5:D${4 + payload.model_metrics.length}`).values = payload.model_metrics.map((row) => [
  row.model, row.r2, row.mae, row.rmse,
]);
styleTable(models, `A4:D${4 + payload.model_metrics.length}`, "A4:D4");
models.getRange("A:A").format.columnWidth = 24;
models.getRange("B:D").format.columnWidth = 16;
models.getRange("B5:B7").format.numberFormat = "0.000";
models.getRange("C5:D7").format.numberFormat = "0.00";

models.getRange("A10:B10").values = [["Feature", "Permutation Importance"]];
models.getRange(`A11:B${10 + payload.feature_importance.length}`).values = payload.feature_importance.map((row) => [
  row.feature, row.importance,
]);
styleTable(models, `A10:B${10 + payload.feature_importance.length}`, "A10:B10");
models.getRange("B11:B25").format.numberFormat = "0.000";
const featureChart = models.charts.add(
  "bar",
  models.getRange(`A10:B${10 + Math.min(10, payload.feature_importance.length)}`),
);
featureChart.title = "Top Drivers of Delivery Time";
featureChart.hasLegend = false;
featureChart.yAxis = { numberFormatCode: "0.00" };
featureChart.setPosition("D10", "K26");

for (const sheet of [dashboard, areas, risks, stats, models]) {
  sheet.getUsedRange().format.font.name = "Aptos";
}

const previewSheets = [
  ["Ops Dashboard", "ops_dashboard_preview.png"],
  ["Area Performance", "area_performance_preview.png"],
  ["Restaurant Risk", "restaurant_risk_preview.png"],
  ["Statistics", "statistics_preview.png"],
  ["Model Performance", "model_performance_preview.png"],
];
for (const [sheetName, fileName] of previewSheets) {
  const preview = await workbook.render({
    sheetName,
    autoCrop: "all",
    scale: 1.1,
    format: "png",
  });
  await fs.writeFile(
    new URL(fileName, outputDir),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const output = await SpreadsheetFile.exportXlsx(workbook);
const outputPath = fileURLToPath(new URL("QuickCommerce_Pulse_Ops_Report.xlsx", outputDir));
await output.save(outputPath);

const check = await workbook.inspect({
  kind: "table",
  range: "Ops Dashboard!A1:N36",
  include: "values,formulas",
  tableMaxRows: 36,
  tableMaxCols: 14,
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);
await fs.rm(`${outputPath}.inspect.ndjson`, { force: true });
