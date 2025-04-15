import { Chart, Plugin as ChartPlugin } from "chart.js";
import { drag } from "d3-drag";
import { select } from "d3-selection";

import { DragDataState } from "./types";
import * as util from "./util";

const ChartJSDragDataPlugin = {
	id: "dragdata",
	statesStore: new Map<Chart["id"], DragDataState>(),
	afterInit(chartInstance) {
		const state: DragDataState = {
			curIndex: undefined,
			curDatasetIndex: undefined,
			element: null,
			eventSettings: false,
			floatingBar: false,
			initValue: 0,
			xAxisID: "",
			yAxisID: "",
			rAxisID: "",
			stacked: false,
			type: undefined,
			isDragging: false,
		};

		ChartJSDragDataPlugin.statesStore.set(chartInstance.id, state);

		select(chartInstance.canvas).call(
			drag<HTMLCanvasElement, unknown>()
				.container(chartInstance.canvas)
				.on("start", (e) =>
					util.getElement(e.sourceEvent, chartInstance, state),
				)
				.on("drag", (e) => util.updateData(e.sourceEvent, chartInstance, state))
				.on("end", (e) =>
					util.dragEndCallback(e.sourceEvent, chartInstance, state),
				),
		);
	},
	beforeEvent(chartInstance) {
		const state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id);

		if (state?.isDragging) {
			(chartInstance.tooltip as any | undefined)?.update();

			return false;
		}
	},
	afterDestroy(chartInstance) {
		ChartJSDragDataPlugin.statesStore.delete(chartInstance.id);
	},
	// onDrag: (event, datasetIndex, index, value) => {
	// 	const chart = (event as any).chart;
	// 	const datasets = chart.data.datasets;
	// 	const currentDataset = datasets[datasetIndex];
	// 	const currentData = currentDataset.data[index];

	// 	// Check for collision with other datasets
	// 	const isColliding = datasets.some((dataset, i) => {
	// 		if (i === datasetIndex) return false;
	// 		const dataPoint = dataset.data[index];
	// 		// Implement your collision detection logic here
	// 		return checkOverlap(currentData, dataPoint);
	// 	});

	// 	if (isColliding && pluginOptions.revertOnCollision) {
	// 		// Revert to original value
	// 		currentDataset.data[index] = originalValue;
	// 		chart.update("none");
	// 		return false; // Prevent further processing
	// 	}

	// 	return true; // Allow the drag
	// },
} as const satisfies ChartPlugin & Record<string, any>;

// TODO: in a future major release, stop auto-registering the plugin and require users to manually register it
// see https://chartjs-plugin-datalabels.netlify.app/guide/getting-started.html#registration
Chart.register(ChartJSDragDataPlugin);

export default ChartJSDragDataPlugin;
