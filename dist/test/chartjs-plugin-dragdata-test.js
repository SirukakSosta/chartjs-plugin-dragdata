/*!
 * chartjs-plugin-dragdata v2.3.1
 * https://github.com/artus9033/chartjs-plugin-dragdata.git
 * (c) 2018-2025 chartjs-plugin-dragdata contributors
 * Released under the MIT license
 */
import { Chart } from 'chart.js';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';
import { getRelativePosition } from 'chart.js/helpers';

function roundValue(value, pos) {
    if (pos === undefined || isNaN(pos) || pos < 0)
        return value;
    return Math.round(value * Math.pow(10, pos)) / Math.pow(10, pos);
}

/**
 * Clips a value between a minimum and maximum value.
 * @param value the value to be clipped
 * @param min the minimum value
 * @param max the maximum value
 * @returns value in range [min, max]
 */
function clipValue(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function calcRadialLinear(event, chartInstance, curIndex, rAxisID, state) {
    var _a, _b, _c;
    if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
    var _d = getRelativePosition(event, chartInstance), cursorX = _d.x, cursorY = _d.y;
    var rScale = chartInstance.scales[rAxisID];
    var axisAngleRad = rScale.getPointPositionForValue(
    // the radar chart has points draggable along primary axes that are aligned with
    // scales' lines; the polarArea chart, however, is draggable along lines placed in the center
    // between major lines, thus the +0.5 of index is added for the helper to calculate the angle
    // of this center guide line (the helper accept a continuous argument, in spite of the name "index")
    curIndex + ((state === null || state === void 0 ? void 0 : state.type) === "polarArea" ? 0.5 : 0), chartInstance.scales[rAxisID].max).angle;
    var xCenter = rScale.xCenter, yCenter = rScale.yCenter;
    // we calculate the dot product of the vector from center to cursor & the axis direction vector
    // center-to-cursor vector v
    var vx = cursorX - xCenter;
    var vy = cursorY - yCenter;
    // axis direction vector d
    var dx = Math.cos(axisAngleRad);
    var dy = Math.sin(axisAngleRad);
    // dot product of v & d
    var dotProduct = vx * dx + vy * dy;
    var d = 
    // if dot product <= 0, then the point is on the opposite side of the center than the direction of the axis
    dotProduct > 0
        ? // Euclidean distance between cursor & center
            Math.sqrt(Math.pow(cursorX - xCenter, 2) + Math.pow(cursorY - yCenter, 2))
        : 0;
    // calculate the value from distance
    var v = rScale.getValueForDistanceFromCenter(d);
    // apply rounding
    v = roundValue(v, (_c = (_b = (_a = chartInstance.config.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData) === null || _c === void 0 ? void 0 : _c.round);
    v = clipValue(v, chartInstance.scales[rAxisID].min, chartInstance.scales[rAxisID].max);
    return v;
}

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function cloneDataPoint(source) {
    if (Array.isArray(source))
        return __spreadArray([], source, true);
    else if (typeof source === "object")
        return __assign({}, source);
    // below: typeof source === "number"
    return source;
}

function calcCartesian(event, chartInstance, data, _a, state) {
    var _b, _c, _d, _e, _f;
    var xAxisDraggingDisabled = _a.xAxisDraggingDisabled, yAxisDraggingDisabled = _a.yAxisDraggingDisabled;
    if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
    if (!state)
        return data;
    var dataPoint = cloneDataPoint(data);
    var _g = getRelativePosition(event, chartInstance), cursorX = _g.x, cursorY = _g.y;
    var x = chartInstance.scales[state.xAxisID].getValueForPixel(cursorX);
    var y = chartInstance.scales[state.yAxisID].getValueForPixel(cursorY);
    var rounding = (_d = (_c = (_b = chartInstance.config.options) === null || _b === void 0 ? void 0 : _b.plugins) === null || _c === void 0 ? void 0 : _c.dragData) === null || _d === void 0 ? void 0 : _d.round;
    x = roundValue(x, rounding);
    y = roundValue(y, rounding);
    x = clipValue(x, chartInstance.scales[state.xAxisID].min, chartInstance.scales[state.xAxisID].max);
    y = clipValue(y, chartInstance.scales[state.yAxisID].min, chartInstance.scales[state.yAxisID].max);
    if (state.floatingBar) {
        // x contains the new value for one end of the floating bar
        // dataPoint contains the old interval [left, right] of the floating bar
        // calculate difference between the new value and both sides
        // the side with the smallest difference from the new value was the one that was dragged
        // return an interval with new value on the dragged side and old value on the other side
        var newVal = void 0;
        // choose the right variable based on the orientation of the graph (vertical, horizontal)
        if (((_e = chartInstance.config.options) === null || _e === void 0 ? void 0 : _e.indexAxis) === "y") {
            newVal = x;
        }
        else {
            newVal = y;
        }
        var diffFromLeft = Math.abs(newVal - dataPoint[0]);
        var diffFromRight = Math.abs(newVal - dataPoint[1]);
        if (diffFromLeft <= diffFromRight) {
            dataPoint[0] = newVal;
        }
        else {
            dataPoint[1] = newVal;
        }
        return dataPoint;
    }
    if (dataPoint.x !== undefined && !xAxisDraggingDisabled) {
        dataPoint.x = x;
    }
    if (dataPoint.y !== undefined) {
        if (!yAxisDraggingDisabled) {
            dataPoint.y = y;
        }
        return dataPoint;
    }
    else {
        if (((_f = chartInstance.config.options) === null || _f === void 0 ? void 0 : _f.indexAxis) === "y") {
            if (!xAxisDraggingDisabled) {
                return x;
            }
            else {
                return dataPoint;
            }
        }
        else {
            if (!yAxisDraggingDisabled) {
                return y;
            }
            else {
                return dataPoint;
            }
        }
    }
}

/**
 * Updates values to the nearest values
 * @param chartInstance the chart instance
 * @param datasetIndex the dataset index
 * @param index the data point index
 * @returns value after applying magnet or unchanged if not magnet is configured
 */
function applyMagnet(chartInstance, datasetIndex, index) {
    var _a, _b;
    var pluginOptions = (_b = (_a = chartInstance.config.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData;
    if (pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.magnet) {
        var magnet = pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.magnet;
        if (typeof magnet.to === "function") {
            var data = chartInstance.data.datasets[datasetIndex].data[index];
            data = magnet.to(data);
            chartInstance.data.datasets[datasetIndex].data[index] = data;
            chartInstance.update("none");
            return data;
        }
        return null;
    }
    else {
        return chartInstance.data.datasets[datasetIndex].data[index];
    }
}

function checkDraggingConfiguration(chartInstance, datasetIndex, dataPointIndex, state) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
    if (!state)
        return {
            chartDraggingDisabled: true,
            datasetDraggingDisabled: true,
            xAxisDraggingDisabled: true,
            yAxisDraggingDisabled: true,
            dataPointDraggingDisabled: true,
        };
    var dataset = chartInstance.data.datasets[datasetIndex];
    /** per-chart option */
    var chartDraggingDisabled = ((_b = (_a = chartInstance.config.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData) === false;
    /** per-dataset option */
    var datasetDraggingDisabled = chartDraggingDisabled || dataset.dragData === false;
    /** x-axis option (per-axis); dragging on the x-axis is disabled by default */
    var _xAxisDraggingPerAxisOptionValue = (_e = (_d = (_c = chartInstance.config.options) === null || _c === void 0 ? void 0 : _c.scales) === null || _d === void 0 ? void 0 : _d[state.xAxisID]) === null || _e === void 0 ? void 0 : _e.dragData;
    /** x-axis option (per-axis); dragging on the x-axis is disabled by default */
    var xAxisDraggingDisabled = true;
    if (!datasetDraggingDisabled &&
        (_xAxisDraggingPerAxisOptionValue === true || // finally, dragging can be enabled on the x-axis by the plugin options,
            // unless it's explicitly disabled in x-axis options
            (((_h = (_g = (_f = chartInstance.config.options) === null || _f === void 0 ? void 0 : _f.plugins) === null || _g === void 0 ? void 0 : _g.dragData) === null || _h === void 0 ? void 0 : _h.dragX) === true &&
                _xAxisDraggingPerAxisOptionValue !== false))) {
        xAxisDraggingDisabled = false;
    }
    /** y-axis option (per-axis); dragging on the y-axis is enabled by default */
    var yAxisDraggingDisabled = datasetDraggingDisabled ||
        ((_l = (_k = (_j = chartInstance.config.options) === null || _j === void 0 ? void 0 : _j.plugins) === null || _k === void 0 ? void 0 : _k.dragData) === null || _l === void 0 ? void 0 : _l.dragY) === false ||
        ((_p = (_o = (_m = chartInstance.config.options) === null || _m === void 0 ? void 0 : _m.scales) === null || _o === void 0 ? void 0 : _o[state.yAxisID]) === null || _p === void 0 ? void 0 : _p.dragData) === false;
    /** per-data-point option */
    var dataPointDraggingDisabled = datasetDraggingDisabled ||
        ((_q = dataset.data[dataPointIndex]) === null || _q === void 0 ? void 0 : _q.dragData) ===
            false;
    return {
        chartDraggingDisabled: chartDraggingDisabled,
        datasetDraggingDisabled: datasetDraggingDisabled,
        xAxisDraggingDisabled: xAxisDraggingDisabled,
        yAxisDraggingDisabled: yAxisDraggingDisabled,
        dataPointDraggingDisabled: dataPointDraggingDisabled,
    };
}

function dragEndCallback(event, chartInstance, state) {
    var _a, _b, _c, _d, _e;
    if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
    if (!state)
        return;
    var callback = (_c = (_b = (_a = chartInstance.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData) === null || _c === void 0 ? void 0 : _c.onDragEnd;
    state.curIndex = undefined;
    state.isDragging = false;
    // re-enable the tooltip animation
    if ((_e = (_d = chartInstance.config.options) === null || _d === void 0 ? void 0 : _d.plugins) === null || _e === void 0 ? void 0 : _e.tooltip) {
        chartInstance.config.options.plugins.tooltip.animation =
            state.eventSettings;
        chartInstance.update("none");
    }
    if (typeof callback === "function" && state.element) {
        var datasetIndex = state.element.datasetIndex;
        var index = state.element.index;
        var value = applyMagnet(chartInstance, datasetIndex, index);
        return callback(event, datasetIndex, index, value);
    }
}

function getElement(event, chartInstance, state) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
    var _z, _0, _1;
    if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
    var callback = (_c = (_b = (_a = chartInstance.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData) === null || _c === void 0 ? void 0 : _c.onDragStart;
    if (!state)
        return;
    var searchMode = (_f = (_e = (_d = chartInstance.config.options) === null || _d === void 0 ? void 0 : _d.interaction) === null || _e === void 0 ? void 0 : _e.mode) !== null && _f !== void 0 ? _f : "nearest", searchOptions = (_h = (_g = chartInstance.config.options) === null || _g === void 0 ? void 0 : _g.interaction) !== null && _h !== void 0 ? _h : {
        intersect: true,
    };
    state.element = chartInstance.getElementsAtEventForMode(event, searchMode, searchOptions, false)[0];
    if (state.element) {
        var datasetIndex = state.element.datasetIndex;
        var index = state.element.index;
        // note: type may be absent if config is ChartConfigurationCustomTypesPerDataset, in which case we pull this value from the dataset
        state.type =
            (_k = (_j = chartInstance.config.type) !== null && _j !== void 0 ? _j : chartInstance.data.datasets[datasetIndex].type) !== null && _k !== void 0 ? _k : undefined;
        // save element settings
        state.eventSettings =
            (_o = (_m = (_l = chartInstance.config.options) === null || _l === void 0 ? void 0 : _l.plugins) === null || _m === void 0 ? void 0 : _m.tooltip) === null || _o === void 0 ? void 0 : _o.animation;
        var dataset = chartInstance.data.datasets[datasetIndex];
        var datasetMeta = chartInstance.getDatasetMeta(datasetIndex);
        var curValue = dataset.data[index];
        // get the id of the datasets scale
        state.xAxisID = datasetMeta.xAxisID;
        state.yAxisID = datasetMeta.yAxisID;
        state.rAxisID = datasetMeta.rAxisID;
        var draggingConfiguration = checkDraggingConfiguration(chartInstance, datasetIndex, index), datasetDraggingDisabled = draggingConfiguration.datasetDraggingDisabled, xAxisDraggingDisabled = draggingConfiguration.xAxisDraggingDisabled, yAxisDraggingDisabled = draggingConfiguration.yAxisDraggingDisabled, dataPointDraggingDisabled = draggingConfiguration.dataPointDraggingDisabled;
        // check if dragging the dataset or datapoint is prohibited
        if (datasetDraggingDisabled ||
            // dragging disabled on all scales
            (xAxisDraggingDisabled && yAxisDraggingDisabled) ||
            dataPointDraggingDisabled) {
            state.element = null;
            return;
        }
        if (state.type === "bar") {
            // note: stacked may be missing in RadialLinearScaleOptions
            state.stacked =
                (_s = (_r = (_q = (_p = chartInstance.config.options) === null || _p === void 0 ? void 0 : _p.scales) === null || _q === void 0 ? void 0 : _q[state.xAxisID]) === null || _r === void 0 ? void 0 : _r.stacked) !== null && _s !== void 0 ? _s : undefined;
            // if a bar has a data point that is an array of length 2, it's a floating bar
            var samplePoint = chartInstance.data.datasets[0].data[0];
            state.floatingBar =
                samplePoint !== null &&
                    Array.isArray(samplePoint) &&
                    samplePoint.length >= 2;
            var dataPoint = chartInstance.data.datasets[datasetIndex].data[index];
            var newPos = calcCartesian(event, chartInstance, dataPoint, draggingConfiguration, state);
            state.initValue = newPos - curValue;
        }
        // disable the tooltip animation
        var showTooltipOptionValue = (_v = (_u = (_t = chartInstance.config.options) === null || _t === void 0 ? void 0 : _t.plugins) === null || _u === void 0 ? void 0 : _u.dragData) === null || _v === void 0 ? void 0 : _v.showTooltip;
        if (showTooltipOptionValue === undefined ||
            showTooltipOptionValue === true) {
            (_w = (_z = chartInstance.config).options) !== null && _w !== void 0 ? _w : (_z.options = {});
            (_x = (_0 = chartInstance.config.options).plugins) !== null && _x !== void 0 ? _x : (_0.plugins = {});
            (_y = (_1 = chartInstance.config.options.plugins).tooltip) !== null && _y !== void 0 ? _y : (_1.tooltip = {});
            chartInstance.config.options.plugins.tooltip.animation = false;
        }
        if (typeof callback === "function" && state.element) {
            if (callback(event, datasetIndex, index, curValue) === false) {
                state.element = null;
            }
        }
    }
}

function updateData(event, chartInstance, state) {
    var _a, _b, _c, _d;
    if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
    if (!state)
        return;
    var pluginOptions = (_b = (_a = chartInstance.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData;
    var callback = pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.onDrag;
    if (state.element) {
        state.curDatasetIndex = state.element.datasetIndex;
        state.curIndex = state.element.index;
        state.isDragging = true;
        var dataPoint = chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex];
        var draggingConfiguration = checkDraggingConfiguration(chartInstance, state.curDatasetIndex, state.curIndex);
        if (state.type === "radar" || state.type === "polarArea") {
            dataPoint = calcRadialLinear(event, chartInstance, state.curIndex, state.rAxisID, state);
        }
        else if (state.stacked) {
            var cursorPos = calcCartesian(event, chartInstance, dataPoint, draggingConfiguration, state);
            dataPoint = roundValue(cursorPos, pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.round);
        }
        else {
            dataPoint = calcCartesian(event, chartInstance, dataPoint, draggingConfiguration, state);
        }
        // Collision detection logic
        var newFrom_1 = Array.isArray(dataPoint)
            ? dataPoint[0]
            : dataPoint;
        var newTo_1 = Array.isArray(dataPoint)
            ? dataPoint[1]
            : dataPoint;
        var isOverlapping_1 = false;
        chartInstance.data.datasets.forEach(function (ds, dsIndex) {
            if (dsIndex === state.curDatasetIndex)
                return;
            var val = ds.data[state.curIndex];
            if (!val || !Array.isArray(val))
                return;
            var existingFrom = val[0], existingTo = val[1];
            var overlaps = (newFrom_1 < existingTo && newTo_1 > existingFrom) ||
                (newFrom_1 >= existingFrom && newFrom_1 < existingTo) ||
                (newTo_1 > existingFrom && newTo_1 <= existingTo);
            if (overlaps) {
                isOverlapping_1 = true;
            }
        });
        if (isOverlapping_1) {
            // Revert to original value
            var original = (_c = state.originalValue) !== null && _c !== void 0 ? _c : chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex];
            chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex] =
                original;
            chartInstance.update("none");
            if ((_d = event.target) === null || _d === void 0 ? void 0 : _d.style) {
                event.target.style.cursor = "not-allowed";
            }
            return;
        }
        if (typeof callback === "function"
            ? callback(event, state.curDatasetIndex, state.curIndex, dataPoint) !==
                false
            : true) {
            chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex] =
                dataPoint;
            chartInstance.update("none");
        }
    }
}

var ChartJSDragDataPlugin = {
    id: "dragdata",
    statesStore: new Map(),
    afterInit: function (chartInstance) {
        var state = {
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
        select(chartInstance.canvas).call(drag()
            .container(chartInstance.canvas)
            .on("start", function (e) {
            return getElement(e.sourceEvent, chartInstance, state);
        })
            .on("drag", function (e) { return updateData(e.sourceEvent, chartInstance, state); })
            .on("end", function (e) {
            return dragEndCallback(e.sourceEvent, chartInstance, state);
        }));
    },
    beforeEvent: function (chartInstance) {
        var _a;
        var state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id);
        if (state === null || state === void 0 ? void 0 : state.isDragging) {
            (_a = chartInstance.tooltip) === null || _a === void 0 ? void 0 : _a.update();
            return false;
        }
    },
    afterDestroy: function (chartInstance) {
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
};
// TODO: in a future major release, stop auto-registering the plugin and require users to manually register it
// see https://chartjs-plugin-datalabels.netlify.app/guide/getting-started.html#registration
Chart.register(ChartJSDragDataPlugin);

export { applyMagnet, calcCartesian, calcRadialLinear, checkDraggingConfiguration, clipValue, cloneDataPoint, ChartJSDragDataPlugin as default, dragEndCallback, getElement, roundValue, updateData };
