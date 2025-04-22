import { Chart, ChartType } from "chart.js";
import { ChartDataItemType } from "../types";
/**
 * Updates values to the nearest values
 * @param chartInstance the chart instance
 * @param datasetIndex the dataset index
 * @param index the data point index
 * @returns value after applying magnet or unchanged if not magnet is configured
 */
export declare function applyMagnet<TType extends ChartType>(chartInstance: Chart<TType>, datasetIndex: number, index: number): ChartDataItemType<TType>;
