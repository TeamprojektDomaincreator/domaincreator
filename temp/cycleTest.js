var N = 100000;

// variables to be used
// in both functions
var graph = Array.from(Array(N), () => Array());

var cycles = Array.from(Array(N), () => Array());

var cyclenumber = 0;

// Function to mark the vertex with
// different colors for different cycles
function dfs_cycle(u, p, color, par) {
  // already (completely)
  // visited vertex.
  if (color[u] == 2) {
    return;
  }

  // seen vertex, but was not
  // completely visited -> cycle
  // detected. backtrack based on
  // parents to find the complete
  // cycle.
  if (color[u] == 1) {
    var v = [];
    var cur = p;
    v.push(cur);

    // backtrack the vertex which
    // are in the current cycle
    // thats found
    while (cur != u) {
      cur = par[cur];
      v.push(cur);
    }
    cycles[cyclenumber] = v;
    cyclenumber++;
    return;
  }
  par[u] = p;

  // partially visited.
  color[u] = 1;

  // simple dfs on graph
  for (var v of graph[u]) {
    // if it has not been
    // visited previously
    if (v == par[u]) {
      continue;
    }
    dfs_cycle(v, u, color, par);
  }

  // completely visited.
  color[u] = 2;
}

// add the edges to the
// graph
function addEdge(u, v) {
  graph[u].push(v);
  graph[v].push(u);
}

// Function to print the cycles
function printCycles() {
  // print all the vertex with
  // same cycle
  console.log('cycles')
  for (var i = 0; i < cyclenumber; i++) {
    // Print the i-th cycle
    s = ''
    for (var x of cycles[i]) s += " " + x;
    console.log(s)
  }
}

// Driver Code
// add edges
addEdge(1, 2);

addEdge(3, 4);
addEdge(4, 5);

addEdge(2, 5);
addEdge(0, 3);
addEdge(1, 4);

addEdge(0, 1);
addEdge(3, 6);
addEdge(4, 7);
addEdge(6, 7);
// arrays required to color
// the graph, store the parent
// of node
var color = Array(N).fill(0);
var par = Array(N).fill(0);

// store the numbers of cycle
cyclenumber = 0;
// call DFS to mark
// the cycles
dfs_cycle(1, 0, color, par);
// function to print the cycles
printCycles();
