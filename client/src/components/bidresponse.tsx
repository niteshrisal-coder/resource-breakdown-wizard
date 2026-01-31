import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, Download, ChevronLeft, Upload, FileText, X, Eye } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";

interface Project {
  id: string;
  name: string;
  createdDate: string;
}

interface BidResponse {
  id: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  documentUrl: string;
}

interface BidResponseProps {
  project: Project;
  onBack: () => void;
}

interface UploadingFile {
  file: File;
  uploadProgress: number;
  error?: string;
  id: string;
}

export const BidResponse: React.FC<BidResponseProps> = ({
  project,
  onBack,
}) => {
  const [bidResponses, setBidResponses] = useState<BidResponse[]>([
    {
      id: "1",
      fileName: "bid-proposal-001.pdf",
      fileSize: "2.4 MB",
      uploadDate: "2026-01-20",
      documentUrl: "/uploads/bid1.pdf",
    },
    {
      id: "2",
      fileName: "technical-specs.pdf",
      fileSize: "1.8 MB",
      uploadDate: "2026-01-21",
      documentUrl: "/uploads/bid2.pdf",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response: any, file: File) => {
      // Create a new bid response from uploaded file
      const newBidResponse: BidResponse = {
        id: Date.now().toString(),
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        uploadDate: new Date().toISOString().split("T")[0],
        documentUrl: response.objectPath,
      };

      setBidResponses(prev => [...prev, newBidResponse]);

      // Remove file from uploading list
      setUploadingFiles(prev => prev.filter(f => f.file !== file));
    },
    onError: (error: Error, file: File) => {
      // Update the file with error
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, error: error.message, uploadProgress: 0 }
            : f
        )
      );
    },
    onProgress: (progress: number, file: File) => {
      // Update progress for the file
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, uploadProgress: progress }
            : f
        )
      );
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Filter only PDF files
    const pdfFiles = files.filter(file => file.type === "application/pdf");

    if (pdfFiles.length === 0 && files.length > 0) {
      alert("Please select only PDF files");
      return;
    }

    // Add to selected files
    setSelectedFiles(prev => [...prev, ...pdfFiles]);

    // Add to uploading queue with initial state
    const newUploadingFiles: UploadingFile[] = pdfFiles.map(file => ({
      file,
      uploadProgress: 0,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(file => file !== fileToRemove));
    setUploadingFiles(prev => prev.filter(u => u.file !== fileToRemove));
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;

    // Upload each file
    for (const file of selectedFiles) {
      await uploadFile(file);
    }

    // Clear selected files after upload
    setSelectedFiles([]);
  };

  const handleDeleteBidResponse = (id: string) => {
    if (confirm("Are you sure you want to delete this PDF?")) {
      setBidResponses(bidResponses.filter((response) => response.id !== id));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === "application/pdf");

    if (pdfFiles.length > 0) {
      // Add to selected files
      setSelectedFiles(prev => [...prev, ...pdfFiles]);

      // Add to uploading queue
      const newUploadingFiles: UploadingFile[] = pdfFiles.map(file => ({
        file,
        uploadProgress: 0,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      setUploadingFiles(prev => [...prev, ...newUploadingFiles]);
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
        <p className="text-gray-600 mt-1">Manage Bid Response PDFs</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bid Response PDFs</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} />
                Add PDFs
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload PDF Files</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Select multiple PDF files to upload
                </p>
              </DialogHeader>

              <div className="space-y-4">
                {/* File Upload Area */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700">
                    Click to select PDF files
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or drag and drop PDF files here
                  </p>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-700">
                      Selected Files ({selectedFiles.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-red-500" />
                            <div className="max-w-[200px]">
                              <p className="font-medium text-xs truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(file);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {uploadingFiles.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-700">
                      Uploading Files
                    </h3>
                    <div className="space-y-2">
                      {uploadingFiles.map((uploadingFile) => (
                        <div
                          key={uploadingFile.id}
                          className="p-2 bg-blue-50 rounded-lg border border-blue-100"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-medium text-xs truncate max-w-[180px]">
                              {uploadingFile.file.name}
                            </p>
                            <span className="text-xs font-medium">
                              {uploadingFile.uploadProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadingFile.uploadProgress}%` }}
                            />
                          </div>
                          {uploadingFile.error && (
                            <p className="text-xs text-red-500 mt-1">
                              {uploadingFile.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => setIsDialogOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUploadAll}
                    disabled={selectedFiles.length === 0 || isUploading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} File(s)`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bidResponses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto" />
                        <p className="text-gray-500">No PDFs uploaded yet</p>
                        <p className="text-sm text-gray-400">
                          Click "Add PDFs" to upload bid response documents
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  bidResponses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{response.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{response.fileSize}</TableCell>
                      <TableCell>{response.uploadDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(response.documentUrl, '_blank')}
                            title="View PDF"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = response.documentUrl;
                              link.download = response.fileName;
                              link.click();
                            }}
                            title="Download"
                          >
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
                        </div>
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