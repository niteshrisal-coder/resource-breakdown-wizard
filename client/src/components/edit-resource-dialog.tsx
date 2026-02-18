import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateResourceColumn } from "@/hooks/use-quantity-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Resource name is required"),
  unit: z.string().min(1, "Unit is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditResourceDialogProps {
  resource: {
    id: number;
    name: string;
    unit: string;
  };
}

export function EditResourceDialog({ resource }: EditResourceDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const updateResource = useUpdateResourceColumn();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: resource.name,
      unit: resource.unit,
    },
  });

  const onSubmit = (values: FormValues) => {
    updateResource.mutate(
      { id: resource.id, ...values },
      {
        onSuccess: () => {
          setOpen(false);
          toast({
            title: "Success",
            description: `Resource column "${values.name}" updated successfully`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Edit resource column"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Resource Column</DialogTitle>
          <DialogDescription>
            Update the name or unit for this resource column.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Cement, Sand, Labor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measure</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Bags, m3, Hours" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateResource.isPending}>
                {updateResource.isPending ? "Updating..." : "Update Column"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
