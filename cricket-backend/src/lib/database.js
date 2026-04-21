const fs = require("fs");
const path = require("path");
const { databaseFilePath } = require("../config");

const INITIAL_DATABASE = {
  users: [],
  matches: [],
};

let writeQueue = Promise.resolve();

async function ensureDatabaseFile() {
  const directoryPath = path.dirname(databaseFilePath);

  await fs.promises.mkdir(directoryPath, { recursive: true });

  if (!fs.existsSync(databaseFilePath)) {
    await fs.promises.writeFile(
      databaseFilePath,
      JSON.stringify(INITIAL_DATABASE, null, 2),
      "utf8"
    );
  }
}

async function readDatabase() {
  await ensureDatabaseFile();

  const rawData = await fs.promises.readFile(databaseFilePath, "utf8");

  if (!rawData.trim()) {
    return { ...INITIAL_DATABASE };
  }

  const parsed = JSON.parse(rawData);

  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    matches: Array.isArray(parsed.matches) ? parsed.matches : [],
  };
}

async function writeDatabase(nextDatabase) {
  await ensureDatabaseFile();

  writeQueue = writeQueue.then(() =>
    fs.promises.writeFile(
      databaseFilePath,
      JSON.stringify(nextDatabase, null, 2),
      "utf8"
    )
  );

  return writeQueue;
}

async function updateDatabase(updater) {
  const currentDatabase = await readDatabase();
  const nextDatabase = await updater(currentDatabase);

  await writeDatabase(nextDatabase);

  return nextDatabase;
}

module.exports = {
  readDatabase,
  updateDatabase,
};
