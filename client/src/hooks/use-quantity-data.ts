import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertWorkItem, type InsertResourceColumn, type InsertResourceConstant } from "@shared/schema";
import { z } from "zod";

// --- Work Items Hooks ---

export function useWorkItems() {
  return useQuery({
    queryKey: [api.workItems.list.path],
    queryFn: async () => {
      const res = await fetch(api.workItems.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch work items");
      return api.workItems.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWorkItem) => {
      // Ensure numeric fields are numbers (input="number" returns strings sometimes)
      const payload = {
        ...data,
        quantity: String(data.quantity) // API schema expects numeric string for precision or number? Schema says numeric which is usually string in JS to preserve precision, but Zod might want number.
        // Checking schema: quantity is numeric in pg, z.infer types it as string usually for drizzle-zod unless configured.
        // Let's coerce in form.
      };

      const validated = api.workItems.create.input.parse(payload);
      
      const res = await fetch(api.workItems.create.path, {
        method: api.workItems.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
           // Try to parse error
           try {
             const error = api.workItems.create.responses[400].parse(await res.json());
             throw new Error(error.message);
           } catch {
             throw new Error("Validation failed");
           }
        }
        throw new Error("Failed to create work item");
      }
      return api.workItems.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.workItems.list.path] }),
  });
}

export function useUpdateWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertWorkItem> }) => {
      const url = buildUrl(api.workItems.update.path, { id });
      const res = await fetch(url, {
        method: api.workItems.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update work item");
      return api.workItems.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.workItems.list.path] }),
  });
}

export function useDeleteWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.workItems.delete.path, { id });
      const res = await fetch(url, { method: api.workItems.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete work item");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.workItems.list.path] }),
  });
}

// --- Resource Columns Hooks ---

export function useResourceColumns() {
  return useQuery({
    queryKey: [api.resourceColumns.list.path],
    queryFn: async () => {
      const res = await fetch(api.resourceColumns.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch resource columns");
      return api.resourceColumns.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateResourceColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertResourceColumn) => {
      const validated = api.resourceColumns.create.input.parse(data);
      const res = await fetch(api.resourceColumns.create.path, {
        method: api.resourceColumns.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create resource column");
      return api.resourceColumns.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.resourceColumns.list.path] }),
  });
}

export function useDeleteResourceColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.resourceColumns.delete.path, { id });
      const res = await fetch(url, { method: api.resourceColumns.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete resource column");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.resourceColumns.list.path] }),
  });
}

export function useReorderResourceColumns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (columnIds: number[]) => {
      const res = await fetch(api.resourceColumns.reorder.path, {
        method: api.resourceColumns.reorder.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnIds }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reorder columns");
      return api.resourceColumns.reorder.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.resourceColumns.list.path] }),
  });
}

// --- Resource Constants Hooks ---

export function useUpsertResourceConstant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertResourceConstant) => {
      // Coerce constantValue to string if it's a number, as numeric usually expects string in json
      const payload = {
        ...data,
        constantValue: String(data.constantValue)
      };
      const validated = api.resourceConstants.upsert.input.parse(payload);
      
      const res = await fetch(api.resourceConstants.upsert.path, {
        method: api.resourceConstants.upsert.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save constant");
      return api.resourceConstants.upsert.responses[200].parse(await res.json());
    },
    // Optimistic updates are great, but invalidating lists ensures consistency
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.workItems.list.path] }),
  });
}
