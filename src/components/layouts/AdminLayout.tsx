
import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { BarChart3, Book, Monitor, Settings as SettingsIcon, PauseCircle, Menu, X, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// Mock authentication state
const useAuth = () => {
  // In a real app, this would check for authentication tokens and validate them
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to true for demo
  
  const logout = () => {
    setIsAuthenticated(false);
  };
  
  return { isAuthenticated, logout };
};

const AdminLayout = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };
  
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: BarChart3 },
    { name: 'Question Library', path: '/admin/questions', icon: Book },
    { name: 'Intermission', path: '/admin/intermission', icon: PauseCircle },
    { name: 'Displays', path: '/admin/displays', icon: Monitor },
    { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
  ];
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-5 left-5 z-50 md:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-card hover:bg-card/80 text-foreground"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform transform bg-card border-r border-border md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-border">
            <h1 className="text-xl font-bold text-primary">TriviaPulse</h1>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-accent'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          
          {/* Logout */}
          <div className="border-t border-border p-4">
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-center text-muted-foreground hover:text-destructive" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <div className="flex-1 ml-0 md:ml-64">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
