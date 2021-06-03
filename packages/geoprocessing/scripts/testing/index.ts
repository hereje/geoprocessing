import fs from "fs-extra";
import {
  Sketch,
  SketchCollection,
  Feature,
  Polygon,
  LineString,
  Point,
} from "../../src/types";
import path from "path";
import {
  isSketch,
  isSketchCollection,
  isPolygon,
  isLineString,
  isPoint,
} from "../../src/helpers";

/**
 * A simple map of sketches and/or sketch collections keyed by their name
 */
interface SketchMap {
  [name: string]: Sketch | SketchCollection;
}

/**
 * A simple map of features keyed by their name
 */
interface FeatureMap {
  [name: string]: Feature;
}

/**
 * Reads all files from examples/sketches for testing. Run from project root
 * Optionally filters out those that don't match partialName
 */
export async function getExampleSketchAll(
  partialName?: string
): Promise<Array<Sketch | SketchCollection>> {
  const sketches: Array<Sketch | SketchCollection> = [];
  if (fs.existsSync("examples/sketches")) {
    let filenames = await fs.readdir("examples/sketches");
    await Promise.all(
      filenames
        .filter((fname) => /\.json/.test(fname))
        .map(async (f) => {
          const sketch = await fs.readJSON(`examples/sketches/${f}`);
          sketches.push(sketch);
        })
    );
  }
  const filtered = sketches.filter((f) =>
    partialName ? f.properties?.name.includes(partialName) : f
  );
  return filtered;
}

/**
 * Reads all sketche collections from examples/sketches for testing. Run from project root
 * Optionally filters out those that don't match partialName
 */
export async function getExampleSketchCollections(
  partialName?: string
): Promise<Array<SketchCollection>> {
  return (await getExampleSketchAll(partialName)).filter(isSketchCollection);
}

/**
 * Reads all sketches from examples/sketches for testing. Run from project root
 * Optionally filters out those that don't match partialName
 */
export async function getExampleSketches(
  partialName?: string
): Promise<Array<Sketch>> {
  return (await getExampleSketchAll(partialName)).filter(isSketch);
}

/**
 * Reads all Polygon sketches from examples/sketches for testing. Run from project root
 * Optionally filters out those that don't match partialName
 * TODO: remove cast if possible
 */
export async function getExamplePolygonSketches(
  partialName?: string
): Promise<Array<Sketch<Polygon>>> {
  return (await getExampleSketches(partialName)).filter(
    isPolygon
  ) as Sketch<Polygon>[];
}

/**
 * Reads all Linestring sketches from examples/sketches for testing. Run from project root
 * Optionally filters out those that don't match partialName
 * TODO: remove cast if possible
 */
export async function getExampleLineStringSketches(
  partialName?: string
): Promise<Array<Sketch<LineString>>> {
  return (await getExampleSketches(partialName)).filter(
    isLineString
  ) as Sketch<LineString>[];
}

/**
 * Reads all Point sketches from examples/sketches for testing. Run from project root
 * Optionally filters out those that don't match partialName
 * TODO: remove cast if possible
 */
export async function getExamplePointSketches(
  partialName?: string
): Promise<Array<Sketch<Point>>> {
  return (await getExampleSketches(partialName)).filter(
    isPoint
  ) as Sketch<Point>[];
}

/**
 * Convenience function returns object with sketches keyed by name
 * Optionally filters out those that don't match partialName
 * @deprecated use partialName support in getExample*Sketches(partialName) functions
 */
export async function getExampleSketchesByName(
  partialName?: string
): Promise<SketchMap> {
  const sketches = await getExampleSketches(partialName);
  return sketches.reduce<SketchMap>((sketchObject, s) => {
    return {
      ...sketchObject,
      [s.properties.name]: s,
    };
  }, {});
}

/**
 * Reads features from examples/features for testing. Run from project root
 * Optionally filters out those that don't match partialName
 */
export async function getExampleFeatures(partialName?: string) {
  let features: Feature[] = [];
  if (fs.existsSync("examples/features")) {
    let filenames = await fs.readdir("examples/features");
    await Promise.all(
      filenames
        .filter((fname) => /\.json/.test(fname))
        .map(async (f) => {
          const feature = await fs.readJSON(`examples/features/${f}`);
          feature.properties = feature.properties || {};
          feature.properties.name = path.basename(f);
          features.push(feature);
        })
    );
  }
  const filtered = features.filter((f) =>
    partialName ? f.properties?.name.includes(partialName) : f
  );
  return filtered;
}

/**
 * Convenience function returns object with features keyed by their filename.  Features without a name will not be included
 * Optionally filters out those that don't match partialName
 */
export async function getExampleFeaturesByName(
  partialName?: string
): Promise<FeatureMap> {
  const features = await getExampleFeatures(partialName);
  return features.reduce<FeatureMap>((featureMap, f) => {
    return f.properties?.name
      ? {
          ...featureMap,
          [f.properties.name]: f,
        }
      : featureMap;
  }, {});
}

/**
 * Writes the output of running a function with a sketch to file
 */
export async function writeResultOutput(
  results: any,
  functionName: string,
  sketchName: string
) {
  if (!fs.existsSync("examples/output")) {
    await fs.mkdir("examples/output");
  }
  const folder = "examples/output/" + sketchName;
  if (!fs.existsSync(folder)) {
    await fs.mkdir(folder);
  }
  fs.writeFile(
    folder + "/" + functionName + ".json",
    JSON.stringify(results, null, "  ")
  );
}
