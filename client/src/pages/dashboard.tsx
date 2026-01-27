import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkItems, useResourceColumns } from "@/hooks/use-quantity-data";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutShell } from "@/components/layout-shell";
import { QuantityTable } from "@/components/quantity-table";
import { AddWorkItemDialog } from "@/components/add-work-item-dialog";
import { AddResourceDialog } from "@/components/add-resource-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Calculator, BarChart3 } from "lucide-react";
import Papa from "papaparse";

function RateAnalysisComponent() {
  const { data: resources, isLoading } = useResourceColumns();
  const [modeOfTransport, setModeOfTransport] = useState<string>("");
  const [distances, setDistances] = useState<{
    metalled: number;
    gravelled: number;
    porter: number;
  }>({
    metalled: 0,
    gravelled: 0,
    porter: 0
  });

  const handleDistanceChange = (field: 'metalled' | 'gravelled' | 'porter', value: string) => {
    setDistances(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading resources...</div>;
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">
          No resources found. Please add resources in the Quantity Breakdown tab first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode of Transport Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Mode of Transport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Transport Mode</label>
                <Select value={modeOfTransport} onValueChange={setModeOfTransport}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select transport mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tractor">Tractor</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Distance Table */}
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Distance Type</TableHead>
                    <TableHead>Value (km)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Metalled Distance</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={distances.metalled || ''}
                        onChange={(e) => handleDistanceChange('metalled', e.target.value)}
                        className="max-w-[120px]"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Gravelled Distance</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={distances.gravelled || ''}
                        onChange={(e) => handleDistanceChange('gravelled', e.target.value)}
                        className="max-w-[120px]"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Porter Distance</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={distances.porter || ''}
                        onChange={(e) => handleDistanceChange('porter', e.target.value)}
                        className="max-w-[120px]"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Rate Analysis Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Resource Rate Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Material Name</TableHead>
                <TableHead>Unit Rate</TableHead>
                <TableHead>Logistics Rate</TableHead>
                <TableHead className="text-right">Total Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">
                    {resource.name}
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="max-w-[120px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="max-w-[120px]"
                    />
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    $0.00
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { data: workItems } = useWorkItems();
  const { data: columns } = useResourceColumns();

  const handleExportCSV = () => {
    if (!workItems || !columns) return;

    const headers = [
      "Serial No",
      "Ref SS",
      "Description",
      "Norms Basis",
      "Actual Qty",
      ...columns.flatMap(c => [`${c.name} (Value)`, `${c.name} (Total)`])
    ];

    const rows = workItems.map(item => {
      const rowData: (string | number)[] = [
        item.serialNumber,
        item.refSs || "",
        item.description,
        item.normsBasisQty,
        item.actualMeasuredQty
      ];

      columns.forEach(col => {
        const constant = item.constants.find(c => c.resourceColumnId === col.id);
        const val = constant ? parseFloat(constant.constantValue) : 0;
        const basis = parseFloat(item.normsBasisQty) || 1;
        const actual = parseFloat(item.actualMeasuredQty) || 0;
        const total = (val / basis) * actual;

        rowData.push(val || 0);
        rowData.push(total.toFixed(2));
      });
      return rowData;
    });

    const csv = Papa.unparse({
      fields: headers,
      data: rows
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Quantity_Breakdown.csv");
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Quantity & Rate System
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage work items, resources, and logistics rates.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportCSV}
              disabled={!workItems?.length}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <AddResourceDialog />
            <AddWorkItemDialog />
          </div>
        </div>
        <Tabs defaultValue="quantity" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="quantity" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Quantity Breakdown
            </TabsTrigger>
            <TabsTrigger value="rate" className="gap-2">
              <Calculator className="w-4 h-4" />
              Rate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quantity" className="mt-6">
            <QuantityTable />
          </TabsContent>

          <TabsContent value="rate" className="mt-6">
            <RateAnalysisComponent />
          </TabsContent>
        </Tabs>
      </div>
    </LayoutShell>
  );
}
