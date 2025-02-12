import type {AxisPointerComponentOption, ECharts, LineSeriesOption} from 'echarts';
import type ReactEchartsCore from 'echarts-for-react/lib/core';

export type SeriesDataUnit = {
  value: number;
  name: string | number; // number because we sometimes use timestamps
  onClick?: (series: Series, instance: ECharts) => void;
  itemStyle?: {
    color?: string;
  };
};

export type Series = {
  seriesName: string;
  data: SeriesDataUnit[];
  color?: string;
  areaStyle?: {
    color: string;
    opacity: number;
  };
  lineStyle?: AxisPointerComponentOption['lineStyle'];
  stack?: string; // https://echarts.apache.org/en/option.html#series-line.stack
  z?: number; // https://echarts.apache.org/en/option.html#series-line.z
  markLine?: LineSeriesOption['markLine'];
};

export type ReactEchartsRef = ReactEchartsCore & {
  getEchartsInstance: () => ECharts;
};

export type EChartEventHandler<P> = (params: P, instance: ECharts) => void;

export type EChartChartReadyHandler = (instance: ECharts) => void;

export type EChartHighlightHandler = EChartEventHandler<any>;

export type EChartMouseOverHandler = EChartEventHandler<any>;

export type EChartClickHandler = EChartEventHandler<any>;

export type EChartDataZoomHandler = EChartEventHandler<{
  type: 'datazoom';
  /**
   * percentage of zoom start position, 0 - 100
   */
  start: number;
  /**
   * percentage of zoom finish position, 0 - 100
   */
  end: number;
  /**
   * data value of zoom start position; only exists in zoom event of
   * triggered by toolbar
   */
  startValue?: number;
  /**
   * data value of zoom finish position; only exists in zoom event of
   * triggered by toolbar
   */
  endValue?: number;
}>;

export type EChartRestoreHandler = EChartEventHandler<{type: 'restore'}>;

export type EChartFinishedHandler = EChartEventHandler<{}>;

export type EChartRenderedHandler = EChartEventHandler<{}>;
