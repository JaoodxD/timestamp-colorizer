'use strict';

/**
 * @typedef {number} TimeInterval time interval in seconds
 * @typedef {[number, number, number]} Color rgb color [red, green, blue]
 * @typedef {number} NormalizedNumber float number in 0..1 range
 * @typedef {[Color, NormalizedNumber]} ColorPoint point to represent color on gradient
 * @typedef {ColorPoint[]} GradientConfig Array of color points which represent linear gradient
 */

const config = require('./config.json');


const defaultGradientConfig = config.gradientConfig;
const intervals = config.intervals;
/**
 * @type {TimeInterval[]}
 */
const defaultSeconds = Object.values(intervals).flat();

/**
 * 
 * @param {TimeInterval[]} seconds 
 * @param {GradientConfig} gradientConfig 
 * @returns 
 */
module.exports = (seconds = defaultSeconds, gradientConfig = defaultGradientConfig) => {
    const getBoundaries = (sec) => {
        const higherIndex = seconds.findIndex((x) => x >= sec);
        const lowerIndex = Math.max(0, higherIndex - 1);
        return [seconds[lowerIndex], seconds[higherIndex]];
    };

    const min = () => Math.min(...seconds);
    const max = () => Math.max(...seconds);
    const justify = (n) => n > max() ? max() : n < min() ? min() : ~~n;

    const distribution = seconds.reduce((acc, n, i, arr) =>
        acc.set(n, i / (arr.length - 1)),
        new Map());

    const f = (x) => distribution.get(x);

    const linearInterpolation = (f, x0, x1) => (x) =>
    (
        f(x0) +
        (
            (f(x1) - f(x0))
            /
            (x1 - x0)
        )
        * (x - x0)
    );

    const createGradient = (colors) => (x) => {
        const color = [...colors].sort(([, x0], [, x1]) => x0 - x1);
        const getColor = (rgb, x) => {
            if (!/^[rgb]$/.test(rgb)) throw Error('Invalid color argument');
            const channel = ['r', 'g', 'b'].indexOf(rgb);
            const f = (x) => (color.find(([, x0]) => x === x0)?.[0] ?? color[0][0])[channel];

            const higherIndex = color.findIndex(([, x0]) => x0 >= x);
            const lowerIndex = Math.max(higherIndex - 1, 0);

            return linearInterpolation(f, color[lowerIndex][1], color[higherIndex][1])(x);

        };
        return [getColor('r', x), getColor('g', x), getColor('b', x)];
    };

    const rgbToHexColor = (rgb = []) => rgb.reduce(
        (color, channel) =>
            color + (~~channel).toString(16)
                .padStart(2, '0'),
        "#");

    /**
     * 
     * @param {number} secs time interval in seconds
     * @returns {String} hex color
     */
    const getTimestampColor = (secs) => {
        const x = justify(secs);

        const [low, high] = getBoundaries(x);
        let normalizedValue = linearInterpolation(f, low, high)(x);

        const getColor = createGradient(gradientConfig);

        const color = getColor(normalizedValue);
        const hexColor = rgbToHexColor(color);
        return hexColor;
    };

    return getTimestampColor;
};
