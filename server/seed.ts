// Seed initial subjects for the medical study assistant
import { db } from "./db";
import { subjects } from "@shared/schema";
import { eq } from "drizzle-orm";

const initialSubjects = [
  {
    name: "Cardiologia",
    description: "Estudi del cor i sistema cardiovascular",
    icon: "Heart",
    color: "#ef4444",
  },
  {
    name: "Neurologia",
    description: "Estudi del sistema nerviós i malalties neurològiques",
    icon: "Brain",
    color: "#8b5cf6",
  },
  {
    name: "Pediatria",
    description: "Medicina infantil i atenció a nens",
    icon: "Baby",
    color: "#06b6d4",
  },
  {
    name: "Cirurgia",
    description: "Intervencions quirúrgiques i tècniques operatòries",
    icon: "Scissors",
    color: "#f59e0b",
  },
  {
    name: "Medicina Interna",
    description: "Diagnòstic i tractament de malalties d'òrgans interns",
    icon: "Stethoscope",
    color: "#10b981",
  },
  {
    name: "Dermatologia",
    description: "Malalties de la pell i tractaments dermatològics",
    icon: "Eye",
    color: "#ec4899",
  },
];

export async function seedSubjects() {
  try {
    console.log("Seeding subjects...");
    
    for (const subject of initialSubjects) {
      // Check if subject already exists
      const existing = await db.select().from(subjects).where(eq(subjects.name, subject.name)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(subjects).values(subject);
        console.log(`Created subject: ${subject.name}`);
      } else {
        console.log(`Subject already exists: ${subject.name}`);
      }
    }
    
    console.log("Seeding completed!");
  } catch (error) {
    console.error("Error seeding subjects:", error);
  }
}
