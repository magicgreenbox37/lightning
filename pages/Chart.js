import React, { Component } from "react";
import styles from "../styles/Chart.module.css";
class Chart extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.addScriptTag();
  }
  addScriptTag = () => {
    let script = document.createElement("script");
    script.src = "chart.js"; // d3 code separately
    document.head.appendChild(script);
  };
  processLabel(label) {
    switch (label) {
      case "0:data-loss-protect":
        return label + "(known/required)";
      case "1:data-loss-protect":
        return label + "(known/not required)";
      default:
        return label;
    }
  }
  render() {
    let widthTotal = 850,
      heightTotal = 600;
    if (typeof window !== "undefined") {
      // needs no ssr
      widthTotal = window.innerWidth + "";
      heightTotal = window.innerHeight + "";
    }
    return (
      <>
        <svg width={widthTotal} height={heightTotal}></svg>
        <h1>Lightning Node Features</h1>
        <div className={styles.legend}>
          <strong>Legend</strong>
          <div className={styles.legenditem}>
            <div className={styles.symbol}>REF</div>
            <div>code: description</div>
          </div>
          <hr />
          <div className={styles.legenditem}>
            <div className={styles.symbol}>#</div>
            <div>number of nodes</div>
          </div>
          {this.props.legend &&
            Object.keys(this.props.legend).map((l) => (
              <div className={styles.legenditem} key={"lgd_" + l}>
                <div className={styles.symbol}>{this.props.legend[l]}</div>
                <div>{this.processLabel(l)}</div>
              </div>
            ))}
          <hr />
          <div className={styles.extra}>
            <strong>Extra:</strong> select a reference and use ctrl-F to find
            them on the map
          </div>
        </div>
      </>
    );
  }
}
export default Chart;
