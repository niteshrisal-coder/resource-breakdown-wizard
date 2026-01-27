import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateWorkItem } from "@/hooks/use-quantity-data";
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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Schema for the form
const formSchema = z.object({
  serialNumber: z.string().min(1, "Serial number is required"),
  refSs: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  unit: z.string().min(1, "Unit is required"),
  normsBasisQty: z.coerce.number().min(0.0001, "Norms Basis Qty must be greater than 0"),
  actualMeasuredQty: z.coerce.number().min(0, "Actual Measured Qty cannot be negative"),
});

type FormValues = z.infer<typeof formSchema>;

export function AddWorkItemDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createWorkItem = useCreateWorkItem();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: "",
      refSs: "",
      description: "",
      unit: "m3",
      normsBasisQty: 1,
      actualMeasuredQty: 0,
    },
  });

  const onSubmit = (values: FormValues) => {
    createWorkItem.mutate(
      {
        ...values,
        normsBasisQty: String(values.normsBasisQty),
        actualMeasuredQty: String(values.actualMeasuredQty),
        quantity: String(values.actualMeasuredQty), // For backward compatibility
      },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
          toast({
            title: "Success",
            description: "Work item added successfully",
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
        <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <Plus className="w-4 h-4" />
          Add Work Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Work Item</DialogTitle>
          <DialogDescription>
            Create a new row in your quantity breakdown.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="1.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="refSs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ref SS (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="A-101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Concrete for foundation..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="m3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="normsBasisQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Norms Basis Qty</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="1.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="actualMeasuredQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Measured Qty</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
              <Button type="submit" disabled={createWorkItem.isPending}>
                {createWorkItem.isPending ? "Creating..." : "Create Work Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
