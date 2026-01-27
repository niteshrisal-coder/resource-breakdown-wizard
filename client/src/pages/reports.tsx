import { LayoutShell } from "@/components/layout-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useWorkItems, useResourceColumns } from "@/hooks/use-quantity-data";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { AlertCircle, TrendingUp, Package } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Reports() {
  const { data: workItems } = useWorkItems();
  const { data: columns } = useResourceColumns();

  // Aggregate resource totals
  const resourceTotals = columns?.map(col => {
    const totalQuantity = workItems?.reduce((sum, item) => {
      const constant = item.constants.find(c => c.resourceColumnId === col.id);
      const val = constant ? parseFloat(constant.constantValue) : 0;
      const itemTotal = val * parseFloat(item.quantity);
      return sum + itemTotal;
    }, 0) || 0;

    return {
      name: col.name,
      value: parseFloat(totalQuantity.toFixed(2)),
      unit: col.unit
    };
  }) || [];

  const hasData = resourceTotals.some(r => r.value > 0);

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Project Reports</h1>
          <p className="text-muted-foreground mt-1">Overview of total material requirements.</p>
        </div>

        {!hasData ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Data Available</h3>
              <p className="text-muted-foreground text-center max-w-sm mt-2">
                Add work items and resource constants to visualize your project requirements.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Summary Cards */}
            <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {resourceTotals.map((resource, i) => (
                <Card key={resource.name} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {resource.name}
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-display text-primary">
                      {resource.value.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total {resource.unit} required
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Resource Distribution</CardTitle>
                <CardDescription>Visual breakdown of materials</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resourceTotals}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {resourceTotals.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Material Requirements</CardTitle>
                <CardDescription>Total quantities by resource type</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceTotals}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
