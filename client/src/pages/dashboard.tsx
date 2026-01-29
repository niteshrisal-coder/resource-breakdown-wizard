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
import {
  Download,
  Calculator,
  BarChart3,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Save,
} from "lucide-react";
import Papa from "papaparse";

interface EstimateRow {
  id: string;
  serialNo: string | number;
  description: string;
  unit: string;
  length: string | number;
  breadth: string | number;
  height: string | number;
  nos: string | number;
  quantity: string | number;
  remarks: string;
  isMainItem: boolean;
  parentId?: string;
  isExpanded: boolean;
}

interface BOQRow {
  id: string;
  serialNo: string | number;
  description: string;
  unit: string;
  quantity: string | number;
  rate: string | number;
  amount: string | number;
  refToSS: string;
  estimateMainItemId?: string;
}

interface PorterCoefficients {
  easy: number;
  difficult: number;
  veryDifficult: number;
  highVolume: number;
}

interface TransportCoefficients {
  easy: number;
  difficult: number;
  veryDifficult: number;
  highVolume: number;
}

interface Distances {
  metalled: number;
  gravelled: number;
  porter: number;
}

interface RatesDataItem {
  category?: string;
  rateExcl?: number;
  porterCost?: number;
  metalledCost?: number;
  gravelledCost?: number;
  loadUnload?: number;
  unitWeight?: number;
  isVatable?: boolean;
}

const STORAGE_KEYS = {
  PORTER_COEFFICIENTS: "porterCoefficients",
  TRANSPORT_MODE: "modeOfTransport",
  DISTANCES: "distances",
  RATES_DATA: "ratesData",
  METALLED_COEFFICIENTS: "metalledCoefficients",
  GRAVELLED_COEFFICIENTS: "gravelledCoefficients",
  ESTIMATE_ROWS: "estimateRows",
  BOQ_ROWS: "boqRows",
};

// Helper functions for localStorage
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage: ${key}`, error);
  }
};

const getFromLocalStorage = (key: string, defaultValue: any) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return defaultValue;
  }
};

// Conversion function: km to kosh (1 kosh = 3.22 km)
const kmToKosh = (km: number): number => {
  return km / 3.22;
};

// Conversion function: kosh to km
const koshToKm = (kosh: number): number => {
  return kosh * 3.22;
};

function RateAnalysisComponent() {
  const { data: resources, isLoading } = useResourceColumns();
  const [modeOfTransport, setModeOfTransport] = useState<string>(() =>
    getFromLocalStorage(STORAGE_KEYS.TRANSPORT_MODE, ""),
  );

  const [distances, setDistances] = useState<Distances>(() =>
    getFromLocalStorage(STORAGE_KEYS.DISTANCES, {
      metalled: 0,
      gravelled: 0,
      porter: 0,
    }),
  );

  const [porterCoefficients, setPorterCoefficients] =
    useState<PorterCoefficients>(() =>
      getFromLocalStorage(STORAGE_KEYS.PORTER_COEFFICIENTS, {
        easy: 2.5,
        difficult: 3.6,
        veryDifficult: 6.1,
        highVolume: 4.9,
      }),
    );

  const [metalledCoefficients, setMetalledCoefficients] =
    useState<TransportCoefficients>(() =>
      getFromLocalStorage(STORAGE_KEYS.METALLED_COEFFICIENTS, {
        easy: 0.02,
        difficult: 0.02,
        veryDifficult: 0.022,
        highVolume: 0.022,
      }),
    );

  const [gravelledCoefficients, setGravelledCoefficients] =
    useState<TransportCoefficients>(() =>
      getFromLocalStorage(STORAGE_KEYS.GRAVELLED_COEFFICIENTS, {
        easy: 0.049,
        difficult: 0.063,
        veryDifficult: 0.063,
        highVolume: 0.025,
      }),
    );

  const [ratesData, setRatesData] = useState<Record<string, RatesDataItem>>(
    () => getFromLocalStorage(STORAGE_KEYS.RATES_DATA, {}),
  );

  const [saveStatus, setSaveStatus] = useState<string>("");

  // Auto-save porter coefficients
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.PORTER_COEFFICIENTS, porterCoefficients);
    setSaveStatus("✓ Saved");
    setTimeout(() => setSaveStatus(""), 2000);
  }, [porterCoefficients]);

  // Auto-save metalled coefficients
  useEffect(() => {
    saveToLocalStorage(
      STORAGE_KEYS.METALLED_COEFFICIENTS,
      metalledCoefficients,
    );
    setSaveStatus("✓ Saved");
    setTimeout(() => setSaveStatus(""), 2000);
  }, [metalledCoefficients]);

  // Auto-save gravelled coefficients
  useEffect(() => {
    saveToLocalStorage(
      STORAGE_KEYS.GRAVELLED_COEFFICIENTS,
      gravelledCoefficients,
    );
    setSaveStatus("✓ Saved");
    setTimeout(() => setSaveStatus(""), 2000);
  }, [gravelledCoefficients]);

  // Auto-save transport mode
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.TRANSPORT_MODE, modeOfTransport);
  }, [modeOfTransport]);

  // Auto-save distances
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.DISTANCES, distances);
  }, [distances]);

  // Auto-save rates data
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.RATES_DATA, ratesData);
  }, [ratesData]);

  const handleRateFieldChange = (
    resourceId: string,
    field: string,
    value: string,
  ) => {
    const num = parseFloat(value);
    setRatesData((prev) => {
      const updated = {
        ...prev,
        [resourceId]: {
          ...(prev[resourceId] || {}),
          [field]: Number.isNaN(num) ? 0 : num,
        },
      };

      // Auto-calculate costs if unitWeight changes
      if (field === "unitWeight") {
        const category = updated[resourceId].category || "1";
        const porterCoeff = getPorterCoefficient(category);
        const metalledCoeff = getMetalledCoefficient(category);
        const gravelledCoeff = getGravelledCoefficient(category);
        const unitWeight = Number.isNaN(num) ? 0 : num;

        // Porter: uses km directly
        updated[resourceId].porterCost =
          porterCoeff * (distances.porter || 0) * unitWeight;

        // Metalled & Gravelled: convert km to kosh first
        const metalledDistanceKosh = kmToKosh(distances.metalled || 0);
        const gravelledDistanceKosh = kmToKosh(distances.gravelled || 0);
        updated[resourceId].metalledCost =
          metalledCoeff * metalledDistanceKosh * unitWeight;
        updated[resourceId].gravelledCost =
          gravelledCoeff * gravelledDistanceKosh * unitWeight;
      }

      return updated;
    });
  };

  const handleVatToggle = (resourceId: string) => {
    setRatesData((prev) => ({
      ...prev,
      [resourceId]: {
        ...(prev[resourceId] || {}),
        isVatable: !(prev[resourceId]?.isVatable ?? false),
      },
    }));
  };

  const getPorterCoefficient = (category: string): number => {
    switch (category) {
      case "1":
        return porterCoefficients.easy;
      case "2":
        return porterCoefficients.difficult;
      case "3":
        return porterCoefficients.veryDifficult;
      case "4":
        return porterCoefficients.highVolume;
      default:
        return 0;
    }
  };

  const getMetalledCoefficient = (category: string): number => {
    switch (category) {
      case "1":
        return metalledCoefficients.easy;
      case "2":
        return metalledCoefficients.difficult;
      case "3":
        return metalledCoefficients.veryDifficult;
      case "4":
        return metalledCoefficients.highVolume;
      default:
        return 0;
    }
  };

  const getGravelledCoefficient = (category: string): number => {
    switch (category) {
      case "1":
        return gravelledCoefficients.easy;
      case "2":
        return gravelledCoefficients.difficult;
      case "3":
        return gravelledCoefficients.veryDifficult;
      case "4":
        return gravelledCoefficients.highVolume;
      default:
        return 0;
    }
  };

  const handleCategoryChange = (resourceId: string, value: string) => {
    setRatesData((prev) => {
      const updated = {
        ...prev,
        [resourceId]: {
          ...(prev[resourceId] || {}),
          category: value,
        },
      };

      // Calculate all transport costs with new category
      const porterCoeff = getPorterCoefficient(value);
      const metalledCoeff = getMetalledCoefficient(value);
      const gravelledCoeff = getGravelledCoefficient(value);
      const unitWeight = updated[resourceId].unitWeight || 0;

      // Porter: uses km directly
      updated[resourceId].porterCost =
        porterCoeff * (distances.porter || 0) * unitWeight;

      // Metalled & Gravelled: convert km to kosh first
      const metalledDistanceKosh = kmToKosh(distances.metalled || 0);
      const gravelledDistanceKosh = kmToKosh(distances.gravelled || 0);
      updated[resourceId].metalledCost =
        metalledCoeff * metalledDistanceKosh * unitWeight;
      updated[resourceId].gravelledCost =
        gravelledCoeff * gravelledDistanceKosh * unitWeight;

      return updated;
    });
  };

  const calculateLandedRate = (resourceId: string) => {
    const d = ratesData[resourceId] || {};
    const rate = d.rateExcl || 0;
    const vat = d.isVatable ? rate * 0.13 : 0;
    const porter = d.porterCost || 0;
    const metalled = d.metalledCost || 0;
    const gravelled = d.gravelledCost || 0;
    const load = d.loadUnload || 0;
    return rate + vat + porter + metalled + gravelled + load;
  };

  const calculateVat = (resourceId: string) => {
    const d = ratesData[resourceId] || {};
    const rate = d.rateExcl || 0;
    return d.isVatable ? rate * 0.13 : 0;
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

  const handlePorterCoefficientChange = (category: string, value: string) => {
    const num = parseFloat(value) || 0;
    setPorterCoefficients((prev) => ({
      ...prev,
      [category]: num,
    }));
  };

  const handleMetalledCoefficientChange = (category: string, value: string) => {
    const num = parseFloat(value) || 0;
    setMetalledCoefficients((prev) => ({
      ...prev,
      [category]: num,
    }));
  };

  const handleGravelledCoefficientChange = (
    category: string,
    value: string,
  ) => {
    const num = parseFloat(value) || 0;
    setGravelledCoefficients((prev) => ({
      ...prev,
      [category]: num,
    }));
  };

  // Recalculate all costs when distance or coefficients change
  useEffect(() => {
    setRatesData((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const category = next[id].category || "1";
        const porterCoeff = getPorterCoefficient(category);
        const metalledCoeff = getMetalledCoefficient(category);
        const gravelledCoeff = getGravelledCoefficient(category);
        const unitWeight = next[id].unitWeight || 0;

        // Porter: uses km directly
        const porterDistance = distances.porter || 0;
        next[id].porterCost = porterCoeff * porterDistance * unitWeight;

        // Metalled & Gravelled: convert km to kosh first
        const metalledDistanceKosh = kmToKosh(distances.metalled || 0);
        const gravelledDistanceKosh = kmToKosh(distances.gravelled || 0);
        next[id].metalledCost =
          metalledCoeff * metalledDistanceKosh * unitWeight;
        next[id].gravelledCost =
          gravelledCoeff * gravelledDistanceKosh * unitWeight;
      });
      return next;
    });
  }, [
    distances.porter,
    distances.metalled,
    distances.gravelled,
    porterCoefficients,
    metalledCoefficients,
    gravelledCoefficients,
  ]);

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
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mode of Transport & Coefficients</CardTitle>
          {saveStatus && (
            <span className="text-green-600 font-semibold text-sm">
              {saveStatus}
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
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

            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-4 text-gray-700">
                Distance Values (in KM)
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Distance Type</TableHead>
                    <TableHead className="w-[100px]">Value (km)</TableHead>
                    <TableHead className="w-[100px]">
                      Converted (kosh)
                    </TableHead>
                    <TableHead className="w-[150px]">
                      Usage in Formula
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-gray-50">
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
                        className="max-w-[100px] border-0 rounded-0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-cyan-700">
                      {kmToKosh(distances.metalled).toFixed(2)} kosh
                    </TableCell>
                    <TableCell className="text-xs bg-cyan-50 p-2 rounded">
                      <strong>Metalled Cost</strong> = Coeff ×{" "}
                      {kmToKosh(distances.metalled).toFixed(2)} kosh × Unit
                      Weight
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
                        className="max-w-[100px] border-0 rounded-0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-amber-700">
                      {kmToKosh(distances.gravelled).toFixed(2)} kosh
                    </TableCell>
                    <TableCell className="text-xs bg-amber-50 p-2 rounded">
                      <strong>Gravelled Cost</strong> = Coeff ×{" "}
                      {kmToKosh(distances.gravelled).toFixed(2)} kosh × Unit
                      Weight
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50 border-t-2 border-blue-300">
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
                        className="max-w-[100px] border-0 rounded-0 focus:bg-blue-100"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-green-700">
                      {distances.porter || 0} km (direct)
                    </TableCell>
                    <TableCell className="text-xs bg-green-50 p-2 rounded">
                      <strong>Porter Cost</strong> = Coeff ×{" "}
                      {distances.porter || 0} km × Unit Weight
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-4 text-gray-700">
                Porter Coefficients
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Load Category</TableHead>
                    <TableHead className="w-[150px]">
                      Porter Coefficient
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-green-50">
                    <TableCell className="font-medium text-green-800">
                      Easy Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={porterCoefficients.easy}
                        onChange={(e) =>
                          handlePorterCoefficientChange("easy", e.target.value)
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-green-100 font-semibold text-green-800"
                        step="0.1"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-yellow-50">
                    <TableCell className="font-medium text-yellow-800">
                      Difficult Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={porterCoefficients.difficult}
                        onChange={(e) =>
                          handlePorterCoefficientChange(
                            "difficult",
                            e.target.value,
                          )
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-yellow-100 font-semibold text-yellow-800"
                        step="0.1"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-orange-50">
                    <TableCell className="font-medium text-orange-800">
                      Very Difficult Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={porterCoefficients.veryDifficult}
                        onChange={(e) =>
                          handlePorterCoefficientChange(
                            "veryDifficult",
                            e.target.value,
                          )
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-orange-100 font-semibold text-orange-800"
                        step="0.1"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-red-50">
                    <TableCell className="font-medium text-red-800">
                      High Volume Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={porterCoefficients.highVolume}
                        onChange={(e) =>
                          handlePorterCoefficientChange(
                            "highVolume",
                            e.target.value,
                          )
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-red-100 font-semibold text-red-800"
                        step="0.1"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-4 text-gray-700">
                Metalled Road Coefficients
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Load Category</TableHead>
                    <TableHead className="w-[150px]">
                      Metalled Coefficient
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-medium text-blue-800">
                      Easy Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={metalledCoefficients.easy}
                        onChange={(e) =>
                          handleMetalledCoefficientChange(
                            "easy",
                            e.target.value,
                          )
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-blue-100 font-semibold text-blue-800"
                        step="0.001"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-medium text-blue-800">
                      Difficult Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={metalledCoefficients.difficult}
                        onChange={(e) =>
                          handleMetalledCoefficientChange(
                            "difficult",
                            e.target.value,
                          )
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-blue-100 font-semibold text-blue-800"
                        step="0.001"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-medium text-blue-800">
                      Very Difficult Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={metalledCoefficients.veryDifficult}
                        onChange={(e) =>
                          handleMetalledCoefficientChange(
                            "veryDifficult",
                            e.target.value,
                          )
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-blue-100 font-semibold text-blue-800"
                        step="0.001"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-medium text-blue-800">
                      High Volume Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={metalledCoefficients.highVolume}
                        onChange={(e) =>
                          handleMetalledCoefficientChange(
                            "highVolume",
                            e.target.value,
                          )
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-blue-100 font-semibold text-blue-800"
                        step="0.001"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-4 text-gray-700">
                Gravelled Road Coefficients
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Load Category</TableHead>
                    <TableHead className="w-[150px]">
                      Gravelled Coefficient
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-amber-50">
                    <TableCell className="font-medium text-amber-800">
                      Easy Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={gravelledCoefficients.easy}
                        onChange={(e) =>
                          handleGravelledCoefficientChange(
                            "easy",
                            e.target.value,
                          )
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-amber-100 font-semibold text-amber-800"
                        step="0.001"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-amber-50">
                    <TableCell className="font-medium text-amber-800">
                      Difficult Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={gravelledCoefficients.difficult}
                        onChange={(e) =>
                          handleGravelledCoefficientChange(
                            "difficult",
                            e.target.value,
                          )
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-amber-100 font-semibold text-amber-800"
                        step="0.001"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-amber-50">
                    <TableCell className="font-medium text-amber-800">
                      Very Difficult Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={gravelledCoefficients.veryDifficult}
                        onChange={(e) =>
                          handleGravelledCoefficientChange(
                            "veryDifficult",
                            e.target.value,
                          )
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-amber-100 font-semibold text-amber-800"
                        step="0.001"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-amber-50">
                    <TableCell className="font-medium text-amber-800">
                      High Volume Load
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={gravelledCoefficients.highVolume}
                        onChange={(e) =>
                          handleGravelledCoefficientChange(
                            "highVolume",
                            e.target.value,
                          )
                        }
                        className="max-w-[150px] border-0 rounded-0 focus:bg-amber-100 font-semibold text-amber-800"
                        step="0.001"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Resource Rate Analysis</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-semibold">Formulas:</span>
            <br />•{" "}
            <span className="text-green-700 font-semibold">
              Porter Cost = Porter Coefficient × Porter Distance (
              {distances.porter || "0"} km) × Unit Weight
            </span>
            <br />•{" "}
            <span className="text-cyan-700 font-semibold">
              Metalled Cost = Metalled Coefficient × Metalled Distance (
              {kmToKosh(distances.metalled).toFixed(2)} kosh) × Unit Weight
            </span>
            <br />•{" "}
            <span className="text-amber-700 font-semibold">
              Gravelled Cost = Gravelled Coefficient × Gravelled Distance (
              {kmToKosh(distances.gravelled).toFixed(2)} kosh) × Unit Weight
            </span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">S.No</TableHead>
                  <TableHead className="w-[180px]">Material Name</TableHead>
                  <TableHead className="w-[75px]">Category</TableHead>
                  <TableHead className="w-[75px]">Rate (Excl. VAT)</TableHead>
                  <TableHead className="w-[80px]">Vatable?</TableHead>
                  <TableHead className="w-[65px]">VAT (13%)</TableHead>
                  <TableHead className="w-[75px]">Unit Weight (KG)</TableHead>
                  <TableHead className="w-[75px]">Porter Coeff</TableHead>
                  <TableHead className="w-[75px]">Porter Cost</TableHead>
                  <TableHead className="w-[75px]">Metalled Coeff</TableHead>
                  <TableHead className="w-[75px]">Metalled Cost</TableHead>
                  <TableHead className="w-[75px]">Gravelled Coeff</TableHead>
                  <TableHead className="w-[75px]">Gravelled Cost</TableHead>
                  <TableHead className="w-[70px]">Load/Unload</TableHead>
                  <TableHead className="w-[100px] text-right">
                    Landed Rate
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource, idx) => {
                  const category = ratesData[resource.id]?.category || "1";
                  const porterCoeff = getPorterCoefficient(category);
                  const metalledCoeff = getMetalledCoefficient(category);
                  const gravelledCoeff = getGravelledCoefficient(category);
                  const unitWeight = ratesData[resource.id]?.unitWeight || 0;
                  const porterDistance = distances.porter || 0;
                  const metalledDistanceKosh = kmToKosh(
                    distances.metalled || 0,
                  );
                  const gravelledDistanceKosh = kmToKosh(
                    distances.gravelled || 0,
                  );

                  const calculatedPorterCost =
                    porterCoeff * porterDistance * unitWeight;
                  const calculatedMetalledCost =
                    metalledCoeff * metalledDistanceKosh * unitWeight;
                  const calculatedGravelledCost =
                    gravelledCoeff * gravelledDistanceKosh * unitWeight;

                  return (
                    <TableRow key={resource.id}>
                      <TableCell className="font-semibold">{idx + 1}</TableCell>
                      <TableCell className="font-medium">
                        {resource.name}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={ratesData[resource.id]?.category || ""}
                          onValueChange={(val) =>
                            handleCategoryChange(resource.id, val)
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Easy</SelectItem>
                            <SelectItem value="2">Difficult</SelectItem>
                            <SelectItem value="3">V.Difficult</SelectItem>
                            <SelectItem value="4">H.Volume</SelectItem>
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
                          className="w-[70px] border-0 rounded-0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={ratesData[resource.id]?.isVatable ?? false}
                          onChange={() => handleVatToggle(resource.id)}
                          className="w-5 h-5 cursor-pointer"
                          title="Mark as vatable material"
                        />
                      </TableCell>
                      <TableCell className="bg-blue-50 font-semibold text-center">
                        {calculateVat(resource.id).toFixed(2)}
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
                          className="w-[70px] border-0 rounded-0"
                          step="0.01"
                          title="Unit Weight in KG"
                        />
                      </TableCell>
                      <TableCell className="bg-purple-50 font-bold text-purple-700 text-center">
                        {porterCoeff.toFixed(2)}
                      </TableCell>
                      <TableCell className="bg-green-50 font-bold text-green-700 text-center">
                        {calculatedPorterCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="bg-cyan-50 font-bold text-cyan-700 text-center">
                        {metalledCoeff.toFixed(3)}
                      </TableCell>
                      <TableCell className="bg-cyan-50 font-bold text-cyan-700 text-center">
                        {calculatedMetalledCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="bg-amber-50 font-bold text-amber-700 text-center">
                        {gravelledCoeff.toFixed(3)}
                      </TableCell>
                      <TableCell className="bg-amber-50 font-bold text-amber-700 text-center">
                        {calculatedGravelledCost.toFixed(2)}
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
                          className="w-[60px] border-0 rounded-0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="text-right font-bold bg-yellow-50 text-amber-900">
                        {calculateLandedRate(resource.id).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DescriptionAutocomplete({
  value,
  onChange,
  workItems,
  onSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  workItems: any[];
  onSelect: (description: string) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (value.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = workItems
      ?.filter((item) =>
        item.description.toLowerCase().includes(value.toLowerCase()),
      )
      .map((item) => item.description)
      .filter((desc, index, self) => self.indexOf(desc) === index);

    setSuggestions(filtered || []);
    setShowSuggestions(filtered && filtered.length > 0);
  }, [value, workItems]);

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    onSelect(suggestion);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value && setSuggestions(suggestions)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="border-0 rounded-0 focus:bg-blue-50"
        placeholder="Enter description of works"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 max-h-40 overflow-y-auto z-50 shadow-lg">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="px-4 py-2 hover:bg-blue-100 cursor-pointer flex items-center gap-2 border-b border-gray-200 last:border-b-0"
            >
              <Check size={14} className="text-blue-600" />
              <span className="text-sm">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EstimateComponent({
  estimateRows,
  setEstimateRows,
}: {
  estimateRows: EstimateRow[];
  setEstimateRows: React.Dispatch<React.SetStateAction<EstimateRow[]>>;
}) {
  const { data: workItems } = useWorkItems();

  const [saveStatus, setSaveStatus] = useState<string>("");

  // Auto-save estimate rows
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ESTIMATE_ROWS, estimateRows);
    setSaveStatus("✓ Saved");
    setTimeout(() => setSaveStatus(""), 2000);
  }, [estimateRows]);

  const calculateQuantity = (row: EstimateRow, allRows: EstimateRow[]): string => {
    const parseValue = (val: any, visited = new Set<string>()): number => {
      if (typeof val !== "string" || val === null || val === undefined) return parseFloat(val as any) || 0;
      const strVal = val.trim();
      if (strVal.startsWith("=")) {
        const formula = strVal.substring(1).trim().toUpperCase();
        
        const cellRef = `${row.id}`; 
        if (visited.has(cellRef)) return 0;
        const newVisited = new Set(visited);
        newVisited.add(cellRef);

        const matchCell = formula.match(/^R(\d+)_([A-Z]+)$/);
        if (matchCell) {
          const targetId = matchCell[1];
          const targetCol = matchCell[2].toLowerCase();
          const targetRow = allRows.find(r => r.id === targetId);
          if (!targetRow) return 0;
          const targetVal = (targetRow as any)[targetCol];
          // RECURSIVE CALL: parseValue handles nested formulas
          return parseValue(targetVal?.toString() || "0", newVisited);
        }

        const matchSn = formula.match(/^SN(\d+)$/);
        if (matchSn) {
          const targetSn = parseInt(matchSn[1]);
          const targetRow = allRows.find(r => r.isMainItem && r.serialNo === targetSn);
          if (!targetRow) return 0;
          return parseFloat(targetRow.quantity as string) || 0;
        }

        const matchId = formula.match(/^#(\d+)$/);
        if (matchId) {
          const targetId = matchId[1];
          const targetRow = allRows.find(r => r.id === targetId);
          if (!targetRow) return 0;
          return parseFloat(targetRow.quantity as string) || 0;
        }
        return 0;
      }
      return parseFloat(strVal) || 0;
    };

    const length = parseValue(row.length);
    const breadth = parseValue(row.breadth);
    const height = parseValue(row.height);
    const nos = parseValue(row.nos);

    let quantity = 0;
    if (length && breadth && height) {
      quantity = length * breadth * height * (nos || 1);
    } else if (length && breadth) {
      quantity = length * breadth * (nos || 1);
    } else if (length) {
      quantity = length * (nos || 1);
    } else if (nos) {
      quantity = nos;
    }

    return quantity.toFixed(2);
  };

  const [activeLinkingCell, setActiveLinkingCell] = useState<{
    rowId: string;
    column: string;
  } | null>(null);

  const handleCellClick = (rowId: string, column: string) => {
    if (activeLinkingCell) {
      // If we are in "linking mode", click on another cell should create the reference
      const targetRow = estimateRows.find((r) => r.id === rowId);
      if (targetRow && (rowId !== activeLinkingCell.rowId || column !== activeLinkingCell.column)) {
        const formula = `=R${rowId}_${column.toUpperCase()}`;
        handleCellChange(activeLinkingCell.rowId, activeLinkingCell.column, formula);
        setActiveLinkingCell(null);
      }
    }
  };

  const handleCellChange = (rowId: string, column: string, value: string) => {
    if (value.startsWith("=") && value.length === 1) {
      setActiveLinkingCell({ rowId, column });
    } else if (activeLinkingCell?.rowId === rowId && activeLinkingCell?.column === column && !value.startsWith("=")) {
      setActiveLinkingCell(null);
    }

    setEstimateRows((rows) => {
      const updatedRows = rows.map((row) => {
        if (row.id === rowId) {
          return { ...row, [column]: value };
        }
        return row;
      });

      // Recalculate all quantities multiple times to handle multi-step dependencies
      let finalRows = [...updatedRows];
      for (let i = 0; i < 5; i++) { // Max 5 levels of dependency
        finalRows = finalRows.map((r) => ({
          ...r,
          quantity: calculateQuantity(r, finalRows),
        }));
      }
      return finalRows;
    });
  };

  const getDisplayValue = (val: any, rowId: string, col: string): string => {
    if (typeof val !== "string" || !val.startsWith("=")) return val?.toString() || "";
    if (focusedCell?.rowId === rowId && focusedCell?.column === col) return val;
    
    const row = estimateRows.find(r => r.id === rowId);
    if (!row) return val;
    
    const parseValue = (v: string, visited = new Set<string>()): number => {
      if (!v.startsWith("=")) return parseFloat(v) || 0;
      const formula = v.substring(1).trim().toUpperCase();
      const matchCell = formula.match(/^R(\d+)_([A-Z]+)$/);
      if (matchCell) {
        const targetId = matchCell[1];
        const targetCol = matchCell[2].toLowerCase();
        const targetRow = estimateRows.find(r => r.id === targetId);
        if (!targetRow) return 0;
        const targetVal = (targetRow as any)[targetCol];
        return parseValue(targetVal?.toString() || "0", visited);
      }
      return 0;
    };
    
    return parseValue(val).toFixed(2);
  };

  const [focusedCell, setFocusedCell] = useState<{rowId: string, column: string} | null>(null);

  const handleDescriptionSelect = (rowId: string, description: string) => {
    console.log(`Selected: ${description}`);
  };

  const addMainRow = () => {
    const newId = (
      Math.max(...estimateRows.map((r) => parseInt(r.id)), 0) + 1
    ).toString();
    const mainItems = estimateRows.filter((r) => r.isMainItem);
    const newSerialNo = mainItems.length + 1;
    setEstimateRows([
      ...estimateRows,
      {
        id: newId,
        serialNo: newSerialNo,
        description: "",
        unit: "",
        length: "",
        breadth: "",
        height: "",
        nos: "",
        quantity: "",
        remarks: "",
        isMainItem: true,
        isExpanded: true,
      },
    ]);
  };

  const addSubRow = (parentId: string) => {
    const newId = (
      Math.max(...estimateRows.map((r) => parseInt(r.id)), 0) + 1
    ).toString();
    const insertIndex = estimateRows.findIndex((r) => r.id === parentId) + 1;
    const newRows = [...estimateRows];
    newRows.splice(insertIndex, 0, {
      id: newId,
      serialNo: "",
      description: "",
      unit: "",
      length: "",
      breadth: "",
      height: "",
      nos: "",
      quantity: "",
      remarks: "",
      isMainItem: false,
      parentId: parentId,
      isExpanded: true,
    });
    setEstimateRows(newRows);
  };

  const deleteRow = (rowId: string) => {
    const rowToDelete = estimateRows.find((r) => r.id === rowId);
    let newRows = estimateRows.filter((row) => {
      if (row.id === rowId) return false;
      if (rowToDelete?.isMainItem && row.parentId === rowId) return false;
      return true;
    });

    const mainItems = newRows.filter((r) => r.isMainItem);
    newRows = newRows.map((row) => {
      if (row.isMainItem) {
        const index = mainItems.findIndex((m) => m.id === row.id);
        return { ...row, serialNo: index + 1 };
      }
      return row;
    });

    setEstimateRows(newRows);
  };

  const toggleExpand = (rowId: string) => {
    setEstimateRows((rows) =>
      rows.map((row) =>
        row.id === rowId ? { ...row, isExpanded: !row.isExpanded } : row,
      ),
    );
  };

  const getMainItemTotal = (mainItemId: string): string => {
    const subItems = estimateRows.filter((r) => r.parentId === mainItemId);
    const total = subItems.reduce(
      (sum, row) => sum + (parseFloat(row.quantity as string) || 0),
      0,
    );
    return total.toFixed(2);
  };

  const getTotalQuantity = (): string => {
    return estimateRows
      .filter((r) => !r.isMainItem)
      .reduce((sum, row) => sum + (parseFloat(row.quantity as string) || 0), 0)
      .toFixed(2);
  };

  const visibleRows = estimateRows.filter((row) => {
    if (row.isMainItem) return true;
    const parentRow = estimateRows.find((r) => r.id === row.parentId);
    return parentRow?.isExpanded;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Estimate Breakdown
        </h3>
        {saveStatus && (
          <span className="text-green-600 font-semibold text-sm">
            {saveStatus}
          </span>
        )}
      </div>

      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-blue-600 text-white sticky top-0">
            <tr>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[50px]">
                S.N.
              </th>
              <th className="border border-gray-300 p-4 text-left font-semibold min-w-[200px]">
                Description of Works
              </th>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[70px]">
                Unit
              </th>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[80px]">
                Length
              </th>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[80px]">
                Breadth
              </th>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[80px]">
                Height
              </th>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[60px]">
                Nos
              </th>
              <th className="border border-gray-300 p-4 text-right font-semibold min-w-[100px]">
                Quantity
              </th>
              <th className="border border-gray-300 p-4 text-left font-semibold min-w-[150px]">
                Remarks
              </th>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[100px]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <React.Fragment key={row.id}>
                <tr
                  className={
                    row.isMainItem
                      ? "bg-blue-50 border-b-2 border-blue-300 hover:bg-blue-100"
                      : "bg-white border-b border-gray-200 hover:bg-gray-50"
                  }
                >
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    {row.isMainItem ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleExpand(row.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {row.isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                        <span title={`ID: ${row.id}`}>{row.serialNo}</span>
                      </div>
                    ) : (
                      <span className="ml-6 text-gray-500" title={`ID: ${row.id}`}>-</span>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {row.isMainItem ? (
                      <DescriptionAutocomplete
                        value={row.description as string}
                        onChange={(value) =>
                          handleCellChange(row.id, "description", value)
                        }
                        workItems={workItems || []}
                        onSelect={(description) =>
                          handleDescriptionSelect(row.id, description)
                        }
                      />
                    ) : (
                      <Input
                        value={row.description as string}
                        onChange={(e) =>
                          handleCellChange(row.id, "description", e.target.value)
                        }
                        className="border-0 rounded-0 focus:bg-gray-50"
                        placeholder="Enter description"
                      />
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      value={row.unit as string}
                      onChange={(e) =>
                        handleCellChange(row.id, "unit", e.target.value)
                      }
                      className={`border-0 rounded-0 text-center ${
                        row.isMainItem ? "focus:bg-blue-50" : "focus:bg-gray-50"
                      }`}
                      placeholder="m, m², m³, etc."
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <div className="relative group">
                      <Input
                        value={getDisplayValue(row.length, row.id, "length")}
                        onClick={() => handleCellClick(row.id, "length")}
                        onFocus={() => setFocusedCell({ rowId: row.id, column: "length" })}
                        onBlur={() => setFocusedCell(null)}
                        onChange={(e) =>
                          handleCellChange(row.id, "length", e.target.value)
                        }
                        className={`border-0 rounded-0 text-center ${
                          activeLinkingCell?.rowId === row.id && activeLinkingCell?.column === "length" ? "ring-2 ring-orange-500" : ""
                        } ${
                          row.isMainItem ? "focus:bg-blue-50" : "focus:bg-gray-50"
                        }`}
                        placeholder="0.00"
                        onFocus={(e) => {
                          if (e.target.value.startsWith("=")) {
                            // Keep formula visible during editing
                          }
                        }}
                      />
                      {row.length?.toString().startsWith("=") && (
                        <div className="absolute right-1 top-1 text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 bg-white/80 px-1 rounded">
                          Link
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <div className="relative group">
                      <Input
                        value={getDisplayValue(row.breadth, row.id, "breadth")}
                        onClick={() => handleCellClick(row.id, "breadth")}
                        onFocus={() => setFocusedCell({ rowId: row.id, column: "breadth" })}
                        onBlur={() => setFocusedCell(null)}
                        onChange={(e) =>
                          handleCellChange(row.id, "breadth", e.target.value)
                        }
                        className={`border-0 rounded-0 text-center ${
                          activeLinkingCell?.rowId === row.id && activeLinkingCell?.column === "breadth" ? "ring-2 ring-orange-500" : ""
                        } ${
                          row.isMainItem ? "focus:bg-blue-50" : "focus:bg-gray-50"
                        }`}
                        placeholder="0.00"
                        onFocus={(e) => {
                          if (e.target.value.startsWith("=")) {
                            // Keep formula visible during editing
                          }
                        }}
                      />
                      {row.breadth?.toString().startsWith("=") && (
                        <div className="absolute right-1 top-1 text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 bg-white/80 px-1 rounded">
                          Link
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <div className="relative group">
                      <Input
                        value={getDisplayValue(row.height, row.id, "height")}
                        onClick={() => handleCellClick(row.id, "height")}
                        onFocus={() => setFocusedCell({ rowId: row.id, column: "height" })}
                        onBlur={() => setFocusedCell(null)}
                        onChange={(e) =>
                          handleCellChange(row.id, "height", e.target.value)
                        }
                        className={`border-0 rounded-0 text-center ${
                          activeLinkingCell?.rowId === row.id && activeLinkingCell?.column === "height" ? "ring-2 ring-orange-500" : ""
                        } ${
                          row.isMainItem ? "focus:bg-blue-50" : "focus:bg-gray-50"
                        }`}
                        placeholder="0.00"
                        onFocus={(e) => {
                          if (e.target.value.startsWith("=")) {
                            // Keep formula visible during editing
                          }
                        }}
                      />
                      {row.height?.toString().startsWith("=") && (
                        <div className="absolute right-1 top-1 text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 bg-white/80 px-1 rounded">
                          Link
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <div className="relative group">
                      <Input
                        value={getDisplayValue(row.nos, row.id, "nos")}
                        onClick={() => handleCellClick(row.id, "nos")}
                        onFocus={() => setFocusedCell({ rowId: row.id, column: "nos" })}
                        onBlur={() => setFocusedCell(null)}
                        onChange={(e) =>
                          handleCellChange(row.id, "nos", e.target.value)
                        }
                        className={`border-0 rounded-0 text-center ${
                          activeLinkingCell?.rowId === row.id && activeLinkingCell?.column === "nos" ? "ring-2 ring-orange-500" : ""
                        } ${
                          row.isMainItem ? "focus:bg-blue-50" : "focus:bg-gray-50"
                        }`}
                        placeholder="0"
                      />
                      {row.nos?.toString().startsWith("=") && (
                        <div className="absolute right-1 top-1 text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 bg-white/80 px-1 rounded">
                          Link
                        </div>
                      )}
                    </div>
                  </td>
                  <td
                    className={`border border-gray-300 p-4 font-bold text-center ${
                      row.isMainItem
                        ? "text-blue-700 bg-blue-100"
                        : "text-gray-700 bg-gray-100"
                    }`}
                  >
                    {row.quantity}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      value={row.remarks as string}
                      onChange={(e) =>
                        handleCellChange(row.id, "remarks", e.target.value)
                      }
                      className={`border-0 rounded-0 ${
                        row.isMainItem ? "focus:bg-blue-50" : "focus:bg-gray-50"
                      }`}
                      placeholder="Enter remarks"
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-center space-x-2">
                    {row.isMainItem && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSubRow(row.id)}
                        className="rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                        title="Add Sub Item"
                      >
                        <Plus size={14} />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteRow(row.id)}
                      className="rounded-lg"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
                {row.isMainItem && (
                  <tr className="bg-blue-50 border-b border-blue-200">
                    <td colSpan={10} className="p-2">
                      <div className="text-right font-bold text-blue-800 pr-4">
                        Main Item Total: {getMainItemTotal(row.id)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6 mt-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-800">
            Total Quantity:
          </span>
          <span className="text-3xl font-bold text-blue-700">
            {getTotalQuantity()}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button
          onClick={addMainRow}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
        >
          <Plus size={20} className="mr-2" />
          Add Main Item
        </Button>
      </div>
    </div>
  );
}

function DescriptionAutocompleteForBOQ({
  value,
  onChange,
  workItems,
  onSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  workItems: any[];
  onSelect: (description: string) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (value.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = workItems
      ?.filter((item) =>
        item.description.toLowerCase().includes(value.toLowerCase()),
      )
      .map((item) => item.description)
      .filter((desc, index, self) => self.indexOf(desc) === index);

    setSuggestions(filtered || []);
    setShowSuggestions(filtered && filtered.length > 0);
  }, [value, workItems]);

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    onSelect(suggestion);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value && setSuggestions(suggestions)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="border-0 rounded-0 focus:bg-green-50"
        placeholder="Enter description of works"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 max-h-40 overflow-y-auto z-50 shadow-lg">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="px-4 py-2 hover:bg-green-100 cursor-pointer flex items-center gap-2 border-b border-gray-200 last:border-b-0"
            >
              <Check size={14} className="text-green-600" />
              <span className="text-sm">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface BOQComponentProps {
  estimateRows: EstimateRow[];
}

function BOQComponent({ estimateRows }: BOQComponentProps) {
  const { data: workItems } = useWorkItems();
  const [boqRows, setBoqRows] = useState<BOQRow[]>(() =>
    getFromLocalStorage(STORAGE_KEYS.BOQ_ROWS, []),
  );

  const [saveStatus, setSaveStatus] = useState<string>("");

  // Auto-save BOQ rows
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.BOQ_ROWS, boqRows);
    setSaveStatus("✓ Saved");
    setTimeout(() => setSaveStatus(""), 2000);
  }, [boqRows]);

  useEffect(() => {
    const mainEstimateItems = estimateRows.filter(
      (r) => r.isMainItem && r.description.trim(),
    );

    setBoqRows((prevBoq) => {
      const newBoqRows: BOQRow[] = mainEstimateItems.map((mainItem, index) => {
        const mainItemTotal = estimateRows
          .filter((r) => r.parentId === mainItem.id)
          .reduce(
            (sum, row) => sum + (parseFloat(row.quantity as string) || 0),
            0,
          )
          .toFixed(2);

        const existingRow = prevBoq.find(
          (r) => r.estimateMainItemId === mainItem.id,
        );

        return {
          id: existingRow?.id || mainItem.id,
          serialNo: index + 1,
          description: mainItem.description,
          unit: mainItem.unit,
          quantity: mainItemTotal,
          rate: existingRow?.rate || "",
          amount: existingRow?.amount || "",
          refToSS: existingRow?.refToSS || "",
          estimateMainItemId: mainItem.id,
        };
      });
      
      // Merge with manual rows (those without estimateMainItemId)
      const manualRows = prevBoq.filter(r => !r.estimateMainItemId);
      return [...newBoqRows, ...manualRows].map((r, i) => ({ ...r, serialNo: i + 1 }));
    });
  }, [estimateRows]);

  const handleCellChange = (rowId: string, column: string, value: string) => {
    setBoqRows((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, [column]: value } : row)),
    );
  };

  const handleDescriptionSelect = (rowId: string, description: string) => {
    console.log(`Selected: ${description}`);
  };

  const addRow = () => {
    const newId = (
      Math.max(...boqRows.map((r) => parseInt(r.id)), 0) + 1
    ).toString();
    const newSerialNo = boqRows.length + 1;
    setBoqRows([
      ...boqRows,
      {
        id: newId,
        serialNo: newSerialNo,
        description: "",
        unit: "",
        quantity: "",
        rate: "",
        amount: "",
        refToSS: "",
      },
    ]);
  };

  const deleteRow = (rowId: string) => {
    if (boqRows.length > 1) {
      const updatedRows = boqRows.filter((row) => row.id !== rowId);
      const renumberedRows = updatedRows.map((row, index) => ({
        ...row,
        serialNo: index + 1,
      }));
      setBoqRows(renumberedRows);
    }
  };

  const calculateAmount = (
    quantity: string | number,
    rate: string | number,
  ): string => {
    return (
      (parseFloat(quantity as string) || 0) * (parseFloat(rate as string) || 0)
    ).toFixed(2);
  };

  const getBoqTotal = (): string => {
    return boqRows
      .reduce(
        (sum, row) =>
          sum + parseFloat(calculateAmount(row.quantity, row.rate) || "0"),
        0,
      )
      .toFixed(2);
  };

  const syncWithEstimate = () => {
    const mainEstimateItems = estimateRows.filter(
      (r) => r.isMainItem && r.description.trim(),
    );

    const newBoqRows: BOQRow[] = mainEstimateItems.map((mainItem, index) => {
      const mainItemTotal = estimateRows
        .filter((r) => r.parentId === mainItem.id)
        .reduce(
          (sum, row) => sum + (parseFloat(row.quantity as string) || 0),
          0,
        )
        .toFixed(2);

      const existingRow = boqRows.find(
        (r) => r.estimateMainItemId === mainItem.id,
      );

      return {
        id: mainItem.id,
        serialNo: index + 1,
        description: mainItem.description,
        unit: mainItem.unit,
        quantity: mainItemTotal,
        rate: existingRow?.rate || "",
        amount: existingRow?.amount || "",
        refToSS: existingRow?.refToSS || "",
        estimateMainItemId: mainItem.id,
      };
    });

    setBoqRows(newBoqRows);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <div className="flex gap-2 items-center">
          {saveStatus && (
            <span className="text-green-600 font-semibold text-sm">
              {saveStatus}
            </span>
          )}
          <Button
            onClick={syncWithEstimate}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg"
            title="Sync BOQ with Estimate main items"
          >
            <RefreshCw size={18} className="mr-2" />
            Sync with Estimate
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-green-600 text-white sticky top-0">
            <tr>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[60px]">
                S.N.
              </th>
              <th className="border border-gray-300 p-4 text-left font-semibold min-w-[250px]">
                Description of Works
              </th>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[80px]">
                Unit
              </th>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[100px]">
                Quantity
              </th>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[100px]">
                Rate
              </th>
              <th className="border border-gray-300 p-4 text-right font-semibold min-w-[120px]">
                Amount
              </th>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[100px]">
                Ref To SS
              </th>
              <th className="border border-gray-300 p-4 text-center font-semibold min-w-[80px]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {boqRows.map((row, index) => (
              <tr
                key={row.id}
                className={
                  index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100"
                }
              >
                <td className="border border-gray-300 p-2 text-center font-semibold">
                  {row.serialNo}
                </td>
                <td className="border border-gray-300 p-2">
                  {row.estimateMainItemId ? (
                    <div className="w-full p-2 bg-green-50 rounded text-gray-800 font-medium">
                      {row.description}
                    </div>
                  ) : (
                    <DescriptionAutocompleteForBOQ
                      value={row.description as string}
                      onChange={(value) =>
                        handleCellChange(row.id, "description", value)
                      }
                      workItems={workItems || []}
                      onSelect={(description) =>
                        handleDescriptionSelect(row.id, description)
                      }
                    />
                  )}
                </td>
                <td className="border border-gray-300 p-2">
                  {row.estimateMainItemId ? (
                    <div className="w-full p-2 bg-green-50 rounded text-gray-800 font-medium text-center">
                      {row.unit}
                    </div>
                  ) : (
                    <Input
                      value={row.unit as string}
                      onChange={(e) =>
                        handleCellChange(row.id, "unit", e.target.value)
                      }
                      className="border-0 rounded-0 focus:bg-green-50 text-center"
                      placeholder="m, kg, no., etc."
                    />
                  )}
                </td>
                <td className="border border-gray-300 p-2">
                  {row.estimateMainItemId ? (
                    <div className="w-full p-2 bg-green-50 rounded text-gray-800 font-bold text-center">
                      {row.quantity}
                    </div>
                  ) : (
                    <Input
                      type="number"
                      value={row.quantity as string}
                      onChange={(e) =>
                        handleCellChange(row.id, "quantity", e.target.value)
                      }
                      className="border-0 rounded-0 focus:bg-green-50 text-center"
                      placeholder="0"
                      step="0.01"
                    />
                  )}
                </td>
                <td className="border border-gray-300 p-2">
                  <Input
                    type="number"
                    value={row.rate as string}
                    onChange={(e) =>
                      handleCellChange(row.id, "rate", e.target.value)
                    }
                    className="border-0 rounded-0 focus:bg-green-50 text-center"
                    placeholder="0"
                    step="0.01"
                  />
                </td>
                <td className="border border-gray-300 p-4 font-bold text-right text-green-700 bg-green-50">
                  ₹ {calculateAmount(row.quantity, row.rate)}
                </td>
                <td className="border border-gray-300 p-2">
                  <Input
                    value={row.refToSS as string}
                    onChange={(e) =>
                      handleCellChange(row.id, "refToSS", e.target.value)
                    }
                    className="border-0 rounded-0 focus:bg-green-50 text-center"
                    placeholder="Ref SS"
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {!row.estimateMainItemId && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteRow(row.id)}
                      className="rounded-lg"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-6 mt-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-800">
            Total BOQ Amount:
          </span>
          <span className="text-3xl font-bold text-green-700">
            ₹ {getBoqTotal()}
          </span>
        </div>
      </div>

      <Button
        onClick={addRow}
        className="mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg"
      >
        <Plus size={20} className="mr-2" />
        Add Row
      </Button>
    </div>
  );
}

export function QuantityBreakdownDashboard() {
  const { data: workItems } = useWorkItems();
  const { data: columns } = useResourceColumns();
  const [estimateRows, setEstimateRows] = useState<EstimateRow[]>(() =>
    getFromLocalStorage(STORAGE_KEYS.ESTIMATE_ROWS, [
      {
        id: "1",
        serialNo: 1,
        description: "",
        unit: "",
        length: "",
        breadth: "",
        height: "",
        nos: "",
        quantity: "",
        remarks: "",
        isMainItem: true,
        isExpanded: true,
      },
    ]),
  );

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Quantity Breakdown
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage work items, resources, estimates, BOQ, and logistics rates.
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
          <TabsList className="grid w-full grid-cols-4 max-w-full">
            <TabsTrigger value="quantity" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Quantity
            </TabsTrigger>
            <TabsTrigger value="estimate" className="gap-2">
              📊 Estimate
            </TabsTrigger>
            <TabsTrigger value="boq" className="gap-2">
              📋 BOQ
            </TabsTrigger>
            <TabsTrigger value="rate" className="gap-2">
              <Calculator className="w-4 h-4" />
              Rate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quantity" className="mt-6">
            <QuantityTable />
          </TabsContent>

          <TabsContent value="estimate" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <EstimateComponent
                  estimateRows={estimateRows}
                  setEstimateRows={setEstimateRows}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boq" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bill of Quantities (BOQ)</CardTitle>
              </CardHeader>
              <CardContent>
                <BOQComponent estimateRows={estimateRows} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rate" className="mt-6">
            <RateAnalysisComponent />
          </TabsContent>
        </Tabs>
      </div>
    </LayoutShell>
  );
}

export function ProcurementManagementDashboard() {
  const { data: workItems } = useWorkItems();

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Procurement Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage procurement, vendor details, and purchase orders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <AddResourceDialog />
          </div>
        </div>

        {/* Procurement Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workItems?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Items to procure</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Awaiting delivery</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ 0.00</div>
              <p className="text-xs text-muted-foreground">Estimated cost</p>
            </CardContent>
          </Card>
        </div>

        {/* Procurement Table */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Materials for Procurement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">S.No</TableHead>
                    <TableHead className="w-[250px]">Material Name</TableHead>
                    <TableHead className="w-[100px]">Unit</TableHead>
                    <TableHead className="w-[100px]">Quantity</TableHead>
                    <TableHead className="w-[100px]">Estimated Rate</TableHead>
                    <TableHead className="w-[120px] text-right">
                      Estimated Cost
                    </TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workItems && workItems.length > 0 ? (
                    workItems.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">
                          {item.actualMeasuredQty || "-"}
                        </TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-right font-bold">
                          ₹ 0.00
                        </TableCell>
                        <TableCell>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            Pending
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-muted-foreground">
                          No materials found. Add materials from Quantity
                          Breakdown first.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">
                No purchase orders created yet
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={18} className="mr-2" />
                Create Purchase Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}

export default function Dashboard() {
  return <QuantityBreakdownDashboard />;
}
