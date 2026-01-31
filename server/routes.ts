import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage/index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register Object Storage routes
  registerObjectStorageRoutes(app);

  // Work Items
  app.get(api.workItems.list.path, async (req, res) => {
    const items = await storage.getWorkItems();
    res.json(items);
  });

  app.post(api.workItems.create.path, async (req, res) => {
    try {
      const input = api.workItems.create.input.parse(req.body);
      const item = await storage.createWorkItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.workItems.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
      const input = api.workItems.update.input.parse(req.body);
      const item = await storage.updateWorkItem(id, input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.workItems.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
    await storage.deleteWorkItem(id);
    res.status(204).send();
  });

  // Resource Columns
  app.get(api.resourceColumns.list.path, async (req, res) => {
    const columns = await storage.getResourceColumns();
    res.json(columns);
  });

  app.post(api.resourceColumns.create.path, async (req, res) => {
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
      throw err;
    }
  });

  app.delete(api.resourceColumns.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
    await storage.deleteResourceColumn(id);
    res.status(204).send();
  });

  app.post(api.resourceColumns.reorder.path, async (req, res) => {
    const { columnIds } = api.resourceColumns.reorder.input.parse(req.body);
    await storage.reorderResourceColumns(columnIds);
    res.json({ success: true });
  });

  // Resource Constants
  app.post(api.resourceConstants.upsert.path, async (req, res) => {
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
      throw err;
    }
  });

  // Seed if empty
  await seedDatabase();

  return httpServer;
}

// Seed function to add initial data if empty
export async function seedDatabase() {
  const columns = await storage.getResourceColumns();
  if (columns.length === 0) {
    console.log("Seeding database...");
    
    // Add Resources
    const cement = await storage.createResourceColumn({ name: "Cement", unit: "Bags" });
    const sand = await storage.createResourceColumn({ name: "Sand", unit: "m3" });
    const gravel = await storage.createResourceColumn({ name: "Gravel", unit: "m3" });

    // Add Work Items
    const concrete = await storage.createWorkItem({
      serialNumber: "1.1",
      refSs: "SS-203",
      description: "Concrete Class A (1:2:4)",
      unit: "m3",
      quantity: "100"
    });

    const plastering = await storage.createWorkItem({
      serialNumber: "2.1",
      refSs: "SS-305",
      description: "Wall Plastering (1:4)",
      unit: "m2",
      quantity: "500"
    });

    // Add Constants (Values per unit)
    // Concrete 1:2:4 needs ~6.5 bags cement, 0.44 sand, 0.88 gravel per m3 (rough estimates)
    await storage.upsertResourceConstant({ workItemId: concrete.id, resourceColumnId: cement.id, constantValue: "6.5" });
    await storage.upsertResourceConstant({ workItemId: concrete.id, resourceColumnId: sand.id, constantValue: "0.44" });
    await storage.upsertResourceConstant({ workItemId: concrete.id, resourceColumnId: gravel.id, constantValue: "0.88" });

    // Plastering needs cement and sand
    await storage.upsertResourceConstant({ workItemId: plastering.id, resourceColumnId: cement.id, constantValue: "0.15" });
    await storage.upsertResourceConstant({ workItemId: plastering.id, resourceColumnId: sand.id, constantValue: "0.02" });
    
    console.log("Database seeded!");
  }
}
