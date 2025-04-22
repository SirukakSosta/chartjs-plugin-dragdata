import type { Chart, ChartType } from "chart.js";
import { ChartDataItemType, DragDataEvent, DragDataState } from "../../types";
import { AxisDraggingConfiguration } from "../../types/DraggingConfiguration";
export declare function calcCartesian<TType extends ChartType>(event: DragDataEvent, chartInstance: Chart<TType>, data: NonNullable<ChartDataItemType<TType>>, { xAxisDraggingDisabled, yAxisDraggingDisabled }: AxisDraggingConfiguration, state?: DragDataState | undefined): NonNullable<ChartDataItemType<ChartType>>;
