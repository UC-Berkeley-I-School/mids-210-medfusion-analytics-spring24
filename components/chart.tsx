import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as Plot from '@observablehq/plot';
import { InferenceDatum, categoryToName } from '@/data/classification-map';
import styles from './chart.module.css';

const Chart: React.FC<{ data: InferenceDatum[]; type: 'probability' | 'odds_ratio' }> = ({
  data,
  type = 'probability',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (data === undefined) return;
    const format = d3.format('.1%');

    const plot = Plot.plot({
      x: { axis: 'top', percent: true, grid: true, label: 'Probability (%)', nice: true },
      y: {
        label: null,
        tickFormat: (d: string) => categoryToName[d],
        tickSize: 0,
      },
      marginLeft: 120,
      marginRight: 20,
      width: containerRef.current?.clientWidth,
      style: {},
      color: {
        type: 'categorical',
        scheme: 'Tableau10',
      },
      marks: [
        Plot.barX(data, {
          x: type,
          y: 'label',
          fill: 'label',
          strokeWidth: 2,
          sort: { y: '-x' },
        }),
        Plot.text(data, {
          x: type,
          y: 'label',
          text: (d: InferenceDatum) => format(d[type]),
          textAnchor: 'start',
          dx: 3,
          filter: (d: InferenceDatum) => d.probability <= 0.01,
          fontSize: 12,
        }),
        Plot.text(data, {
          x: type,
          y: 'label',
          text: (d: InferenceDatum) => format(d[type]),
          textAnchor: 'end',
          dx: -3,
          filter: (d: InferenceDatum) => d[type] > 0.01,
          fill: 'white',
          fontSize: 12,
        }),
      ],
    });
    containerRef.current?.append(plot);
    return () => plot.remove();
  }, [data, containerRef.current?.clientWidth, type]);

  return (
    <>
      {type === 'probability' ? (
        <>
          <h4 className="text-center">Relative Probability of Predicted Finding</h4>
          <p className="text-center text-xs text-balance">
            This is the relative probability of the input predicting the given finding as compared to other findings.
          </p>
        </>
      ) : (
        <>
          <h4 className="text-center">Odds Ratio of Predicted Finding</h4>
          <p className="text-center text-xs text-balance">
            This is the odds ratio of the input predicting the given finding independent of other findings.
          </p>
        </>
      )}
      <div ref={containerRef} className={styles['y-axis-label']}></div>
    </>
  );
};

export default Chart;
