
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, BarChart, Award, MessageSquare, Settings, ShieldAlert } from "lucide-react";
import { Navigate } from 'react-router-dom';

// Define types for the components
interface AdminUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

interface Customer {
  id: string;
  email: string;
  businessName: string;
  gamesPlayed: number;
  currentPlayers: number;
  registeredPlayers: number;
  createdAt: string;
  lastActive: string;
}

interface StatusBarSettings {
  enabled: boolean;
  message: string;
}

const SiteAdmin = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentTab, setCurrentTab] = useState("customers");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [statusBar, setStatusBar] = useState<StatusBarSettings>({
    enabled: false,
    message: "Welcome to TriviaPulse! Check out our latest features."
  });

  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }
        
        // For demo purposes, we'll hard-code the admin email
        const isAdmin = session.user.email === 'lyonrt@gmail.com';
        
        // In a real app, we'd check against a database of admin users
        // const { data, error } = await supabase
        //   .from('admin_users')
        //   .select('*')
        //   .eq('user_id', session.user.id)
        //   .single();
        
        setIsAuthorized(isAdmin);
        
        // If admin, load the required data
        if (isAdmin) {
          await Promise.all([
            loadCustomers(),
            loadAdminUsers(),
            loadStatusBarSettings()
          ]);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast({
          title: "Error",
          description: "Failed to verify admin privileges.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [toast]);
  
  // Load customers data
  const loadCustomers = async () => {
    // This would typically fetch from the database
    // For demo, we'll use mock data
    const mockCustomers: Customer[] = [
      {
        id: "1",
        email: "pub1@example.com",
        businessName: "The Thirsty Scholar",
        gamesPlayed: 23,
        currentPlayers: 0,
        registeredPlayers: 145,
        createdAt: "2024-03-01",
        lastActive: "2024-04-14"
      },
      {
        id: "2",
        email: "pub2@example.com",
        businessName: "Game Night Bar",
        gamesPlayed: 15,
        currentPlayers: 12,
        registeredPlayers: 87,
        createdAt: "2024-02-15",
        lastActive: "2024-04-15"
      },
      {
        id: "3",
        email: "pub3@example.com",
        businessName: "Trivia Tavern",
        gamesPlayed: 31,
        currentPlayers: 8,
        registeredPlayers: 203,
        createdAt: "2024-01-12",
        lastActive: "2024-04-16"
      }
    ];
    
    setCustomers(mockCustomers);
    
    // In a real app, you'd fetch from Supabase
    // const { data, error } = await supabase
    //   .from('profiles')
    //   .select('*')
    //   .order('created_at', { ascending: false });
    
    // if (error) {
    //   console.error("Error loading customers:", error);
    //   toast({
    //     title: "Error",
    //     description: "Failed to load customer data.",
    //     variant: "destructive",
    //   });
    //   return;
    // }
    
    // setCustomers(data || []);
  };
  
  // Load admin users
  const loadAdminUsers = async () => {
    // For demo purposes
    const mockAdmins: AdminUser[] = [
      {
        id: "1",
        email: "lyonrt@gmail.com",
        isAdmin: true
      }
    ];
    
    setAdminUsers(mockAdmins);
    
    // In a real app:
    // const { data, error } = await supabase
    //   .from('admin_users')
    //   .select('*');
    
    // if (error) {
    //   console.error("Error loading admin users:", error);
    //   return;
    // }
    
    // setAdminUsers(data || []);
  };
  
  // Load status bar settings
  const loadStatusBarSettings = async () => {
    // For demo, we'll use localStorage
    const savedSettings = localStorage.getItem('trivia-status-bar');
    if (savedSettings) {
      setStatusBar(JSON.parse(savedSettings));
    }
    
    // In a real app:
    // const { data, error } = await supabase
    //   .from('app_settings')
    //   .select('*')
    //   .eq('key', 'status_bar')
    //   .single();
    
    // if (error) {
    //   console.error("Error loading status bar settings:", error);
    //   return;
    // }
    
    // if (data) {
    //   setStatusBar(data.value);
    // }
  };
  
  // Add new admin
  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if already an admin
    if (adminUsers.some(admin => admin.email === newAdminEmail)) {
      toast({
        title: "Already Admin",
        description: "This email is already an admin.",
        variant: "destructive",
      });
      return;
    }
    
    // For demo purposes
    const newAdmin: AdminUser = {
      id: `admin_${Date.now()}`,
      email: newAdminEmail,
      isAdmin: true
    };
    
    setAdminUsers([...adminUsers, newAdmin]);
    setNewAdminEmail("");
    
    toast({
      title: "Admin Added",
      description: `${newAdminEmail} has been added as an admin.`,
    });
    
    // In a real app:
    // const { data, error } = await supabase
    //   .from('admin_users')
    //   .insert([{ email: newAdminEmail, is_admin: true }]);
    
    // if (error) {
    //   console.error("Error adding admin:", error);
    //   toast({
    //     title: "Error",
    //     description: "Failed to add admin user.",
    //     variant: "destructive",
    //   });
    //   return;
    // }
    
    // toast({
    //   title: "Admin Added",
    //   description: `${newAdminEmail} has been added as an admin.`,
    // });
    
    // await loadAdminUsers();
  };
  
  // Update status bar settings
  const handleStatusBarUpdate = () => {
    // Save to localStorage for demo
    localStorage.setItem('trivia-status-bar', JSON.stringify(statusBar));
    
    toast({
      title: "Status Bar Updated",
      description: "Status bar settings have been updated.",
    });
    
    // In a real app:
    // const { error } = await supabase
    //   .from('app_settings')
    //   .upsert([{ key: 'status_bar', value: statusBar }]);
    
    // if (error) {
    //   console.error("Error updating status bar:", error);
    //   toast({
    //     title: "Error",
    //     description: "Failed to update status bar settings.",
    //     variant: "destructive",
    //   });
    //   return;
    // }
  };
  
  // If user is not authorized, redirect to dashboard
  if (!loading && !isAuthorized) {
    return <Navigate to="/admin/dashboard" />;
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-2 text-xl">Verifying admin privileges...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Site Administration</h1>
          <p className="text-muted-foreground">
            Manage customers, settings, and site-wide features
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <span className="text-destructive font-semibold">Admin Access Only</span>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="admins">Admin Users</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Site Settings</TabsTrigger>
        </TabsList>
        
        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Customer Management
              </CardTitle>
              <CardDescription>
                View and manage customer accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Games Played</TableHead>
                    <TableHead>Registered Players</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.businessName}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.gamesPlayed}</TableCell>
                      <TableCell>{customer.registeredPlayers}</TableCell>
                      <TableCell>{customer.lastActive}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Manage</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Admin Users Tab */}
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2" />
                Admin Users
              </CardTitle>
              <CardDescription>
                Manage users with administrative privileges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Email address"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
                <Button onClick={handleAddAdmin}>Add Admin</Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={admin.email === 'lyonrt@gmail.com'} // Prevent removing the main admin
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2" />
                Platform Statistics
              </CardTitle>
              <CardDescription>
                Overview of platform usage and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{customers.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Games Played</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {customers.reduce((sum, customer) => sum + customer.gamesPlayed, 0)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Registered Players</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {customers.reduce((sum, customer) => sum + customer.registeredPlayers, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Site Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Site-wide Settings
              </CardTitle>
              <CardDescription>
                Configure global app settings and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Bar Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Status Bar</h3>
                    <p className="text-sm text-muted-foreground">
                      Display an announcement bar at the top of the site for all users
                    </p>
                  </div>
                  <Switch
                    checked={statusBar.enabled}
                    onCheckedChange={(checked) => 
                      setStatusBar({ ...statusBar, enabled: checked })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="statusMessage">Status Message</Label>
                  <Textarea
                    id="statusMessage"
                    placeholder="Enter status bar message"
                    value={statusBar.message}
                    onChange={(e) => setStatusBar({ ...statusBar, message: e.target.value })}
                    rows={2}
                    disabled={!statusBar.enabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be shown on the landing page and when establishment owners log in.
                  </p>
                </div>
                
                <Button onClick={handleStatusBarUpdate}>Save Status Bar Settings</Button>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Default Trivia Slides</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage default trivia slides for all customers
                    </p>
                  </div>
                  <Button>Manage Default Slides</Button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Question Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage the default question library
                    </p>
                  </div>
                  <Button onClick={() => window.location.href = '/admin/import'}>
                    Import Questions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteAdmin;
