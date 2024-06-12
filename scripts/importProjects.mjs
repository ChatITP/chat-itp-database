import mongoose from "mongoose";
import "dotenv/config";

async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (e) {
    console.error("MongoDB connection failed:", e);
  }
}

connect();

const projectSchema = new mongoose.Schema({}, { strict: false });
const ProjectModel = mongoose.model("Project", projectSchema);

async function main() {
  let venues = {};
  let importedCount = 0;

  try {
    const venueRes = await fetch(process.env.ITP_PROJECT_DB_VENUE_URL);
    venues = await venueRes.json();
  } catch (e) {
    console.error("Failed to fetch venue IDs from ITP project database:", e);
  }

  for (const [id, venueName] of Object.entries(venues)) {
    console.log(`Importing projects for ${venueName}...`);
    try {
      const projectRes = await fetch(`${process.env.ITP_PROJECT_DB_URL}?venue_id=${id}`);
      const projects = await projectRes.json();
      for (const project of projects) {
        project.venue = {
          venue_id: parseInt(id),
          venue_name: venueName,
        };
        const projectModel = new ProjectModel(project);
        await projectModel.save();
        importedCount++;
      }
    } catch (e) {
      console.error(`Failed to fetch projects for ${venueName}:`, e);
    }
  }
  console.log(`Imported ${importedCount} projects.`);
  mongoose.connection.close();
}
main();
