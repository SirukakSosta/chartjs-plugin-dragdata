import type { ChartType } from "chart.js";
import { Chart } from "chart.js";
import { DragDataState } from "../types";
import { DraggingConfiguration } from "../types/DraggingConfiguration";
export declare function checkDraggingConfiguration<TType extends ChartType>(chartInstance: Chart<TType>, datasetIndex: number, dataPointIndex: number, state?: DragDataState | undefined): DraggingConfiguration;
