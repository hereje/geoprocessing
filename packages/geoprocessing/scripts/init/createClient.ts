import inquirer from "inquirer";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { GeoprocessingJsonConfig } from "../../src/types";
import pascalcase from "pascalcase";

function getTemplateClientPath() {
  const gpPath = /dist/.test(__dirname)
    ? `${__dirname}/../../..`
    : `${__dirname}/../..`;
  return `${gpPath}/templates/clients`;
}

async function createClient() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "title",
      message: "Name for this client, in PascalCase",
      validate: (value) =>
        /^\w+$/.test(value) ? true : "Please use only alphabetical characters",
      transformer: (value) => pascalcase(value),
    },
    {
      type: "input",
      name: "description",
      message: "Describe what this client is for",
    },
  ]);
  answers.title = pascalcase(answers.title);
  await makeClient(answers, true, "");
}

if (require.main === module) {
  createClient();
}

export async function makeClient(
  options: ClientOptions,
  interactive = true,
  basePath = "./"
) {
  const spinner = interactive
    ? ora("Creating new client").start()
    : { start: () => false, stop: () => false, succeed: () => false };
  spinner.start(`creating client from templates`);
  // copy client template
  const fpath = basePath + "src/clients";
  // rename metadata in function definition
  const templatePath = getTemplateClientPath();
  const clientCode = await fs.readFile(`${templatePath}/Client.tsx`);
  const testCode = await fs.readFile(`${templatePath}/Client.stories.tsx`);
  if (!fs.existsSync(path.join(basePath, "src"))) {
    fs.mkdirSync(path.join(basePath, "src"));
  }
  if (!fs.existsSync(path.join(basePath, "src", "clients"))) {
    fs.mkdirSync(path.join(basePath, "src", "clients"));
  }
  const geoprocessingJson = JSON.parse(
    fs.readFileSync(path.join(basePath, "geoprocessing.json")).toString()
  ) as GeoprocessingJsonConfig;
  geoprocessingJson.clients = geoprocessingJson.clients || [];
  geoprocessingJson.clients.push({
    name: options.title,
    description: options.description,
    source: `src/clients/${options.title}.tsx`,
  });
  fs.writeFileSync(
    path.join(basePath, "geoprocessing.json"),
    JSON.stringify(geoprocessingJson, null, "  ")
  );
  const functions = geoprocessingJson.geoprocessingFunctions;
  let functionName = "area";
  if (options.functionName) {
    functionName = options.functionName; // expected to be in geoprocessing.json
  } else if (functions && functions.length) {
    functionName = path.basename(functions[0]).split(".")[0];
  }
  const resultsType = pascalcase(`${functionName} results`);
  await fs.writeFile(
    `${fpath}/${options.title}.tsx`,
    clientCode
      .toString()
      .replace(/Client/g, options.title)
      .replace(/AreaResults/g, resultsType)
      .replace(`"area"`, `"${functionName}"`)
      .replace(`functions/area`, `functions/${functionName}`)
  );
  await fs.writeFile(
    `${fpath}/${options.title}.stories.tsx`,
    testCode.toString().replace(/Client/g, options.title)
  );

  spinner.succeed(`created ${options.title} client in ${fpath}/`);
  if (interactive) {
    console.log(chalk.blue(`\nGeoprocessing client initialized`));
    console.log(`\nNext Steps:
    * Update your client definition in ${`${fpath}/${options.title}.tsx`}
  `);
  }
}

export { createClient };

interface ClientOptions {
  title: string;
  description: string;
  /** The geoprocessing function to run for this Client */
  functionName?: string;
}
