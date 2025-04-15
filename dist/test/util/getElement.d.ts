import type { ChartType } from "chart.js";
import { Chart } from "chart.js";
import { DragDataEvent, DragDataState } from "../types";
export declare function getElement<TType extends ChartType>(event: DragDataEvent, chartInstance: Chart<TType>, state?: DragDataState | undefined): void;
