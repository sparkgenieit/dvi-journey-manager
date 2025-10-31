import { Users, Car, UserSquare2, TrendingDown, Calendar, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="p-8 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Welcome back, Admin 👋
        </h3>
        <p className="text-muted-foreground">
          Your progress this week is Awesome. Let's keep it up and get a lot of points reward!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Agents */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-none">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Agents</p>
              <p className="text-3xl font-bold text-purple-600">263</p>
            </div>
          </div>
        </Card>

        {/* Total Driver */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-none">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Driver</p>
              <p className="text-3xl font-bold text-blue-600">122</p>
            </div>
          </div>
        </Card>

        {/* Total Guide */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-none">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <UserSquare2 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Guide</p>
              <p className="text-3xl font-bold text-orange-600">1</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Profit Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last Month Profit */}
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Last Month Profit</p>
            <p className="text-xs text-muted-foreground">October 2025</p>
            <p className="text-3xl font-bold">₹ 497,538.00</p>
          </div>
        </Card>

        {/* Current Month Profit */}
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current Month Profit</p>
            <p className="text-xs text-muted-foreground">November 2025</p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold">₹ 151,543.00</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                <TrendingDown className="h-3 w-3" />
                69.54%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Itineraries */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold mb-1">28521</p>
              <p className="text-sm text-muted-foreground">Total Itineraries</p>
            </div>
            <div className="text-6xl">🧳</div>
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold mb-1">₹ 23,783,241.00</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <div className="text-6xl">💰</div>
          </div>
        </Card>

        {/* Vehicle Overview */}
        <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white border-none row-span-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-1">Vehicle Overview</h3>
              <p className="text-sm text-white/90">Insights into Fleet Performance</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="text-2xl font-bold">287</p>
                <p className="text-xs text-white/90">Total Vehicles</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="text-2xl font-bold">15</p>
                <p className="text-xs text-white/90">On Route Vehicles</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="text-2xl font-bold">273</p>
                <p className="text-xs text-white/90">Available Vehicles</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="text-2xl font-bold">15</p>
                <p className="text-xs text-white/90">Upcoming Vehicles</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="text-8xl opacity-30">🚗</div>
            </div>
          </div>
        </Card>

        {/* Total Confirm Bookings */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold mb-1">714</p>
              <p className="text-sm text-muted-foreground">Total Confirm Bookings</p>
            </div>
            <div className="text-6xl">📅</div>
          </div>
        </Card>

        {/* Cancelled Booking */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold mb-1">20</p>
              <p className="text-sm text-muted-foreground">Cancelled Booking</p>
            </div>
            <div className="text-6xl">📆</div>
          </div>
        </Card>
      </div>

      {/* Daily Moment and Star Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Moment */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Daily Moment</h3>
            <input 
              type="date" 
              defaultValue="2025-11-01"
              className="px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer">
              <Truck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary">DVI10202520</p>
                <p className="text-sm text-muted-foreground">Arrival</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer">
              <Truck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary">DVI10202519</p>
                <p className="text-sm text-muted-foreground">Arrival</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Star Performers */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-1">Star Performers</h3>
            <p className="text-sm text-muted-foreground">
              Top-Rated Agents, Travel Expert, Guides and Vendors
            </p>
          </div>
          
          <div className="flex gap-2 mb-4 border-b border-border">
            <button className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary">
              Agents
            </button>
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Travel Expert
            </button>
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Guides
            </button>
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Vendors
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium">M</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">MMT</p>
              <p className="text-sm text-muted-foreground">7708322045</p>
            </div>
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <span className="text-lg">▲</span>
              <span>60%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
