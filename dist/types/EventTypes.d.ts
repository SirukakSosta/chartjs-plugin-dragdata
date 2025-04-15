import type { ChartType } from "chart.js";
import type { ChartDataItemType } from "./ChartJSTypes";
export type DragDataEvent = MouseEvent | TouchEvent;
export type DragEventCallback<TType extends ChartType> = (
/** the interaction event */
event: DragDataEvent, 
/** the index of the dataset containing the dragged point */
datasetIndex: number, 
/** the index of the dragged point in its parent dataset */
index: number, 
/** the current value of the data point */
value: ChartDataItemType<TType>) => boolean | void;
