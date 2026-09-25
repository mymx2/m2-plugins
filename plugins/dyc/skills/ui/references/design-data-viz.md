# Design Reference: Data Visualization

Load this only when the surface is a dashboard, analytics view, chart-heavy interface, or any number-dense data display. Marketing pages, landing pages, and generic component work do not need it.

## Dashboard defaults

Dashboards are utility surfaces: orient the user, show status, enable action. No hero sections, no marketing copy. Every element must earn its place by answering a question the user has.

- Primary layout: status summary at top, detail below; or sidebar filters + main chart area. The main question must be answerable without expansion; disclose supplementary records, not the answer itself. Check sparse and typical data without padding gaps with filler.
- Whitespace: tighter than marketing pages; users scan, not read. Use generous column spacing, not generous row height.
- Number density: many numbers on screen at once is not a problem. Crowding without alignment is. Use `font-variant-numeric: tabular-nums` for all numeric columns. Right-align numbers. Left-align labels.

## Chart selection

| Use case                           | Chart type                                                      |
| ---------------------------------- | --------------------------------------------------------------- |
| Comparing values across categories | Bar chart (horizontal if labels are long)                       |
| Trend over time                    | Line chart; avoid bars for time series with many points         |
| Part-whole relationships           | Treemap (5+ segments) or stacked bar; pie only for 2-4 segments |
| Distribution                       | Histogram or box plot; never pie chart                          |
| Correlation                        | Scatter plot; do not use line chart                             |

Pie charts with more than 4 segments communicate nothing. Use a treemap or ranked list instead.

## Selection red lines

- **No 3D charts, ever**: 3D bars and pies distort the data's visual proportions in every scenario.
- **Dual Y-axes only when both series share the same time axis and a direct relationship**; in every other case split into two charts. Forcing a dual axis invents a correlation the data does not claim.
- **More than 4 segments never renders as pie**: switch to treemap or a sorted bar. Do not accept "pie will do."
- **A histogram never becomes a line chart**: connecting distribution bins as a line misreads as a trend over time. The reverse (trend as histogram) loses the time dimension.
- **A single headline number is a KPI card, not a gauge or pie**: value plus comparison context plus an optional sparkline. Gauges only for true attainment-against-capacity metrics.
- **Never encode series by color alone**: pair color with pattern, shape, or direct labels. Color-only encoding fails color-vision deficiency and grayscale printing.
- **Multi-series line charts cap at 4 lines**; beyond that, small-multiple the chart or aggregate. A spaghetti chart communicates nothing.
- **On mobile, complex charts never scale down proportionally**: 5+ series lines, 5+ segment pies, and dual-axis charts must swap chart type (grouped bar to stacked bar, pie to horizontal bar) or degrade to a table.

## Number-dense interfaces

- Right-align all numbers; left-align all text labels. Mixed alignment in the same column is always wrong.
- Subtle row separators: `1px` line at `rgba(0,0,0,0.06)` (light) or `rgba(255,255,255,0.05)` (dark). Alternating row backgrounds only if the table is very wide (12+ columns).
- Column spacing: at least `16px` between adjacent columns; more between logically distinct groups.

## Using a product as a benchmark

When the user references a product for visual benchmark ("make it feel like Grafana" / "similar to Linear analytics"): extract 3-5 concrete data-visualization-specific properties from that product, not general aesthetic properties. Useful properties: chart color palette (exact values), grid line weight and opacity, axis label size and color, tooltip border-radius and shadow, empty-state treatment. Do not extract "minimal" or "clean" as properties; those are not actionable.
