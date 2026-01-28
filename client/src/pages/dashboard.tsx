import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkItems, useResourceColumns } from "@/hooks/use-quantity-data";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    porter: 0,
  });

  const [ratesData, setRatesData] = useState<
    Record<
      string,
      {
        category?: string;
        rateExcl?: number;
        porterCost?: number;
        metalledCost?: number;
        gravelledCost?: number;
        loadUnload?: number;
        unitWeight?: number;
      }
    >
  >({});

  const handleRateFieldChange = (
    resourceId: string,
    field: string,
    value: string,
  ) => {
    const num = parseFloat(value);
    setRatesData((prev) => ({
      ...prev,
      [resourceId]: {
        ...(prev[resourceId] || {}),
        [field]: Number.isNaN(num) ? 0 : num,
      },
    }));
  };

  const handleCategoryChange = (resourceId: string, value: string) => {
    setRatesData((prev) => ({
      ...prev,
      [resourceId]: {
        ...(prev[resourceId] || {}),
        category: value,
      },
    }));
    // If truck mode, assign coefficients immediately
    if (modeOfTransport === "truck") {
      const coeffs: Record<string, { metalled: number; gravelled: number }> = {
        "1": { metalled: 0.02, gravelled: 0.049 },
        "2": { metalled: 0.02, gravelled: 0.063 },
        "3": { metalled: 0.022, gravelled: 0.063 },
        "4": { metalled: 0.022, gravelled: 0.025 },
      };
      const c = coeffs[value];
      if (c) {
        setRatesData((prev) => ({
          ...prev,
          [resourceId]: {
            ...(prev[resourceId] || {}),
            metalledCost: c.metalled,
            gravelledCost: c.gravelled,
          },
        }));
      }
    } else if (modeOfTransport === "tractor") {
      // For tractor, same coefficients for all categories
      const metalled = 0.074;
      const gravelled = 0.075;
      setRatesData((prev) => ({
        ...prev,
        [resourceId]: {
          ...(prev[resourceId] || {}),
          metalledCost: metalled,
          gravelledCost: gravelled,
        },
      }));
    }
  };

  // When transport mode changes to truck, apply coefficients to all resources with category
  useEffect(() => {
    if (modeOfTransport !== "truck" && modeOfTransport !== "tractor") return;
    // Define coefficient tables per transport mode
    const truckCoeffs: Record<string, { metalled: number; gravelled: number }> =
      {
        "1": { metalled: 0.02, gravelled: 0.049 },
        "2": { metalled: 0.02, gravelled: 0.063 },
        "3": { metalled: 0.022, gravelled: 0.063 },
        "4": { metalled: 0.022, gravelled: 0.025 },
      };
    const tractorCoeffs: Record<
      string,
      { metalled: number; gravelled: number }
    > = {
      "1": { metalled: 0.074, gravelled: 0.075 },
      "2": { metalled: 0.074, gravelled: 0.075 },
      "3": { metalled: 0.074, gravelled: 0.075 },
      "4": { metalled: 0.074, gravelled: 0.075 },
    };

    setRatesData((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const cat = next[id].category;
        if (!cat) return;
        if (modeOfTransport === "truck" && truckCoeffs[cat]) {
          next[id] = {
            ...next[id],
            metalledCost: truckCoeffs[cat].metalled,
            gravelledCost: truckCoeffs[cat].gravelled,
          };
        } else if (modeOfTransport === "tractor" && tractorCoeffs[cat]) {
          next[id] = {
            ...next[id],
            metalledCost: tractorCoeffs[cat].metalled,
            gravelledCost: tractorCoeffs[cat].gravelled,
          };
        }
      });
      return next;
    });
  }, [modeOfTransport]);

  const calculateLandedRate = (resourceId: string) => {
    const d = ratesData[resourceId] || {};
    const rate = d.rateExcl || 0;
    const vat = rate * 0.13;
    const porter = d.porterCost || 0;
    const metalled = d.metalledCost || 0;
    const gravelled = d.gravelledCost || 0;
    const load = d.loadUnload || 0;
    return rate + vat + porter + metalled + gravelled + load;
  };

  const handleDistanceChange = (
    field: "metalled" | "gravelled" | "porter",
    value: string,
  ) => {
    setDistances((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const convertToKosh = (kmValue: number): number => {
    return kmValue / 3.22;
  };

  const getDisplayDistance = (kmValue: number): string => {
    if (modeOfTransport === "truck") {
      return convertToKosh(kmValue).toFixed(2);
    }
    return kmValue.toFixed(2);
  };

  const getDistanceUnit = (): string => {
    return modeOfTransport === "truck" ? "kosh" : "km";
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading resources...</div>;
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">
          No resources found. Please add resources in the Quantity Breakdown tab
          first.
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
                <label className="text-sm font-medium mb-2 block">
                  Transport Mode
                </label>
                <Select
                  value={modeOfTransport}
                  onValueChange={setModeOfTransport}
                >
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
                    <TableHead>Converted Value ({getDistanceUnit()})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Metalled Distance
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={distances.metalled || ""}
                        onChange={(e) =>
                          handleDistanceChange("metalled", e.target.value)
                        }
                        className="max-w-[120px]"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {getDisplayDistance(distances.metalled)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Gravelled Distance
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={distances.gravelled || ""}
                        onChange={(e) =>
                          handleDistanceChange("gravelled", e.target.value)
                        }
                        className="max-w-[120px]"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {getDisplayDistance(distances.gravelled)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Porter Distance
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={distances.porter || ""}
                        onChange={(e) =>
                          handleDistanceChange("porter", e.target.value)
                        }
                        className="max-w-[120px]"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {getDisplayDistance(distances.porter)}
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
                <TableHead className="w-[60px]">S.No</TableHead>
                <TableHead className="w-[300px]">Material Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rate (Excl. VAT)</TableHead>
                <TableHead>VAT (13%)</TableHead>
                <TableHead>Porter Cost</TableHead>
                <TableHead>Metalled Cost</TableHead>
                <TableHead>Gravelled Cost</TableHead>
                <TableHead>Load/Unload</TableHead>
                <TableHead>Unit Weight (KG)</TableHead>
                <TableHead className="text-right">
                  Landed Rate (Total)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource, idx) => (
                <TableRow key={resource.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">{resource.name}</TableCell>
                  <TableCell>
                    <Select
                      value={ratesData[resource.id]?.category || ""}
                      onValueChange={(val) =>
                        handleCategoryChange(resource.id, val)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Easy (1)</SelectItem>
                        <SelectItem value="2">Difficult (2)</SelectItem>
                        <SelectItem value="3">Very Difficult (3)</SelectItem>
                        <SelectItem value="4">High Volume (4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={ratesData[resource.id]?.rateExcl ?? ""}
                      onChange={(e) =>
                        handleRateFieldChange(
                          resource.id,
                          "rateExcl",
                          e.target.value,
                        )
                      }
                      className="max-w-[120px]"
                    />
                  </TableCell>
                  <TableCell>
                    {((ratesData[resource.id]?.rateExcl || 0) * 0.13).toFixed(
                      2,
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={ratesData[resource.id]?.porterCost ?? ""}
                      onChange={(e) =>
                        handleRateFieldChange(
                          resource.id,
                          "porterCost",
                          e.target.value,
                        )
                      }
                      className="max-w-[120px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={ratesData[resource.id]?.metalledCost ?? ""}
                      onChange={(e) =>
                        handleRateFieldChange(
                          resource.id,
                          "metalledCost",
                          e.target.value,
                        )
                      }
                      className="max-w-[120px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={ratesData[resource.id]?.gravelledCost ?? ""}
                      onChange={(e) =>
                        handleRateFieldChange(
                          resource.id,
                          "gravelledCost",
                          e.target.value,
                        )
                      }
                      className="max-w-[120px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={ratesData[resource.id]?.loadUnload ?? ""}
                      onChange={(e) =>
                        handleRateFieldChange(
                          resource.id,
                          "loadUnload",
                          e.target.value,
                        )
                      }
                      className="max-w-[120px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={ratesData[resource.id]?.unitWeight ?? ""}
                      onChange={(e) =>
                        handleRateFieldChange(
                          resource.id,
                          "unitWeight",
                          e.target.value,
                        )
                      }
                      className="max-w-[120px]"
                    />
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {calculateLandedRate(resource.id).toFixed(2)}
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
      ...columns.flatMap((c) => [`${c.name} (Value)`, `${c.name} (Total)`]),
    ];

    const rows = workItems.map((item) => {
      const rowData: (string | number)[] = [
        item.serialNumber,
        item.refSs || "",
        item.description,
        item.normsBasisQty,
        item.actualMeasuredQty,
      ];

      columns.forEach((col) => {
        const constant = item.constants.find(
          (c) => c.resourceColumnId === col.id,
        );
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
      data: rows,
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
