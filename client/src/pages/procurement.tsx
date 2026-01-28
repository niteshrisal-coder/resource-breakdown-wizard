import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutShell } from "@/components/layout-shell";
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
import { Plus, Trash2 } from "lucide-react";
// import { BidResponse } from "./bidresponse";

interface Project {
  id: string;
  name: string;
  createdDate: string;
}

const Procurement = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Construction Project A",
      createdDate: "2026-01-10",
    },
    {
      id: "2",
      name: "Building Project B",
      createdDate: "2026-01-15",
    },
  ]);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");

  const handleAddProject = () => {
    if (projectName.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: projectName,
        createdDate: new Date().toISOString().split("T")[0],
      };
      setProjects([...projects, newProject]);
      setProjectName("");
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((project) => project.id !== id));
  };

  const handleDoubleClick = (project: Project) => {
    setSelectedProject(project);
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Procurement Management
            </h1>
            <p className="text-gray-500 mt-2">Manage your projects</p>
          </div>
        </div>

        {!selectedProject ? (
          // PROJECT LIST VIEW
          <Card>
            <CardHeader>
              <CardTitle>Project List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter project name..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddProject()}
                />
                <Button onClick={handleAddProject} className="gap-2">
                  <Plus size={20} />
                  Add Project
                </Button>
              </div>

              {/* Projects Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          <p className="text-gray-500">No projects found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      projects.map((project) => (
                        <TableRow
                          key={project.id}
                          onDoubleClick={() => handleDoubleClick(project)}
                          className="cursor-pointer hover:bg-muted transition-colors"
                        >
                          <TableCell className="font-medium">
                            {project.name}
                          </TableCell>
                          <TableCell>{project.createdDate}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProject(project.id)}
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
        ) : selectedAction === "bidresponse" && selectedProject ? (
          // BID RESPONSE VIEW
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedAction(null)}
              className="gap-2"
            >
              ← Back to Actions
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Bid Response - {selectedProject.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Bid Response functionality is coming soon.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          // PROJECT ACTIONS VIEW
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedProject(null)}
              className="gap-2"
            >
              ← Back to Project List
            </Button>
            <h2 className="text-2xl font-bold">
              {selectedProject.name} - Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                className="w-full h-16 text-base"
                onClick={() => setSelectedAction("bidresponse")}
              >
                Add Bid Response Document
              </Button>
              <Button className="w-full h-16 text-base" variant="outline">
                Download All
              </Button>
              <Button className="w-full h-16 text-base">Evaluation</Button>
              <Button className="w-full h-16 text-base">Generate LOI</Button>
              <Button className="w-full h-16 text-base">Generate LOA</Button>
              <Button className="w-full h-16 text-base font-bold">
                Generate Contract Agreement
              </Button>
            </div>
          </div>
        )}
      </div>
    </LayoutShell>
  );
};

export default Procurement;
