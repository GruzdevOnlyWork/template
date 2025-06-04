
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBBeMxWFl4vxTSdE5KfKkpGTLETZ0zuHcA",
  authDomain: "templatemaster-b0e5b.firebaseapp.com",
  projectId: "templatemaster-b0e5b",
  storageBucket: "templatemaster-b0e5b.firebasestorage.app",
  messagingSenderId: "962640953278",
  appId: "1:962640953278:web:b75c3787185dd3c38c03ef",
  measurementId: "G-4MXX86P5QP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


const testTemplates = [
  {
    id: "template1",
    title: "Business Contract",
    description: "Standard business agreement template with customizable terms",
    category: "Legal",
    placeholders: ["{{company_name}}", "{{date}}", "{{amount}}"],
    content: "This contract is between {{company_name}} and the client dated {{date}} with amount {{amount}}."
  },
  {
    id: "template2",
    title: "Invoice Template",
    description: "Professional invoice format for billing clients",
    category: "Finance",
    placeholders: ["{{client_name}}", "{{invoice_date}}", "{{total_amount}}"],
    content: "Invoice for {{client_name}} dated {{invoice_date}} with total amount {{total_amount}}."
  },
  {
    id: "template3",
    title: "Employment Offer Letter",
    description: "Formal job offer letter with compensation details",
    category: "HR",
    placeholders: ["{{candidate_name}}", "{{position}}", "{{start_date}}", "{{salary}}"],
    content: "Dear {{candidate_name}}, we are pleased to offer you the position of {{position}} starting on {{start_date}} with a salary of {{salary}}."
  }
];

const seedTestData = async () => {
  const templatesRef = collection(db, "templates");

  for (const template of testTemplates) {
    try {
      await setDoc(doc(templatesRef, template.id), template);
      console.log(`Added template: ${template.title}`);
    } catch (error) {
      console.error(`Error adding template ${template.title}:`, error);
    }
  }

  console.log("Seeding completed.");
};

seedTestData().catch(console.error);
