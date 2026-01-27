import { db } from "./db";
import {
  workItems,
  resourceColumns,
  resourceConstants,
  type WorkItem,
  type InsertWorkItem,
  type ResourceColumn,
  type InsertResourceColumn,
  type ResourceConstant,
  type InsertResourceConstant,
  type WorkItemWithConstants
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Work Items
  getWorkItems(): Promise<WorkItemWithConstants[]>;
  createWorkItem(item: InsertWorkItem): Promise<WorkItem>;
  updateWorkItem(id: number, updates: Partial<InsertWorkItem>): Promise<WorkItem>;
  deleteWorkItem(id: number): Promise<void>;

  // Resource Columns
  getResourceColumns(): Promise<ResourceColumn[]>;
  createResourceColumn(column: InsertResourceColumn): Promise<ResourceColumn>;
  deleteResourceColumn(id: number): Promise<void>;
  reorderResourceColumns(columnIds: number[]): Promise<void>;

  // Resource Constants
  upsertResourceConstant(constant: InsertResourceConstant): Promise<ResourceConstant>;
}

export class DatabaseStorage implements IStorage {
  async getWorkItems(): Promise<WorkItemWithConstants[]> {
    return await db.query.workItems.findMany({
      with: {
        constants: true
      },
      orderBy: (workItems, { asc }) => [asc(workItems.id)]
    });
  }

  async createWorkItem(item: InsertWorkItem): Promise<WorkItem> {
    const [newItem] = await db.insert(workItems).values(item).returning();
    return newItem;
  }

  async updateWorkItem(id: number, updates: Partial<InsertWorkItem>): Promise<WorkItem> {
    const [updatedItem] = await db.update(workItems)
      .set(updates)
      .where(eq(workItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteWorkItem(id: number): Promise<void> {
    await db.delete(workItems).where(eq(workItems.id, id));
  }

  async getResourceColumns(): Promise<ResourceColumn[]> {
    return await db.select().from(resourceColumns).orderBy(resourceColumns.order, resourceColumns.id);
  }

  async createResourceColumn(column: InsertResourceColumn): Promise<ResourceColumn> {
    const [newColumn] = await db.insert(resourceColumns).values(column).returning();
    return newColumn;
  }

  async deleteResourceColumn(id: number): Promise<void> {
    await db.delete(resourceColumns).where(eq(resourceColumns.id, id));
  }

  async reorderResourceColumns(columnIds: number[]): Promise<void> {
    await Promise.all(
      columnIds.map((id, index) =>
        db.update(resourceColumns)
          .set({ order: index })
          .where(eq(resourceColumns.id, id))
      )
    );
  }

  async upsertResourceConstant(constant: InsertResourceConstant): Promise<ResourceConstant> {
    // Check if it exists
    const existing = await db.select().from(resourceConstants).where(
      and(
        eq(resourceConstants.workItemId, constant.workItemId),
        eq(resourceConstants.resourceColumnId, constant.resourceColumnId)
      )
    );

    if (existing.length > 0) {
      const [updated] = await db.update(resourceConstants)
        .set({ constantValue: constant.constantValue })
        .where(eq(resourceConstants.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(resourceConstants)
        .values(constant)
        .returning();
      return inserted;
    }
  }
}

export const storage = new DatabaseStorage();
