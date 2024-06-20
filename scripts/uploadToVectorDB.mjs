import mongoose from "mongoose";
import "dotenv/config";
import Replicate from "replicate";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";

// connect to milvus
const client = new MilvusClient({
  address: process.env.MILVUS_HOST,
  username: process.env.MILVUS_USERNAME,
  password: process.env.MILVUS_PASSWORD,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function generateEmbeddingVectors(text) {
  const output = await replicate.run(
    "replicate/all-mpnet-base-v2:b6b7585c9640cd7a9572c6e129c9549d79c9c31f0d3fdce7baac7c67ca38f305",
    { input: { text } }
  );
  return output[0].embedding;
}

async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (e) {
    console.error("MongoDB connection failed:", e);
  }
}

connect();

const projectSchema = new mongoose.Schema({}, { strict: false });
const TextOnlyProjectModel = mongoose.model("Textonlyproject", projectSchema);

async function main() {
  await client.useDatabase({ db_name: "chatitp" });

  const projects = await TextOnlyProjectModel.find();
  const data = [];
  let projectCount = 0;
  for (const project of projects) {
    const embedding = await generateEmbeddingVectors(project.text);
    data.push({
      id: project.originalProjectId.toString(),
      embedding: embedding,
      text: project.text,
    });
    projectCount++;
    console.log("embedded:" + projectCount);
  }

  try {
    const res = await client.insert({
      collection_name: "projects",
      data,
    });
    console.log("Milvus insert successful");
  } catch (e) {
    console.error("Milvus insert failed:", e);
  }
}
main();
