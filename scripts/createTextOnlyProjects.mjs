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
const ProjectModel = mongoose.model("Sortedcleanproject", projectSchema);
const TextOnlyProjectModel = mongoose.model("Textonlyproject", projectSchema);

function generateProjectText(project) {
  const creatorsList = project.users
    .map((user) => {
      if (user && user.user_name) {
        return user.user_name;
      }
      return "Unknown";
    })
    .join(", ");
  const instrutorsList = project.instructors
    .map((instructor) => {
      if (instructor && instructor.instructor_name) {
        return instructor.instructor_name;
      }
      return "Unknown";
    })
    .join(", ");
  const classList = project.classes
    .map((itpClass) => {
      if (itpClass && itpClass.class_name) {
        return itpClass.class_name;
      }
      return "Unknown";
    })
    .join(", ");
  const elevatorPitch =
    project.elevator_pitch.trim() === "" ? "None" : project.elevator_pitch.trim();
  const description = project.description.trim() === "" ? "None" : project.description.trim();
  const technicalDetails =
    project.technical_system.trim() === "" ? "None" : project.technical_system.trim();
  const background = project.background.trim() === "" ? "None" : project.background.trim();
  const userScenario = project.user_scenario.trim() === "" ? "None" : project.user_scenario.trim();
  const keywords = project.keywords.trim() === "" ? "None" : project.keywords.trim();

  const projectText = `**Title:**
${project.project_name}

**Creator(s):**
${creatorsList}

**Instructor(s):**
${instrutorsList}

**Class(es):**
${classList}

**Date:**
${project.timestamp}

**One Line Description:**
${elevatorPitch}

**Description:**
${description}

**Technical description:**
${technicalDetails}

**Background:**
${background}

**User scenario:**
${userScenario}

**Keywords:**
${keywords}
`;
  return projectText;
}

async function main() {
  let count = await ProjectModel.countDocuments();
  for (let i = 0; i < count; i++) {
    const project = await ProjectModel.findOne({}, null, { skip: i });
    const projectText = generateProjectText(project);
    const textOnlyProject = new TextOnlyProjectModel({
      text: projectText,
      originalProjectId: project._id,
    });
    await textOnlyProject.save();
    console.log("Inserting project" + (i + 1));
  }
}

main();
