import Head from "next/head";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
// disabling ssr to allow client to access window dimensions with next
const NoSSRChart = dynamic(() => import("./Chart"), {
  ssr: false,
});

export default function Home() {
  const [legend, setLegend] = useState({});
  useEffect(() => {
    fetch("api/legend")
      .then((res) => res.json())
      .then((res) => {
        setLegend(res);
      });
  }, []); // called only once on start
  return (
    <div>
      <Head>
        <title>Lightning Map</title>
        <link rel="icon" href="/favicon.ico" />
        <script src="d3.v4.min.js"></script>
      </Head>
      <div id="chart">
        <NoSSRChart legend={legend} />
      </div>
    </div>
  );
}
