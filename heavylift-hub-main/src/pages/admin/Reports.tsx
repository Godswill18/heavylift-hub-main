import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNaira } from '@/types';
import { Download, TrendingUp, Users, Package, DollarSign } from 'lucide-react';

const AdminReports = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">Platform insights and export data</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="30">
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatNaira(45000000), change: '+18%', icon: DollarSign },
          { label: 'New Users', value: '234', change: '+12%', icon: Users },
          { label: 'Bookings', value: '156', change: '+8%', icon: Package },
          { label: 'Conversion Rate', value: '24%', change: '+3%', icon: TrendingUp },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm text-emerald-600">{metric.change} vs last period</p>
                </div>
                <metric.icon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Revenue Over Time</CardTitle></CardHeader><CardContent className="h-64 flex items-center justify-center text-muted-foreground">Chart placeholder</CardContent></Card>
        <Card><CardHeader><CardTitle>Equipment Categories</CardTitle></CardHeader><CardContent className="h-64 flex items-center justify-center text-muted-foreground">Chart placeholder</CardContent></Card>
        <Card><CardHeader><CardTitle>Top Locations</CardTitle></CardHeader><CardContent className="h-64 flex items-center justify-center text-muted-foreground">Chart placeholder</CardContent></Card>
        <Card><CardHeader><CardTitle>User Growth</CardTitle></CardHeader><CardContent className="h-64 flex items-center justify-center text-muted-foreground">Chart placeholder</CardContent></Card>
      </div>
    </div>
  );
};

export default AdminReports;
