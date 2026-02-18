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
        
        {/* EDIT BUTTON - Add this section */}
        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <EditResourceDialog resource={col} />
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        {/* END EDIT BUTTON SECTION */}
      </div>
    </TableHead>
  );
}
