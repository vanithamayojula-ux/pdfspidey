import { GoogleGenAI, type FunctionDeclaration, Type } from "@google/genai";
import { db } from "../db";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const listCategoriesTool: FunctionDeclaration = {
  name: "listCategories",
  description: "Get a list of all document categories in the PDF Vault.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const listFoldersTool: FunctionDeclaration = {
  name: "listFolders",
  description: "Get a list of folders within a specific category, optionally filtered by parent folder.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      categoryName: {
        type: Type.STRING,
        description: "The name of the category to list folders for.",
      },
      parentId: {
        type: Type.NUMBER,
        description: "Optional parent folder ID to list subfolders for.",
      },
    },
    required: ["categoryName"],
  },
};

const listPDFsTool: FunctionDeclaration = {
  name: "listPDFs",
  description: "Get a list of PDF documents, optionally filtered by category or folder.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      categoryName: {
        type: Type.STRING,
        description: "Optional category name to filter by.",
      },
      folderId: {
        type: Type.NUMBER,
        description: "Optional folder ID to filter by.",
      },
    },
  },
};

const createCategoryTool: FunctionDeclaration = {
  name: "createCategory",
  description: "Create a new document category.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The name of the new category.",
      },
    },
    required: ["name"],
  },
};

const createFolderTool: FunctionDeclaration = {
  name: "createFolder",
  description: "Create a new folder within a category or another folder.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The name of the new folder.",
      },
      categoryName: {
        type: Type.STRING,
        description: "The category where the folder should be created.",
      },
      parentId: {
        type: Type.NUMBER,
        description: "Optional parent folder ID to create a subfolder.",
      },
    },
    required: ["name", "categoryName"],
  },
};

const deletePDFTool: FunctionDeclaration = {
  name: "deletePDF",
  description: "Delete a specific PDF document by its ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.NUMBER,
        description: "The ID of the PDF to delete.",
      },
    },
    required: ["id"],
  },
};

const renamePDFTool: FunctionDeclaration = {
  name: "renamePDF",
  description: "Rename a specific PDF document.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.NUMBER,
        description: "The ID of the PDF to rename.",
      },
      newName: {
        type: Type.STRING,
        description: "The new name for the PDF (without .pdf extension).",
      },
    },
    required: ["id", "newName"],
  },
};

const movePDFTool: FunctionDeclaration = {
  name: "movePDF",
  description: "Move a PDF document to a different category or folder.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.NUMBER,
        description: "The ID of the PDF to move.",
      },
      categoryName: {
        type: Type.STRING,
        description: "The new category name.",
      },
      folderId: {
        type: Type.NUMBER,
        description: "Optional new folder ID. Use null to move to category root.",
      },
    },
    required: ["id", "categoryName"],
  },
};

const getAppStatsTool: FunctionDeclaration = {
  name: "getAppStats",
  description: "Get overall statistics about the PDF Vault (total files, total size).",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const tools = [
  {
    functionDeclarations: [
      listCategoriesTool,
      listFoldersTool,
      listPDFsTool,
      createCategoryTool,
      createFolderTool,
      deletePDFTool,
      renamePDFTool,
      movePDFTool,
      getAppStatsTool,
    ],
  },
];

export const chat = ai.chats.create({
  model: "gemini-3-flash-preview",
  config: {
    systemInstruction: `You are an intelligent, student-friendly, university exam preparation AI that answers strictly from the provided PDFs or study materials.

Your mission is to help students:
- Understand any subject
- Prepare for exams
- Write high-scoring answers
- Get viva ready
- Revise quickly before exams

SOURCE RULE:
Use ONLY the provided PDF content as your knowledge source.
If the answer is not present in the PDF, clearly say:
"This information is not available in the provided material."

UNDERSTAND STUDENT INTENT:
Even if the student asks in short or informal form, understand and convert it into a proper academic answer.

Examples:
"2 marks"
"important questions"
"explain unit 3"
"short notes"
"solve this"
"only query"
"viva"
"summary"

RESPONSE FORMAT:

📌 Topic Overview  
- 2–3 simple lines for quick understanding  

🧠 Detailed Explanation  
- Step-by-step
- Point-wise
- Easy language  

📝 Exam-Ready Key Points  
- Points that can be written directly in the answer sheet  

📄 Record / Long Answer Format (for 16-mark questions when relevant)  
- With proper headings and structured content  

📊 If numerical / problem:
1. Given  
2. Formula  
3. Substitution  
4. Final Answer  

💻 If coding / SQL:
1. Correct query / code  
2. Line-by-line explanation  
3. Sample input (if applicable)  
4. Expected output  

❓ Viva Questions  
- 3 important questions with short answers  

📚 Short Notes for Revision  
- 5–6 quick memory points  

🎯 Important Exam Questions  
- Based on the current topic from the PDF  

ANSWER STYLE RULES:
- Use simple English
- Be clear and student-friendly
- Use headings and bullet points
- Avoid long paragraphs
- Highlight important keywords in bold
- Follow university exam writing style

SMART MODES:

If user asks:
"2 marks" → give very short crisp answer  
"16 marks" → give detailed structured answer  
"summary" → unit-wise summary  
"important questions" → exam question list  
"viva" → only viva questions  
"short notes" → quick revision points  
"step-by-step" → full detailed explanation  
"night before exam" → only most important points  

ADAPT TO SUBJECT AUTOMATICALLY:
Work for theory, problem-based, numerical, programming, DBMS, OS, CN, Python, Java, Data Science, ECE, MBA, or any academic subject.

BEHAVIOR:
- Act like a supportive senior who helps juniors pass exams
- Be motivating and clear
- Focus on scoring marks
- Avoid unnecessary theory

END EVERY RESPONSE WITH:
"Do you want MCQs, previous exam questions, more problems, or a quick revision test from this topic?"`,
    tools,
  },
});

export async function handleAiRequest(message: string) {
  let response = await chat.sendMessage({ message });
  
  // Handle function calls if any
  while (response.functionCalls) {
    const functionResponses = [];
    
    for (const call of response.functionCalls) {
      let result;
      switch (call.name) {
        case "listCategories":
          result = await db.categories.toArray();
          break;
        case "listFolders":
          result = await db.folders
            .where("categoryName")
            .equals(call.args.categoryName as string)
            .filter(f => f.parentId === (call.args.parentId as number || undefined))
            .toArray();
          break;
        case "listPDFs":
          let collection = db.pdfs.toCollection();
          if (call.args.folderId) {
            collection = db.pdfs.where("folderId").equals(call.args.folderId as number);
          } else if (call.args.categoryName) {
            collection = db.pdfs.where("category").equals(call.args.categoryName as string);
          }
          const pdfs = await collection.toArray();
          result = pdfs.map(p => ({ id: p.id, name: p.name, category: p.category, size: p.size, createdAt: p.createdAt }));
          break;
        case "createCategory":
          await db.categories.add({ name: call.args.name as string });
          result = { status: "success", message: `Category '${call.args.name}' created.` };
          break;
        case "createFolder":
          await db.folders.add({ 
            name: call.args.name as string, 
            categoryName: call.args.categoryName as string,
            parentId: call.args.parentId as number || undefined
          });
          result = { status: "success", message: `Folder '${call.args.name}' created.` };
          break;
        case "deletePDF":
          await db.pdfs.delete(call.args.id as number);
          result = { status: "success", message: `PDF with ID ${call.args.id} deleted.` };
          break;
        case "renamePDF":
          await db.pdfs.update(call.args.id as number, { name: (call.args.newName as string) + ".pdf" });
          result = { status: "success", message: `PDF renamed to '${call.args.newName}.pdf'.` };
          break;
        case "movePDF":
          await db.pdfs.update(call.args.id as number, { 
            category: call.args.categoryName as string,
            folderId: call.args.folderId as number || undefined
          });
          result = { status: "success", message: `PDF moved to category '${call.args.categoryName}'.` };
          break;
        case "getAppStats":
          const all = await db.pdfs.toArray();
          const totalSize = all.reduce((acc, p) => acc + p.size, 0);
          result = { totalFiles: all.length, totalSizeMB: (totalSize / 1024 / 1024).toFixed(2) };
          break;
        default:
          result = { error: "Unknown function" };
      }
      
      functionResponses.push({
        name: call.name,
        response: result,
        id: call.id,
      });
    }
    
    response = await chat.sendMessage({
      message: functionResponses,
    });
  }
  
  return response.text;
}
