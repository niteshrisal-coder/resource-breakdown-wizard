import { PDFDocument, rgb } from 'pdf-lib';
import { z } from "zod";
import { api } from "@shared/routes";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'server', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storageConfig = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storageConfig,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});

const insertBidDocumentSchema = z.object({
  fileName: z.string(),
  fileSize: z.string(),
  uploadDate: z.string(),
  documentUrl: z.string(),
  projectId: z.string().optional(),
});

export async function registerRoutes(
  _httpServer: unknown,
  app: any,
) {
  // ========== HELPER FUNCTIONS ==========
  
  // Clean filename function
  function cleanName(name: string): string {
    return name
      .trim()
      .replace(/[\\/:"*?<>|]+/g, '_')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }

  // Create info PDF for errors
  async function createInfoPDF(res: any, projectId: string, files: any[], message: string) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    
    page.drawText('PROCUREMENT PROCESSING REPORT', {
      x: 50,
      y: 742,
      size: 20,
      color: rgb(0, 0, 0.8),
    });
    
    page.drawText(`Project ID: ${projectId}`, {
      x: 50,
      y: 692,
      size: 12,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Status: ${message}`, {
      x: 50,
      y: 642,
      size: 12,
      color: rgb(1, 0, 0),
    });
    
    page.drawText(`Source PDFs processed: ${files.length}`, {
      x: 50,
      y: 592,
      size: 12,
      color: rgb(0, 0, 0),
    });
    
    let yPosition = 542;
    files.forEach((file: any, index: number) => {
      page.drawText(`${index + 1}. ${file.fileName}`, {
        x: 70,
        y: yPosition,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 20;
    });
    
    page.drawText(`Generated on: ${new Date().toLocaleString()}`, {
      x: 50,
      y: 50,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    const pdfBytes = await pdfDoc.save();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_${projectId}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  }

  // ========== HEALTH CHECK ==========
  app.get("/api/health", (req: any, res: any) => {
    res.json({ status: "ok" });
  });

  // ========== FILE UPLOAD ROUTES ==========
  
  app.post("/api/uploads/request-url", async (req: any, res: any) => {
    try {
      const { name } = req.body;
      const uniqueName = `${uuidv4()}${path.extname(name)}`;
      const fileUrl = `/uploads/${uniqueName}`;
      
      res.json({
        uploadURL: "/api/upload",
        objectPath: fileUrl,
        metadata: req.body
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/upload", upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      res.json({
        id: uuidv4(),
        objectPath: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        success: true
      });
    } catch (error) {
      res.status(500).json({ error: "File upload failed" });
    }
  });

  app.get("/uploads/:filename", (req: any, res: any) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  });

  app.delete("/api/files/:filename", (req: any, res: any) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to delete file" });
      }
      res.json({ success: true });
    });
  });

  // ========== BID DOCUMENTS API ==========
  
  app.get("/api/projects/:projectId/bid-documents", async (req: any, res: any) => {
    res.json([]);
  });

  app.post("/api/bid-documents", async (req: any, res: any) => {
    try {
      const input = insertBidDocumentSchema.parse(req.body);
      res.status(201).json({
        ...input,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to add bid document" });
    }
  });

  app.delete("/api/bid-documents/:id", async (req: any, res: any) => {
    res.json({ success: true });
  });

  // ========== PROCUREMENT PROCESSING ==========
  // Call Python script using file-based communication
  
  app.post("/api/procurement/process-all", async (req: any, res: any) => {
    try {
      const { projectId, files } = req.body;
      
      console.log("=".repeat(60));
      console.log("🔍 PROCUREMENT PROCESSING STARTED (Python - File Method)");
      console.log(`📁 Project ID: ${projectId}`);
      console.log(`📄 Files to process: ${files?.length || 0}`);
      console.log("=".repeat(60));
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files to process" });
      }

      // STEP 1: Get all PDF file paths
      console.log("\n📂 STEP 1: COLLECTING PDF PATHS");
      
      const pdfPaths: string[] = [];
      
      for (const file of files) {
        const filename = path.basename(file.documentUrl);
        const filePath = path.join(uploadsDir, filename);
        
        if (fs.existsSync(filePath)) {
          pdfPaths.push(filePath);
          console.log(`   ✅ ${file.fileName}`);
        } else {
          console.log(`   ⚠️ File not found: ${file.fileName}`);
        }
      }
      
      if (pdfPaths.length === 0) {
        return res.status(400).json({ error: "No PDF files found on server" });
      }
      
      // STEP 2: Create input file for Python
      const timestamp = Date.now();
      const inputFilePath = path.join(uploadsDir, `input_${timestamp}.txt`);
      const outputFilePath = path.join(uploadsDir, `output_${timestamp}.txt`);
      
      // Write PDF paths to input file
      fs.writeFileSync(inputFilePath, pdfPaths.join('\n'));
      console.log(`📝 Created input file: ${inputFilePath}`);
      
      // STEP 3: Check if Python script exists
      const pythonScriptPath = path.join(__dirname, 'download_cli.py');
      console.log(`\n🔍 Checking Python script at: ${pythonScriptPath}`);
      
      if (!fs.existsSync(pythonScriptPath)) {
        console.error(`❌ Python script not found at ${pythonScriptPath}`);
        return res.status(500).json({ error: "Python script not found" });
      }
      console.log(`✅ Python script found`);
      
      // STEP 4: Call Python script with file arguments
      console.log("\n🐍 STEP 3: CALLING PYTHON SCRIPT");
      
      // Modified Python script to accept file arguments
      const command = `python "${pythonScriptPath}" "${inputFilePath}" "${outputFilePath}"`;
      console.log(`   Running: ${command}`);
      
      exec(command, {
        cwd: __dirname,
        timeout: 600000 // 10 minute timeout
      }, (error, stdout, stderr) => {
        
        console.log("\n=== PYTHON SCRIPT OUTPUT ===");
        if (stdout) console.log("STDOUT:", stdout);
        if (stderr) console.log("STDERR:", stderr);
        console.log("=============================");
        
        // Clean up input file
        try {
          fs.unlinkSync(inputFilePath);
          console.log(`🧹 Deleted input file: ${inputFilePath}`);
        } catch (e) {
          // Ignore
        }
        
        if (error) {
          console.error("❌ Python script error:", error);
          return res.status(500).json({ 
            error: "Python script failed", 
            details: stderr || error.message 
          });
        }
        
        // Check if output file exists
        if (fs.existsSync(outputFilePath)) {
          const mergedFilePath = fs.readFileSync(outputFilePath, 'utf8').trim();
          console.log(`✅ Read merged file path from output: ${mergedFilePath}`);
          
          // Clean up output file
          try {
            fs.unlinkSync(outputFilePath);
          } catch (e) {
            // Ignore
          }
          
          if (fs.existsSync(mergedFilePath)) {
            console.log(`✅ File exists, sending to browser...`);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="merged_${projectId}.pdf"`);
            
            const fileStream = fs.createReadStream(mergedFilePath);
            fileStream.pipe(res);
            
            fileStream.on('end', () => {
              console.log("✅ File sent successfully");
            });
          } else {
            console.log(`❌ Merged file not found at: ${mergedFilePath}`);
            res.status(500).json({ error: "Merged file not found on disk" });
          }
        } else {
          console.log("❌ Output file not found");
          res.status(500).json({ error: "Python script didn't create output file" });
        }
      });
      
    } catch (error: any) {
      console.error("❌ PROCUREMENT PROCESSING ERROR:", error);
      res.status(500).json({ error: "Processing failed: " + (error?.message || "Unknown error") });
    }
  });
  // ========== EXISTING ROUTES ==========

  // Work Items
  app.get(api.workItems.list.path, async (req: any, res: any) => {
    const workItems = await storage.getWorkItems();
    res.json(workItems);
  });

  app.post(api.workItems.create.path, async (req: any, res: any) => {
    try {
      const input = api.workItems.create.input.parse(req.body);
      const workItem = await storage.createWorkItem(input);
      res.status(201).json(workItem);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.workItems.update.path, async (req: any, res: any) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
      
      const input = api.workItems.update.input.parse(req.body);
      const workItem = await storage.updateWorkItem(id, input);
      res.json(workItem);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.workItems.delete.path, async (req: any, res: any) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
    await storage.deleteWorkItem(id);
    res.status(204).send();
  });

  // Resource Columns
  app.get(api.resourceColumns.list.path, async (req: any, res: any) => {
    const columns = await storage.getResourceColumns();
    res.json(columns);
  });

  app.post(api.resourceColumns.create.path, async (req: any, res: any) => {
    try {
      const input = api.resourceColumns.create.input.parse(req.body);
      const column = await storage.createResourceColumn(input);
      res.status(201).json(column);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.resourceColumns.update.path, async (req: any, res: any) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
      
      const input = api.resourceColumns.update.input.parse(req.body);
      const column = await storage.updateResourceColumn(id, input);
      res.json(column);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.resourceColumns.delete.path, async (req: any, res: any) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
    await storage.deleteResourceColumn(id);
    res.status(204).send();
  });

  app.post(api.resourceColumns.reorder.path, async (req: any, res: any) => {
    const { columnIds } = api.resourceColumns.reorder.input.parse(req.body);
    await storage.reorderResourceColumns(columnIds);
    res.json({ success: true });
  });

  // Resource Constants
  app.post(api.resourceConstants.upsert.path, async (req: any, res: any) => {
    try {
      const input = api.resourceConstants.upsert.input.parse(req.body);
      const constant = await storage.upsertResourceConstant(input);
      res.json(constant);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed if empty
  await seedDatabase();

  return _httpServer;
}

export async function seedDatabase() {
  const columns = await storage.getResourceColumns();
  if (columns.length === 0) {
    console.log("Seeding database...");

    const cement = await storage.createResourceColumn({ name: "Cement", unit: "Bags" });
    const sand = await storage.createResourceColumn({ name: "Sand", unit: "m3" });
    const gravel = await storage.createResourceColumn({ name: "Gravel", unit: "m3" });

    const concrete = await storage.createWorkItem({
      serialNumber: "1.1",
      refSs: "SS-203",
      description: "Concrete Class A (1:2:4)",
      unit: "m3",
      normsBasisQty: "1",
      actualMeasuredQty: "0",
    });

    const plastering = await storage.createWorkItem({
      serialNumber: "2.1",
      refSs: "SS-305",
      description: "Wall Plastering (1:4)",
      unit: "m2",
      normsBasisQty: "1",
      actualMeasuredQty: "0",
    });

    await storage.upsertResourceConstant({ workItemId: concrete.id, resourceColumnId: cement.id, constantValue: "6.5" });
    await storage.upsertResourceConstant({ workItemId: concrete.id, resourceColumnId: sand.id, constantValue: "0.44" });
    await storage.upsertResourceConstant({ workItemId: concrete.id, resourceColumnId: gravel.id, constantValue: "0.88" });
    await storage.upsertResourceConstant({ workItemId: plastering.id, resourceColumnId: cement.id, constantValue: "0.15" });
    await storage.upsertResourceConstant({ workItemId: plastering.id, resourceColumnId: sand.id, constantValue: "0.02" });

    console.log("Database seeded!");
  }
}