import type { Chart, ChartType } from "chart.js";
import { DragDataEvent, DragDataState } from "../../types";
export declare function calcRadialLinear<TType extends ChartType>(event: DragDataEvent, chartInstance: Chart<TType>, curIndex: number, rAxisID: string, state?: DragDataState | undefined): number;
