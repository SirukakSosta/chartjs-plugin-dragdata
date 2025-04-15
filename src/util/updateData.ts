import type { ChartType } from "chart.js";
import { Chart } from "chart.js";

import ChartJSDragDataPlugin from "../plugin";
import {
	DragDataEvent,
	DragDataState,
	OptionalPluginConfiguration,
} from "../types";
import { checkDraggingConfiguration } from "../util/checkDraggingConfiguration";
import { calcCartesian, calcRadialLinear } from "./calc";
import { roundValue } from "./roundValue";

export function updateData<TType extends ChartType>(
	event: DragDataEvent,
	chartInstance: Chart<TType>,
	state: DragDataState | undefined = ChartJSDragDataPlugin.statesStore.get(
		chartInstance.id,
	),
) {
	if (!state) return;

	const pluginOptions = chartInstance.options?.plugins
		?.dragData as OptionalPluginConfiguration<TType>;

	const callback = pluginOptions?.onDrag;

	if (state.element) {
		state.curDatasetIndex = state.element.datasetIndex;
		state.curIndex = state.element.index;
		state.isDragging = true;

		let dataPoint =
			chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex]!;

		const draggingConfiguration = checkDraggingConfiguration(
			chartInstance,
			state.curDatasetIndex,
			state.curIndex,
		);

		if (state.type === "radar" || state.type === "polarArea") {
			dataPoint = calcRadialLinear(
				event,
				chartInstance,
				state.curIndex,
				state.rAxisID,
				state,
			);
		} else if (state.stacked) {
			let cursorPos = calcCartesian(
				event,
				chartInstance,
				dataPoint,
				draggingConfiguration,
				state,
			);
			dataPoint = roundValue(cursorPos as number, pluginOptions?.round);
		} else {
			dataPoint = calcCartesian(
				event,
				chartInstance,
				dataPoint,
				draggingConfiguration,
				state,
			);
		}

		// Collision detection logic
		const newFrom = Array.isArray(dataPoint)
			? (dataPoint[0] as any)
			: (dataPoint as any);
		const newTo = Array.isArray(dataPoint)
			? (dataPoint[1] as any)
			: (dataPoint as any);

		let isOverlapping = false;

		chartInstance.data.datasets.forEach((ds, dsIndex) => {
			if (dsIndex === state.curDatasetIndex) return;

			const val = ds.data[state.curIndex as any];
			if (!val || !Array.isArray(val)) return;

			const [existingFrom, existingTo] = val;

			const overlaps =
				(newFrom < existingTo && newTo > existingFrom) ||
				(newFrom >= existingFrom && newFrom < existingTo) ||
				(newTo > existingFrom && newTo <= existingTo);

			if (overlaps) {
				isOverlapping = true;
			}
		});

		if (isOverlapping) {
			// Revert to original value
			const original =
				state.originalValue ??
				chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex];
			chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex] =
				original;
			chartInstance.update("none");

			if ((event as any).target?.style) {
				(event as any).target.style.cursor = "not-allowed";
			}
			return;
		}

		if (
			typeof callback === "function"
				? callback(event, state.curDatasetIndex, state.curIndex, dataPoint) !==
					false
				: true
		) {
			chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex] =
				dataPoint;
			chartInstance.update("none");
		}
	}
}
