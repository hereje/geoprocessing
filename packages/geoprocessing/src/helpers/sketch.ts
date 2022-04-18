import {
  FeatureCollection,
  Point,
  Polygon,
  MultiPolygon,
  LineString,
} from "../types/geojson";

import {
  Sketch,
  SketchCollection,
  NullSketch,
  NullSketchCollection,
  SketchProperties,
  UserAttribute,
} from "../types/sketch";

import { hasOwnProperty, isObject } from "./native";
import { isFeature, isFeatureCollection, collectionHasGeometry } from "./geo";

import { v4 as uuid } from "uuid";
import bbox from "@turf/bbox";
import { ReportContextValue } from "../storybook";

/**
 * UserAttributes are those filled in via the attributes form specified as
 * part of a SketchClass. This getter function is easier to use than searching
 * the Sketch.properties.userAttributes array, supports default values, and is
 * easier to use with typescript.
 */
export function getUserAttribute<T>(
  sketchOrProps: Sketch | SketchProperties,
  exportid: string
): T | undefined;
export function getUserAttribute<T>(
  sketchOrProps: Sketch | SketchProperties,
  exportid: string,
  defaultValue: T
): T;
export function getUserAttribute<T>(
  sketchOrProps: Sketch | SketchProperties,
  exportid: string,
  defaultValue?: T
) {
  const props: SketchProperties = isSketch(sketchOrProps)
    ? sketchOrProps.properties
    : sketchOrProps;
  let found = props.userAttributes.find((a) => a.exportId === exportid);
  return found?.value || defaultValue;
}

export function getJsonUserAttribute<T>(
  sketchOrProps: Sketch | SketchProperties,
  exportid: string,
  defaultValue: T
): T {
  const value = getUserAttribute(sketchOrProps, exportid, defaultValue);
  if (typeof value === "string") {
    return JSON.parse(value);
  } else {
    return value;
  }
}

/** Helper to convert a Sketch or SketchCollection to a Sketch array, maintaining geometry type */
export function toSketchArray<G>(
  input: Sketch<G> | SketchCollection<G>
): Sketch<G>[] {
  if (isSketch(input)) {
    return [input];
  } else if (isSketchCollection(input)) {
    return input.features;
  }
  throw new Error("invalid input, must be Sketch or SketchCollection");
}

/** Helper to convert a NullSketch or NullSketchCollection to a NullSketch array */
export function toNullSketchArray(
  input: NullSketch | NullSketchCollection
): NullSketch[] {
  if (isSketch(input)) {
    return [input];
  } else if (isSketchCollection(input)) {
    return input.features;
  }
  throw new Error("invalid input, must be NullSketch or NullSketchCollection");
}

/**
 * Returns sketch or sketch collection with null geometry
 */
export function toNullSketch(
  sketch: Sketch | SketchCollection,
  useNull: boolean = false
): NullSketch | NullSketchCollection {
  if (isSketchCollection(sketch)) {
    return {
      ...sketch,
      features: sketch.features.map(({ geometry, ...nonGeom }) => ({
        ...nonGeom,
        ...(useNull ? { geometry: null } : {}),
      })),
    };
  } else {
    const { geometry, ...nonGeom } = sketch;
    return {
      ...nonGeom,
      ...(useNull ? { geometry: null } : {}),
    };
  }
}

/**
 * Checks if object is a Sketch.  Any code inside a block guarded by a conditional call to this function will have type narrowed to Sketch
 */
export const isSketch = (feature: any): feature is Sketch => {
  return (
    isFeature(feature) &&
    hasOwnProperty(feature, "type") &&
    hasOwnProperty(feature, "properties") &&
    feature.properties &&
    feature.properties.name
  );
};

/**
 * Check if object is a SketchCollection.  Any code inside a block guarded by a conditional call to this function will have type narrowed to SketchCollection
 */
export const isSketchCollection = (
  collection: any
): collection is SketchCollection => {
  return (
    isFeatureCollection(collection) &&
    hasOwnProperty(collection, "properties") &&
    isObject(collection.properties) &&
    hasOwnProperty(collection.properties as Record<string, any>, "name") &&
    collection.features.map(isSketch).reduce((acc, cur) => acc && cur, true)
  );
};

/**
 * Checks if object is a NullSketch.  Any code inside a block guarded by a conditional call to this function will have type narrowed to NullSketch
 */
export const isNullSketch = (feature: any): feature is NullSketch => {
  return (
    isFeature(feature) &&
    hasOwnProperty(feature, "type") &&
    hasOwnProperty(feature, "properties") &&
    feature.properties &&
    feature.properties.name &&
    !feature.geometry
  );
};

/**
 * Check if object is a NullSketchCollection.  Any code inside a block guarded by a conditional call to this function will have type narrowed to NullSketchCollection
 */
export const isNullSketchCollection = (
  collection: any
): collection is NullSketchCollection => {
  return (
    isFeatureCollection(collection) &&
    hasOwnProperty(collection, "properties") &&
    isObject(collection.properties) &&
    hasOwnProperty(collection.properties as Record<string, any>, "name") &&
    collection.features.map(isNullSketch).reduce((acc, cur) => acc && cur, true)
  );
};

export const isPolygonSketchCollection = (
  collection: any
): collection is SketchCollection<Polygon> => {
  return (
    isSketchCollection(collection) &&
    collectionHasGeometry(collection, "Polygon")
  );
};

export const isMultiPolygonSketchCollection = (
  collection: any
): collection is SketchCollection<MultiPolygon> => {
  return (
    isSketchCollection(collection) &&
    collectionHasGeometry(collection, "MultiPolygon")
  );
};

export const isPolygonAllSketchCollection = (
  collection: any
): collection is SketchCollection<Polygon | MultiPolygon> => {
  return (
    isSketchCollection(collection) &&
    collectionHasGeometry(collection, ["Polygon", "MultiPolygon"])
  );
};

export const isLineStringSketchCollection = (
  collection: any
): collection is SketchCollection<LineString> => {
  return (
    isSketchCollection(collection) &&
    collectionHasGeometry(collection, "LineString")
  );
};

export const isPointSketchCollection = (
  collection: any
): collection is SketchCollection<Point> => {
  return (
    isSketchCollection(collection) && collectionHasGeometry(collection, "Point")
  );
};

export const genSampleUserAttributes = (): UserAttribute[] => {
  return [
    {
      label: "single",
      fieldType: "ChoiceField",
      exportId: "SINGLE",
      value: "single",
    },
    {
      label: "multi",
      fieldType: "ChoiceField",
      exportId: "MULTI",
      value: ["one", "two"],
    },
    {
      label: "multiJson",
      fieldType: "ChoiceField",
      exportId: "MULTISTRING",
      value: JSON.stringify(["one", "two"]),
    },
  ];
};

/**
 * Returns a Sketch with given geometry and Geometry type, Properties are reasonable random
 */
export const genSampleSketch = <
  G = Polygon | MultiPolygon | LineString | String
>(
  geometry: G,
  name?: string
): Sketch<G> => ({
  type: "Feature",
  properties: {
    id: name || uuid(),
    isCollection: false,
    userAttributes: genSampleUserAttributes(),
    sketchClassId: uuid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: name || "genSampleSketch",
  },
  geometry,
  bbox: bbox(geometry),
});

/**
 * Returns a Sketch with given geometry and Geometry type, Properties are reasonable random
 */
export const genSampleNullSketch = (name?: string): NullSketch => ({
  type: "Feature",
  properties: {
    id: name || uuid(),
    isCollection: false,
    userAttributes: genSampleUserAttributes(),
    sketchClassId: uuid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: name || "genSampleNullSketch",
  },
});

/**
 * Given feature collection, return a sketch collection with reasonable random props.
 * The geometry type of the returned collection will match the one passed in
 * @param geometry
 */
export const genSampleSketchCollection = <G = Polygon | LineString | String>(
  fc: FeatureCollection<G>,
  name?: string
): SketchCollection<G> => {
  // Convert features to sketches
  const sketches = fc.features.map((f) => genSampleSketch(f.geometry));
  // Rebuild into sketch collection
  return {
    ...fc,
    features: sketches,
    properties: {
      id: name || uuid(),
      isCollection: true,
      userAttributes: [],
      sketchClassId: uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: name || `genSampleSketchCollection_${uuid()}`,
    },
    bbox: bbox(fc),
  };
};

/**
 * Given feature collection, return a sketch collection with reasonable random props.
 * The geometry type of the returned collection will match the one passed in
 * @param geometry
 */
export const genSampleNullSketchCollection = (
  sketches: NullSketch[],
  name?: string
): NullSketchCollection => {
  // Rebuild into sketch collection
  return {
    type: "FeatureCollection",
    features: sketches,
    properties: {
      id: name || uuid(),
      isCollection: true,
      userAttributes: [],
      sketchClassId: name || uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: name || `genSampleSketchCollection_${uuid()}`,
    },
  };
};

export const genSampleSketchContext = (): ReportContextValue => ({
  sketchProperties: {
    name: "My Sketch",
    id: "abc123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sketchClassId: "efg345",
    isCollection: false,
    userAttributes: [
      {
        exportId: "DESIGNATION",
        fieldType: "ChoiceField",
        label: "Designation",
        value: "Marine Reserve",
      },
      {
        exportId: "COMMENTS",
        fieldType: "TextArea",
        label: "Comments",
        value: "This is my MPA and it is going to be the greatest. Amazing.",
      },
    ],
  },
  geometryUri: "",
  projectUrl: "https://example.com/project",
  exampleOutputs: [
    {
      functionName: "ranked",
      sketchName: "My Sketch",
      results: {},
    },
  ],
  visibleLayers: [],
});
