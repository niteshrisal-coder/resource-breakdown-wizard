import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Download, ChevronLeft } from "lucide-react";

interface Project {
  id: string;
  name: string;
  createdDate: string;
}

interface BidResponse {
  id: string;
  documentName: string;
  vendor: string;
  amount: string;
  uploadDate: string;
  status: "submitted" | "reviewed" | "rejected" | "approved";
}

interface BidResponseProps {
  project: Project;
  onBack: () => void;
}

export const BidResponse: React.FC<BidResponseProps> = ({
  project,
  onBack,
}) => {
  const [bidResponses, setBidResponses] = useState<BidResponse[]>([
    {
      id: "1",
      documentName: "ABC Corp Bid Proposal",
      vendor: "ABC Supplies Ltd",
      amount: "₹50,000",
      uploadDate: "2026-01-20",
      status: "submitted",
    },
    {
      id: "2",
      documentName: "XYZ Distribution Quote",
      vendor: "XYZ Distribution",
      amount: "₹45,000",
      uploadDate: "2026-01-21",
      status: "reviewed",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBidResponse, setNewBidResponse] = useState({
    documentName: "",
    vendor: "",
    amount: "",
    status: "submitted" as const,
  });

  const handleAddBidResponse = () => {
    if (
      newBidResponse.documentName &&
      newBidResponse.vendor &&
      newBidResponse.amount
    ) {
      const bidResponse: BidResponse = {
        id: Date.now().toString(),
        documentName: newBidResponse.documentName,
        vendor: newBidResponse.vendor,
        amount: newBidResponse.amount,
        uploadDate: new Date().toISOString().split("T")[0],
        status: newBidResponse.status,
      };
      setBidResponses([...bidResponses, bidResponse]);
      setNewBidResponse({
        documentName: "",
        vendor: "",
        amount: "",
        status: "submitted",
      });
      setIsDialogOpen(false);
    }
  };

  const handleDeleteBidResponse = (id: string) => {
    setBidResponses(bidResponses.filter((response) => response.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "reviewed":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "approved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ChevronLeft size={20} />
        Back to Project Actions
      </Button>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
        <p className="text-gray-600 mt-1">Manage Bid Response Documents</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bid Response Documents</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} />
                Add Bid Response
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Bid Response Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Document Name
                  </label>
                  <Input
                    placeholder="e.g., Bid Proposal, Quote, etc."
                    value={newBidResponse.documentName}
                    onChange={(e) =>
                      setNewBidResponse({
                        ...newBidResponse,
                        documentName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vendor Name
                  </label>
                  <Input
                    placeholder="Vendor Name"
                    value={newBidResponse.vendor}
                    onChange={(e) =>
                      setNewBidResponse({
                        ...newBidResponse,
                        vendor: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bid Amount
                  </label>
                  <Input
                    placeholder="₹0.00"
                    value={newBidResponse.amount}
                    onChange={(e) =>
                      setNewBidResponse({
                        ...newBidResponse,
                        amount: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={newBidResponse.status}
                    onChange={(e) =>
                      setNewBidResponse({
                        ...newBidResponse,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <Button onClick={handleAddBidResponse} className="w-full">
                  Add Bid Response
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Bid Amount</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bidResponses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-gray-500">No bid responses found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  bidResponses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell className="font-medium">
                        {response.documentName}
                      </TableCell>
                      <TableCell>{response.vendor}</TableCell>
                      <TableCell className="text-right font-medium">
                        {response.amount}
                      </TableCell>
                      <TableCell>{response.uploadDate}</TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(response.status)}`}
                        >
                          {response.status.charAt(0).toUpperCase() +
                            response.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center flex gap-2 justify-center">
                        <Button variant="ghost" size="sm" title="Download">
                          <Download size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBidResponse(response.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
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
};
