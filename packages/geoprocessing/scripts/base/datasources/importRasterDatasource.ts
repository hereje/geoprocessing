import path from "path";
import { $ } from "zx";
import fs from "fs-extra";
import {
  InternalRasterDatasource,
  ImportRasterDatasourceOptions,
  ImportRasterDatasourceConfig,
} from "../../../src/types";
import { getDatasetBucketName } from "../../../src/datasources";
import { genRasterConfig } from "./genRasterConfig";
import { createOrUpdateDatasource } from "./datasources";
import { publishDatasource } from "./publishDatasource";

import ProjectClientBase from "../../../src/project/ProjectClientBase";

export async function importRasterDatasource<C extends ProjectClientBase>(
  projectClient: C,
  options: ImportRasterDatasourceOptions,
  extraOptions: {
    doPublish?: boolean;
    newDatasourcePath?: string;
    newDstPath?: string;
    srcBucketUrl?: string;
  }
) {
  const { newDatasourcePath, newDstPath, doPublish = false } = extraOptions;
  const config = await genRasterConfig(projectClient, options, newDstPath);

  // Ensure dstPath is created
  fs.ensureDirSync(config.dstPath);

  await genCog(config);

  if (doPublish) {
    await Promise.all(
      config.formats.map((format) => {
        return publishDatasource(
          config.dstPath,
          format,
          config.datasourceId,
          getDatasetBucketName(config)
        );
      })
    );
  }

  const timestamp = new Date().toISOString();

  const newVectorD: InternalRasterDatasource = {
    src: config.src,
    band: config.band,
    geo_type: "raster",
    datasourceId: config.datasourceId,
    formats: config.formats,
    created: timestamp,
    lastUpdated: timestamp,
    noDataValue: config.noDataValue,
    measurementType: config.measurementType,
    precalc: config.precalc,
  };

  await createOrUpdateDatasource(newVectorD, newDatasourcePath);
  return newVectorD;
}

export async function genCog(config: ImportRasterDatasourceConfig) {
  const { src } = config;
  const warpDst = getCogPath(config.dstPath, config.datasourceId, "_4326");
  const dst = getCogPath(config.dstPath, config.datasourceId);
  await $`gdalwarp -t_srs "EPSG:4326" ${src} ${warpDst}`;
  await $`gdal_translate -b ${config.band} -r nearest -of COG -stats ${warpDst} ${dst}`;
  await $`rm ${warpDst}`;
  try {
    await $`rm ${warpDst}.aux.xml`;
  } catch (err: unknown) {
    console.log(`${warpDst}.aux.xml not found, skipping`);
  }
}

/** Returns a full pathname to a COG given dst path, datasourceID, and optional postfix name */
export function getCogPath(
  dstPath: string,
  datasourceId: string,
  postfix?: string
) {
  return path.join(dstPath, datasourceId) + (postfix ? postfix : "") + ".tif";
}
