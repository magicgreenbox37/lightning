// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fs from "fs";
const fsPromises = require("fs").promises;
// source data
const graphData = JSON.parse(fs.readFileSync("data/lightning_graph.json") + "");

const cacheFile = "data/cache.json";
const legend = {
  // using static list to avoid changes
  "0:data-loss-protect": "Ж",
  "1:data-loss-protect": "ϕ",
  "5:upfront-shutdown-script": "ψ",
  "7:gossip-queries": "ϒ",
  "9:tlv-onion": "π",
  "13:static-remote-key": "Ђ",
  "15:payment-addr": "Є",
  "17:multi-path-payments": "ϖ",
  "1:data-loss-protect": "Ю",
  "11:unknown": "й",
  "12:static-remote-key": "щ",
  "14:payment-addr": "ђ",
  "19:wumbo-channels": "φ",
  "55:unknown": "љ",
  "23:unknown": "я",
  "3:initial-routing-sync": "џ",
  "21:anchor-commitments": "ђ",
  "103:unknown": "ѓ",
  "1339:unknown": "Ч",
  "51:unknown": "ς",
};
const limitByCount = true,
  limitByCountValue = 3,
  linkScale = 10000;

const getFeaturesSummary = function (f) {
  return Object.keys(f)
    .map((k) => legend[k] + " " + f[k]) // show icon and value
    .join(" ");
};
const getEdgesByColor = function (nodeColor, colors) {
  let edgesByColor = {}; // edges by color combo
  for (let t = 0; t < graphData.edges.length; t++) {
    let clr = nodeColor[graphData.edges[t]["node1_pub"]];
    let clr2 = nodeColor[graphData.edges[t]["node2_pub"]];
    if (colors[clr] && colors[clr2]) {
      // both groups are showing
      if (!edgesByColor[clr + "-" + clr2]) {
        edgesByColor[clr + "-" + clr2] = [
          parseInt(graphData.edges[t]["capacity"]),
        ];
      } else {
        edgesByColor[clr + "-" + clr2].push(
          parseInt(graphData.edges[t]["capacity"])
        );
      }
    }
  }
  return edgesByColor;
}
const sumEdges = function(edgesByColor){
  return Object.keys(edgesByColor).map((combo) => {
    let colors = combo.split("-");
    return {
      source: colors[0],
      target: colors[1],
      value: Math.floor(
        edgesByColor[combo].reduce(function (a, b) {
          return a + b;
        }, 0) / linkScale
      ),
    };
  });
}
const compileColorGroups = function () {
  let colorGroups = {};
  let nodeColor = {};
  // group by color code
  for (let t = 0; t < graphData.nodes.length; t++) {
    let current = graphData.nodes[t];
    let addFeatures = Object.keys(current.features).map(
      (f) => f + ":" + current.features[f]["name"]
    );
    if (!colorGroups[current.color]) {
      // first in list
      colorGroups[current.color] = {
        count: 1,
        ids: [current.pub_key],
        features: {},
      };
      for (let f = 0; f < addFeatures.length; f++) {
        colorGroups[current.color]["features"][addFeatures[f]] = 1;
      }
    } else {
      // additional
      colorGroups[current.color].count++;
      colorGroups[current.color].ids.push(current.pub_key);
      for (let f = 0; f < addFeatures.length; f++) {
        // count features in node
        if (colorGroups[current.color]["features"][addFeatures[f]]) {
          colorGroups[current.color]["features"][addFeatures[f]]++;
        } else {
          colorGroups[current.color]["features"][addFeatures[f]] = 1;
        }
      }
    }
    colorGroups[current.color]["featuresStr"] = getFeaturesSummary(
      colorGroups[current.color]["features"]
    );
    nodeColor[current.pub_key] = current.color;
  }
  return {colorGroups, nodeColor};
}
const calcData = function (res) { // process data from raw
  let resultData = { nodes: [], links: [] };
  const { colorGroups, nodeColor } = compileColorGroups();
  let colors = Object.keys(colorGroups);
  let colorsUsed = {};
  // now we have tally - limit and compile features
  for (let t = 0; t < colors.length; t++) {
    if (!limitByCount || colorGroups[colors[t]].count > limitByCountValue) {
      colorsUsed[colors[t]] = true;
      resultData.nodes.push({
        count: colorGroups[colors[t]].count,
        id: colors[t],
        group: colors[t],
        features: colorGroups[colors[t]]["featuresStr"],
      });
    }
  }
  let edgesByColor = getEdgesByColor(nodeColor, colorsUsed);
  resultData.links = sumEdges(edgesByColor);
  res.json(resultData); // return to browser first away
  fs.writeFileSync(cacheFile, JSON.stringify(resultData)); // cache a copy
};
export default (req, res) => {
  res.statusCode = 200;
  fsPromises
    .stat(cacheFile)
    .then((stats) => {
      if (stats.ctimeMs > new Date().getTime() - 1000 * 60) {
        calcData(res); // cache is old
      } else {
        // use cache
        res.json(fs.readFileSync(cacheFile) + "");
      }
    })
    .catch((stats) => {
      // no cache
      calcData(res);
    });
};
