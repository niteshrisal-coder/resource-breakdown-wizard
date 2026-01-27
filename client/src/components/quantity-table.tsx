import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useWorkItems,
  useResourceColumns,
  useUpsertResourceConstant,
  useUpdateWorkItem,
  useDeleteWorkItem,
  useDeleteResourceColumn,
  useReorderResourceColumns,
} from "@/hooks/use-quantity-data";
import { Trash2, Calculator, AlertCircle, GripHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function SortableHeader({ col, deleteResource }: { col: any; deleteResource: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    position: 'relative' as const,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={`min-w-[140px] text-center border-l border-border/50 bg-primary/5 ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex flex-col items-center justify-center py-1 group relative">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-primary/10 rounded mb-1 touch-none"
        >
          <GripHorizontal className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold text-primary select-none">{col.name}</span>
        <span className="text-xs text-muted-foreground font-normal select-none">({col.unit})</span>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-opacity">
              <Trash2 className="w-3 h-3" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Resource Column?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{col.name}" and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteResource.mutate(col.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TableHead>
  );
}

export function QuantityTable() {
  const { data: workItems, isLoading: isLoadingItems } = useWorkItems();
  const { data: columns, isLoading: isLoadingCols } = useResourceColumns();
  const upsertConstant = useUpsertResourceConstant();
  const updateWorkItem = useUpdateWorkItem();
  const deleteWorkItem = useDeleteWorkItem();
  const deleteResource = useDeleteResourceColumn();
  const reorderResource = useReorderResourceColumns();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && columns) {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over?.id);
      const newOrder = arrayMove(columns, oldIndex, newIndex);
      reorderResource.mutate(newOrder.map((col) => col.id));
    }
  };

  // Local state for inputs to prevent re-rendering entire list on every keystroke
  // We'll commit on blur
  const handleConstantChange = (
    workItemId: number,
    columnId: number,
    newValue: string
  ) => {
    // Only allow valid numbers
    if (newValue && isNaN(Number(newValue))) return;

    upsertConstant.mutate({
      workItemId,
      resourceColumnId: columnId,
      constantValue: newValue || "0",
    });
  };

  const handleWorkItemUpdate = (
    id: number,
    field: "normsBasisQty" | "actualMeasuredQty",
    newValue: string
  ) => {
    if (newValue && isNaN(Number(newValue))) return;
    updateWorkItem.mutate({
      id,
      data: { [field]: newValue || "0" },
    });
  };

  const calculateTotal = (normsBasis: string, actual: string, resourceValue: string | undefined) => {
    const basis = parseFloat(normsBasis) || 1;
    const measured = parseFloat(actual) || 0;
    const value = parseFloat(resourceValue || "0") || 0;
    // Formula: (Resource Value / Norms Basis Qty) * Actual Measured Qty
    return ((value / basis) * measured).toFixed(2);
  };

  if (isLoadingItems || isLoadingCols) {
    return <TableSkeleton />;
  }

  if (!workItems?.length && !columns?.length) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">No data yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mt-2">
          Start by adding a work item or defining resource columns to build your breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/40">
                <TableHead className="w-[80px]">Serial #</TableHead>
                <TableHead className="w-[100px]">Ref SS</TableHead>
                <TableHead className="min-w-[200px] whitespace-normal">Description</TableHead>
                <TableHead className="w-[80px]">Norms Basis</TableHead>
                <TableHead className="w-[100px] text-right">Actual Qty</TableHead>
                
                {/* Dynamic Resource Columns */}
                <SortableContext
                  items={columns?.map((c) => c.id) || []}
                  strategy={horizontalListSortingStrategy}
                >
                  {columns?.map((col) => (
                    <SortableHeader
                      key={col.id}
                      col={col}
                      deleteResource={deleteResource}
                    />
                  ))}
                </SortableContext>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workItems?.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell className="font-medium">{item.serialNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{item.refSs || "-"}</TableCell>
                  <TableCell className="max-w-[300px] whitespace-normal break-words" title={item.description}>
                    {item.description}
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      className="h-8 text-right font-mono text-xs focus:ring-1 focus:ring-primary bg-background shadow-none"
                      defaultValue={item.normsBasisQty}
                      onBlur={(e) => {
                        if (e.target.value !== item.normsBasisQty) {
                          handleWorkItemUpdate(item.id, "normsBasisQty", e.target.value);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      className="h-8 text-right font-mono text-xs focus:ring-1 focus:ring-primary bg-background shadow-none font-medium"
                      defaultValue={item.actualMeasuredQty}
                      onBlur={(e) => {
                        if (e.target.value !== item.actualMeasuredQty) {
                          handleWorkItemUpdate(item.id, "actualMeasuredQty", e.target.value);
                        }
                      }}
                    />
                  </TableCell>

                  {/* Resource Cells */}
                  {columns?.map((col) => {
                    const constant = item.constants.find((c) => c.resourceColumnId === col.id);
                    const val = constant?.constantValue || "";
                    const total = calculateTotal(item.normsBasisQty, item.actualMeasuredQty, val);
                    
                    return (
                      <TableCell key={`${item.id}-${col.id}`} className="border-l border-border/50 p-2 bg-muted/5">
                        <div className="space-y-1">
                          <Tooltip>
                             <TooltipTrigger asChild>
                               <Input
                                 className="h-8 text-right font-mono text-xs focus:ring-1 focus:ring-primary bg-background shadow-none"
                                 placeholder="Const."
                                 defaultValue={val}
                                 onBlur={(e) => {
                                   if (e.target.value !== val) {
                                     handleConstantChange(item.id, col.id, e.target.value);
                                   }
                                 }}
                               />
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>Resource Constant</p>
                             </TooltipContent>
                          </Tooltip>
                          
                          {parseFloat(val) > 0 && (
                             <div className="text-[10px] text-right text-muted-foreground flex justify-end items-center gap-1 font-mono pointer-events-none">
                               <span className="text-primary font-bold">{total}</span>
                               <span>Total</span>
                             </div>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}

                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Work Item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this row? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteWorkItem.mutate(item.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
         <Skeleton className="h-8 w-1/4" />
         <Skeleton className="h-8 w-1/4" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-16" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-24" />
        </div>
      ))}
    </div>
  );
}
