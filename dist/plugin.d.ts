import { Chart } from "chart.js";
import { DragDataState } from "./types";
declare const ChartJSDragDataPlugin: {
    readonly id: "dragdata";
    readonly statesStore: Map<string, DragDataState>;
    readonly afterInit: (chartInstance: Chart<keyof import("chart.js").ChartTypeRegistry, (number | [number, number] | import("chart.js").Point | import("chart.js").BubbleDataPoint | null)[], unknown>) => void;
    readonly beforeEvent: (chartInstance: Chart<keyof import("chart.js").ChartTypeRegistry, (number | [number, number] | import("chart.js").Point | import("chart.js").BubbleDataPoint | null)[], unknown>) => false | undefined;
    readonly afterDestroy: (chartInstance: Chart<keyof import("chart.js").ChartTypeRegistry, (number | [number, number] | import("chart.js").Point | import("chart.js").BubbleDataPoint | null)[], unknown>) => void;
};
export default ChartJSDragDataPlugin;
