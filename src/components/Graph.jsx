import {inject, observer} from "mobx-react";
import {autorun} from "mobx";
import React from "react";
import PropTypes from "prop-types";

import {
  select,
  line,
  scaleLinear,
  easeQuad,
  transition,
} from "d3";

@inject('rootStore')
@observer
class Graph extends React.Component {
  static propTypes = {
    rootStore: PropTypes.object,
  };

  /**@return {RootStore}*/
  get rootStore() {
    return this.props.rootStore;
  }

  graphAutorun = null;
  componentDidMount() {
    const ctr = this.refChart.current;

    let width = null;
    const height = 30;

    const speedRoll = this.rootStore.client.speedRoll;

    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const svg = select(svgEl);

    let uploadLinePath = svg.append("path");
    let downloadLinePath = svg.append("path");

    const x = scaleLinear();
    const y = scaleLinear();

    const uploadLine = line().x(d => x(d.time)).y(d => y(d.upload));
    const downloadLine = line().x(d => x(d.time)).y(d => y(d.download));

    let minTime = speedRoll.minTime;
    this.graphAutorun = autorun(() => {
      if (!this.refChart.current) return;

      if (ctr.clientWidth !== width) {
        width = ctr.clientWidth;
        svgEl.setAttribute('width', width);
        svgEl.setAttribute('height', height);
        svgEl.setAttribute('viewBox', `0,0,${width},${height}`);
        y.range([height, 0]);
        x.range([0, width]);
      }

      y.domain([speedRoll.minSpeed, speedRoll.maxSpeed]);
      x.domain([speedRoll.minTime, speedRoll.maxTime]);

      if (minTime < Date.now() - 5 * 60 * 1000) {
        minTime = speedRoll.minTime;
      }

      const data = speedRoll.getDataFromTime(minTime);

      const t = transition().duration(500).ease(easeQuad);

      downloadLinePath.datum(data).transition(t).attr('d', downloadLine);
      uploadLinePath.datum(data).transition(t).attr('d', uploadLine);
    });

    downloadLinePath.attr("fill", "none")
      .attr("stroke", "#3687ED")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round");

    uploadLinePath.attr("fill", "none")
      .attr("stroke", "#41B541")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round");

    this.refChart.current.appendChild(svg.node());
  }

  componentWillUnmount() {
    this.graphAutorun();
    this.graphAutorun = null;
  }

  refChart = React.createRef();

  render() {
    return (
      <div ref={this.refChart}/>
    );
  }
}

export default Graph;