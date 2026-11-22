// Generic "read/write a JSON blob at a given path" helper. Used by both the
// legacy single-tenant assessment store and the multi-tenant marketplace store.
const { BlobServiceClient } = require("@azure/storage-blob");

const CONTAINER_NAME = process.env.ASSESSMENT_CONTAINER_NAME || "assessment-data";

let containerClientPromise = null;

function getContainerClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING application setting is not configured. See README for setup steps."
    );
  }
  if (!containerClientPromise) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    containerClientPromise = containerClient.createIfNotExists().then(() => containerClient);
  }
  return containerClientPromise;
}

async function readJson(blobPath) {
  const containerClient = await getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
  const exists = await blockBlobClient.exists();
  if (!exists) return null;
  const downloadResponse = await blockBlobClient.download();
  const text = await streamToText(downloadResponse.readableStreamBody);
  return JSON.parse(text);
}

async function writeJson(blobPath, data) {
  const containerClient = await getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
  const content = JSON.stringify(data);
  await blockBlobClient.upload(content, Buffer.byteLength(content), {
    overwrite: true,
    blobHTTPHeaders: { blobContentType: "application/json" },
  });
}

async function listJson(prefix) {
  const containerClient = await getContainerClient();
  const results = [];
  for await (const blob of containerClient.listBlobsFlat({ prefix })) {
    results.push(blob.name);
  }
  return results;
}

async function streamToText(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

module.exports = { readJson, writeJson, listJson };
