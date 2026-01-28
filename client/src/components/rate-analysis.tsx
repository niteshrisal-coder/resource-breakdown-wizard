import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface RateItem {
  id: string;
  name: string;
  category: string;
  rateExclVat: string;
  vat: string;
  porterCost: string;
  metalledCost: string;
  graveledCost: string;
  loadUnload: string;
  unitWeight: string;
}

const CATEGORIES = [
  { value: "1", label: "Easy (1)" },
  { value: "2", label: "Difficult (2)" },
  { value: "3", label: "Very Difficult (3)" },
  { value: "4", label: "High Volume (4)" },
];

export function RateAnalysis() {
  const [transportMode, setTransportMode] = useState<string>(() => {
    return localStorage.getItem("rate_transport_mode") || "Truck";
  });

  const handleTransportModeChange = (mode: string) => {
    setTransportMode(mode);
    if (mode === "Tractor") {
      setGraveledCoeff("0.074");
      setMetalledCoeff("0.075");
    }
  };
  const [metalledDist, setMetalledDist] = useState<string>(() => {
    return localStorage.getItem("rate_metalled_dist") || "0";
  });
  const [graveledDist, setGraveledDist] = useState<string>(() => {
    return localStorage.getItem("rate_graveled_dist") || "0";
  });
  const [porterLead, setPorterLead] = useState<string>(() => {
    return localStorage.getItem("rate_porter_lead") || "0";
  });

  const [porterCoeff, setPorterCoeff] = useState<string>(() => {
    return localStorage.getItem("rate_porter_coeff") || "1.0";
  });
  const [metalledCoeff, setMetalledCoeff] = useState<string>(() => {
    return localStorage.getItem("rate_metalled_coeff") || "1.0";
  });
  const [graveledCoeff, setGraveledCoeff] = useState<string>(() => {
    return localStorage.getItem("rate_graveled_coeff") || "1.0";
  });

  const [easyCoeff, setEasyCoeff] = useState<string>(() => {
    return localStorage.getItem("rate_easy_coeff") || "1.0";
  });
  const [difficultCoeff, setDifficultCoeff] = useState<string>(() => {
    return localStorage.getItem("rate_difficult_coeff") || "1.5";
  });
  const [veryDifficultCoeff, setVeryDifficultCoeff] = useState<string>(() => {
    return localStorage.getItem("rate_very_difficult_coeff") || "2.0";
  });
  const [highVolumeCoeff, setHighVolumeCoeff] = useState<string>(() => {
    return localStorage.getItem("rate_high_volume_coeff") || "1.2";
  });

  const [items, setItems] = useState<RateItem[]>(() => {
    const saved = localStorage.getItem("rate_analysis_items");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("rate_transport_mode", transportMode);
  }, [transportMode]);

  useEffect(() => {
    localStorage.setItem("rate_metalled_dist", metalledDist);
  }, [metalledDist]);

  useEffect(() => {
    localStorage.setItem("rate_graveled_dist", graveledDist);
  }, [graveledDist]);

  useEffect(() => {
    localStorage.setItem("rate_porter_lead", porterLead);
  }, [porterLead]);

  useEffect(() => {
    localStorage.setItem("rate_porter_coeff", porterCoeff);
  }, [porterCoeff]);

  useEffect(() => {
    localStorage.setItem("rate_metalled_coeff", metalledCoeff);
  }, [metalledCoeff]);

  useEffect(() => {
    localStorage.setItem("rate_graveled_coeff", graveledCoeff);
  }, [graveledCoeff]);

  useEffect(() => {
    localStorage.setItem("rate_easy_coeff", easyCoeff);
  }, [easyCoeff]);

  useEffect(() => {
    localStorage.setItem("rate_difficult_coeff", difficultCoeff);
  }, [difficultCoeff]);

  useEffect(() => {
    localStorage.setItem("rate_very_difficult_coeff", veryDifficultCoeff);
  }, [veryDifficultCoeff]);

  useEffect(() => {
    localStorage.setItem("rate_high_volume_coeff", highVolumeCoeff);
  }, [highVolumeCoeff]);

  useEffect(() => {
    localStorage.setItem("rate_analysis_items", JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    const newItem: RateItem = {
      id: crypto.randomUUID(),
      name: "",
      category: "1",
      rateExclVat: "0",
      vat: "13",
      porterCost: "0",
      metalledCost: "0",
      graveledCost: "0",
      loadUnload: "0",
      unitWeight: "0",
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof RateItem, value: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const calculateTotal = (item: RateItem) => {
    const rate = parseFloat(item.rateExclVat) || 0;
    const vat = parseFloat(item.vat) || 0;
    
    let categoryCoeff = 1.0;
    if (item.category === "1") categoryCoeff = parseFloat(easyCoeff) || 1.0;
    else if (item.category === "2") categoryCoeff = parseFloat(difficultCoeff) || 1.0;
    else if (item.category === "3") categoryCoeff = parseFloat(veryDifficultCoeff) || 1.0;
    else if (item.category === "4") categoryCoeff = parseFloat(highVolumeCoeff) || 1.0;

    const porter = (parseFloat(item.porterCost) || 0) * (parseFloat(porterCoeff) || 1) * categoryCoeff;
    const metalled = (parseFloat(item.metalledCost) || 0) * (parseFloat(metalledCoeff) || 1) * categoryCoeff;
    const graveled = (parseFloat(item.graveledCost) || 0) * (parseFloat(graveledCoeff) || 1) * categoryCoeff;
    const loadUnload = parseFloat(item.loadUnload) || 0;
    
    const vatAmount = (rate * vat) / 100;
    return (rate + vatAmount + porter + metalled + graveled + loadUnload).toFixed(2);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Transportation & Logistics Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transport-mode">Mode of Transport</Label>
              <Select value={transportMode} onValueChange={handleTransportModeChange}>
                <SelectTrigger id="transport-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="Tractor">Tractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="metalled-dist">Metalled Road (KM)</Label>
              <div className="flex gap-2">
                <Input
                  id="metalled-dist"
                  type="number"
                  value={metalledDist}
                  onChange={(e) => setMetalledDist(e.target.value)}
                  className="flex-1"
                />
                {transportMode === "Truck" && (
                  <div className="flex items-center px-3 bg-muted rounded-md text-xs font-mono whitespace-nowrap border">
                    {(Number(metalledDist) / 3.22).toFixed(2)} Kosh
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="graveled-dist">Graveled Road (KM)</Label>
              <div className="flex gap-2">
                <Input
                  id="graveled-dist"
                  type="number"
                  value={graveledDist}
                  onChange={(e) => setGraveledDist(e.target.value)}
                  className="flex-1"
                />
                {transportMode === "Truck" && (
                  <div className="flex items-center px-3 bg-muted rounded-md text-xs font-mono whitespace-nowrap border">
                    {(Number(graveledDist) / 3.22).toFixed(2)} Kosh
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="porter-lead">Porter Lead (KM)</Label>
              <Input
                id="porter-lead"
                type="number"
                value={porterLead}
                onChange={(e) => setPorterLead(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="easy-coeff">Easy (1)</Label>
              <Input
                id="easy-coeff"
                type="number"
                step="0.1"
                value={easyCoeff}
                onChange={(e) => setEasyCoeff(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficult-coeff">Difficult (2)</Label>
              <Input
                id="difficult-coeff"
                type="number"
                step="0.1"
                value={difficultCoeff}
                onChange={(e) => setDifficultCoeff(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="very-difficult-coeff">Very Difficult (3)</Label>
              <Input
                id="very-difficult-coeff"
                type="number"
                step="0.1"
                value={veryDifficultCoeff}
                onChange={(e) => setVeryDifficultCoeff(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="high-volume-coeff">High Volume (4)</Label>
              <Input
                id="high-volume-coeff"
                type="number"
                step="0.1"
                value={highVolumeCoeff}
                onChange={(e) => setHighVolumeCoeff(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="porter-coeff">Porter Coefficient</Label>
              <Input
                id="porter-coeff"
                type="number"
                step="0.1"
                value={porterCoeff}
                onChange={(e) => setPorterCoeff(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metalled-coeff">Metalled Coefficient</Label>
              <Input
                id="metalled-coeff"
                type="number"
                step="0.1"
                value={metalledCoeff}
                onChange={(e) => setMetalledCoeff(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="graveled-coeff">Graveled Coefficient</Label>
              <Input
                id="graveled-coeff"
                type="number"
                step="0.1"
                value={graveledCoeff}
                onChange={(e) => setGraveledCoeff(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Material Rate Analysis</CardTitle>
          <Button size="sm" onClick={addItem} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Material
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">S.No</TableHead>
                  <TableHead className="min-w-[150px]">Material Name</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead className="w-[100px]">Rate (Excl)</TableHead>
                  <TableHead className="w-[80px]">VAT %</TableHead>
                  <TableHead className="w-[100px]">Porter</TableHead>
                  <TableHead className="w-[100px]">Metalled</TableHead>
                  <TableHead className="w-[100px]">Graveled</TableHead>
                  <TableHead className="w-[100px]">L/UL</TableHead>
                  <TableHead className="w-[100px]">Weight (KG)</TableHead>
                  <TableHead className="w-[100px] text-right">Total Rate</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                      No materials added yet. Click "Add Material" to begin.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                      <TableCell className="p-1">
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(item.id, "name", e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Name"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Select
                          value={item.category}
                          onValueChange={(val) => updateItem(item.id, "category", val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.rateExclVat}
                          onChange={(e) => updateItem(item.id, "rateExclVat", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.vat}
                          onChange={(e) => updateItem(item.id, "vat", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.porterCost}
                          onChange={(e) => updateItem(item.id, "porterCost", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.metalledCost}
                          onChange={(e) => updateItem(item.id, "metalledCost", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.graveledCost}
                          onChange={(e) => updateItem(item.id, "graveledCost", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.loadUnload}
                          onChange={(e) => updateItem(item.id, "loadUnload", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.unitWeight}
                          onChange={(e) => updateItem(item.id, "unitWeight", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-primary">
                        {calculateTotal(item)}
                      </TableCell>
                      <TableCell className="p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
