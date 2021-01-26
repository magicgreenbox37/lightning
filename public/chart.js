let svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

let featureData = {};
let voronoi = d3
  .voronoi()
  .x(function (d) {
    return d.x;
  })
  .y(function (d) {
    return d.y;
  })
  .extent([
    [-1, -1],
    [width + 1, height + 1],
  ]);

let simulation = d3 // used to open up the map on start
  .forceSimulation()
  .force(
    "link",
    d3
      .forceLink()
      .id(function (d) {
        return d.id;
      })
      .strength(function (link) {
        if (link.source.group == link.source.target) {
          return 0.01;
        } else {
          return 0.001;
        }
      })
  )
  .force("charge", d3.forceManyBody().strength(-50))
  .force("center", d3.forceCenter(width / 2, height / 2));

setTimeout(function () {
  // run sim for 2s and stop
  simulation.stop();
}, 2000);

// load data and start rendering
d3.json("api/features", function (error, graph) {
  if (error) throw error;
  document.getElementsByTagName("body")[0].style.background = "unset";
  let link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter()
    .append("line")
    .attr("stroke-width", function (d) {
      return Math.sqrt(d.value / 10000);
    });

  let node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter()
    .append("g")
    .append("circle")
    .attr("r", function (d) {
      // bigger circles for more nodes
      let r = d.count / 20 / 10;
      return r > 5 ? r : 5;
    })
    .attr("fill", function (d) {
      return d.group;
    });
  // add hover text
  node.append("title").text(function (d) {
    return d.id + ":" + d.count + " nodes";
  });

  simulation.nodes(graph.nodes).on("tick", ticked);

  simulation.force("link").links(graph.links);

  // append voronoi
  let cells = svg
    .selectAll()
    .data(simulation.nodes())
    .enter()
    .append("g")
    .attr("fill", function (d) {
      return d.group;
    })
    .attr("class", function (d) {
      return d.group + " section";
    });

  let cell = cells.append("path").data(voronoi.polygons(simulation.nodes()));

  function ticked() {
    // make sure all voronoi bgs have path ids needed for text linking
    let areas = d3.selectAll(".section");
    areas.each(function (d) {
      let ch = this.children[0];
      if (ch.id == "") {
        ch.id = "path" + d.group;
      }
    });
    let alpha = this.alpha();
    let coords = {};
    let groups = [];

    // sort the nodes into groups:
    node.each(function (d) {
      if (groups.indexOf(d.group) == -1) {
        groups.push(d.group);
        coords[d.group] = [];
      }
      coords[d.group].push({ x: d.x, y: d.y });
    });

    // get the centroid of each group:
    let centroids = {};

    for (let group in coords) {
      let groupNodes = coords[group];

      let n = groupNodes.length;
      let cx = 0;
      let tx = 0;
      let cy = 0;
      let ty = 0;

      groupNodes.forEach(function (d) {
        tx += d.x;
        ty += d.y;
      });

      cx = tx / n;
      cy = ty / n;

      centroids[group] = { x: cx, y: cy };
    }

    // don't modify points close the the group centroid:
    let minDistance = 10;

    if (alpha < 0.1) {
      minDistance = 10 + 1000 * (0.1 - alpha);
    }

    // adjust each point if needed towards group centroid:
    node.each(function (d) {
      let cx = centroids[d.group].x;
      let cy = centroids[d.group].y;
      let x = d.x;
      let y = d.y;
      let dx = cx - x;
      let dy = cy - y;

      let r = Math.sqrt(dx * dx + dy * dy);

      if (r > minDistance) {
        d.x = x * 0.9 + cx * 0.1;
        d.y = y * 0.9 + cy * 0.1;
      }
      if (!featureData[d.id]) {
        featureData[d.id] = svg
          .append("text")
          .attr("x", -1)
          .attr("dy", -3)
          .append("textPath")
          .attr("xlink:href", "#path" + d.id) // links to area
          .attr("font-size", ".7em")
          .style("fill", "#7d7b76")
          .text("#" + d.count + " " + d.features);
      }
    });

    // update voronoi:
    cell = cell
      .data(voronoi.polygons(simulation.nodes()))
      .attr("d", renderCell);

    // update links:
    link
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });

    // update nodes:
    node
      .attr("cx", function (d) {
        return d.x;
      })
      .attr("cy", function (d) {
        return d.y;
      });
  }
});

function renderCell(d) {
  return d == null ? null : "M" + d.join("L") + "Z";
}
window.onresize = () => location.reload();
