import { pgTable, text, serial, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// The rows: Construction work items
export const workItems = pgTable("work_items", {
  id: serial("id").primaryKey(),
  serialNumber: text("serial_number").notNull(),
  refSs: text("ref_ss"), // Reference to SS
  description: text("description").notNull(),
  unit: text("unit").notNull(), // Work unit (e.g., m3)
  normsBasisQty: numeric("norms_basis_qty").notNull().default("1"), // Norms Basis Qty
  actualMeasuredQty: numeric("actual_measured_qty").notNull().default("0"), // Actual Measured Qty
  quantity: numeric("quantity").notNull().default("0"), // Keep for legacy if needed, but we use actualMeasuredQty now
});

// The dynamic columns: Resources like Cement, Sand, etc.
export const resourceColumns = pgTable("resource_columns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g. "Cement"
  unit: text("unit").notNull(), // e.g. "Bags"
  order: integer("order").notNull().default(0),
});

// The cells: The constant value for a specific resource on a specific work item
export const resourceConstants = pgTable("resource_constants", {
  id: serial("id").primaryKey(),
  workItemId: integer("work_item_id").references(() => workItems.id, { onDelete: 'cascade' }).notNull(),
  resourceColumnId: integer("resource_column_id").references(() => resourceColumns.id, { onDelete: 'cascade' }).notNull(),
  constantValue: numeric("constant_value").notNull(), // This is the "Resource Value"
});

// Relations
export const workItemsRelations = relations(workItems, ({ many }) => ({
  constants: many(resourceConstants),
}));

export const resourceColumnsRelations = relations(resourceColumns, ({ many }) => ({
  constants: many(resourceConstants),
}));

export const resourceConstantsRelations = relations(resourceConstants, ({ one }) => ({
  workItem: one(workItems, {
    fields: [resourceConstants.workItemId],
    references: [workItems.id],
  }),
  resourceColumn: one(resourceColumns, {
    fields: [resourceConstants.resourceColumnId],
    references: [resourceColumns.id],
  }),
}));

// Schemas
export const insertWorkItemSchema = createInsertSchema(workItems).omit({ id: true });
export const insertResourceColumnSchema = createInsertSchema(resourceColumns).omit({ id: true });
export const insertResourceConstantSchema = createInsertSchema(resourceConstants).omit({ id: true });

// Types
export type WorkItem = typeof workItems.$inferSelect;
export type InsertWorkItem = z.infer<typeof insertWorkItemSchema>;
export type ResourceColumn = typeof resourceColumns.$inferSelect;
export type InsertResourceColumn = z.infer<typeof insertResourceColumnSchema>;
export type ResourceConstant = typeof resourceConstants.$inferSelect;
export type InsertResourceConstant = z.infer<typeof insertResourceConstantSchema>;

// Composite type for API response (Work Item with its constants)
export type WorkItemWithConstants = WorkItem & {
  constants: ResourceConstant[];
};
