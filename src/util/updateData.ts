// src/util/updateData.ts
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
			dataPoint = roundValue(
				(cursorPos as number) - state.initValue,
				pluginOptions?.round,
			);
		} else {
			dataPoint = calcCartesian(
				event,
				chartInstance,
				dataPoint,
				draggingConfiguration,
				state,
			);
		}

		// ✅ Collision check for bubble charts in pixel space
		if (
			typeof dataPoint === "object" &&
			"x" in dataPoint &&
			"y" in dataPoint &&
			"r" in dataPoint
		) {
			const collided = checkBubbleCollisionPixelSpace(
				chartInstance as any,
				state.curDatasetIndex,
				state.curIndex,
				dataPoint as any,
			);

			if (collided) {
				console.warn("🚫 Bubble collision detected. Drag blocked.");
				return;
			}
		}

		const allowed =
			typeof callback === "function"
				? callback(event, state.curDatasetIndex, state.curIndex, dataPoint) !==
					false
				: true;

		if (allowed) {
			chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex] =
				dataPoint;
			chartInstance.update("none");
		}
	}
}

// ✅ Collision checker (pixel-based)
function checkBubbleCollisionPixelSpace(
	chart: Chart,
	datasetIndex: number,
	pointIndex: number,
	newDataPoint: { x: number; y: number; r: number },
): boolean {
	const xScale = chart.scales["x"];
	const yScale = chart.scales["y"];

	const newX = xScale.getPixelForValue(newDataPoint.x);
	const newY = yScale.getPixelForValue(newDataPoint.y);
	const newR = newDataPoint.r;
	const finalDataset = chart.data.datasets;

	return finalDataset.some((dataset, i) => {
		if (
			i === datasetIndex ||
			!chart.isDatasetVisible(i) ||
			dataset.type !== "bubble"
		)
			return false;

		const points = dataset.data as { x: number; y: number; r: number }[];
		return points.some((point) => {
			const px = xScale.getPixelForValue(point.x);
			const py = yScale.getPixelForValue(point.y);
			const pr = point.r;
			const dx = newX - px;
			const dy = newY - py;
			const dist = Math.sqrt(dx * dx + dy * dy);

			return dist < newR + pr;
		});
	});
}
