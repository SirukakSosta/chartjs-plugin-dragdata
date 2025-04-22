import type { ChartType } from "chart.js";
import { ChartDataItemType } from "../types";
export declare function cloneDataPoint<TType extends ChartType, T = ChartDataItemType<TType>>(source: T): T;
