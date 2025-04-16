
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
import { Loader2, Users, BarChart, Award, MessageSquare, Settings, ShieldAlert, Image } from "lucide-react";
import { Navigate, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Define types for the components
interface AdminUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

interface Customer {
  id: string;
  email: string;
  businessName: string | null;
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

interface DefaultSlide {
  id: string;
  title: string;
  content: string | null;
  type: string;
  imageUrl: string | null;
  enabled: boolean;
}

const SiteAdmin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentTab, setCurrentTab] = useState("customers");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [defaultSlides, setDefaultSlides] = useState<DefaultSlide[]>([]);
  const [selectedSlide, setSelectedSlide] = useState<DefaultSlide | null>(null);
  const [isEditingSlide, setIsEditingSlide] = useState(false);
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
            loadStatusBarSettings(),
            loadDefaultSlides()
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
    try {
      // Get all profiles with their user data
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Fetch game counts from games table
      const { data: games } = await supabase
        .from('games')
        .select('*');
      
      // Fetch player counts
      const { data: players } = await supabase
        .from('players')
        .select('*');
      
      // Fetch registered player counts
      const { data: registeredPlayers } = await supabase
        .from('registered_players')
        .select('*');
      
      // Transform data to customer format
      const customerData: Customer[] = (profiles || []).map(profile => {
        // Count games for this profile owner
        const userGames = (games || []).filter(game => {
          // Assuming some relationship between game and owner
          // This would need to be adjusted based on actual data structure
          return true; // Placeholder for actual relation
        }).length;
        
        // Count current active players
        const activePlayerCount = (players || []).filter(player => {
          // Filter active players for this profile owner
          return player.is_active;
        }).length;
        
        // Count registered players for this profile owner
        const registeredPlayerCount = (registeredPlayers || []).length;
        
        // Get user email from auth.users (mock for now)
        const userEmail = "user@example.com"; // Placeholder
        
        return {
          id: profile.id,
          email: userEmail,
          businessName: profile.business_name,
          gamesPlayed: userGames,
          currentPlayers: activePlayerCount,
          registeredPlayers: registeredPlayerCount,
          createdAt: profile.created_at,
          lastActive: profile.updated_at
        };
      });
      
      setCustomers(customerData);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customer data.",
        variant: "destructive",
      });
    }
  };
  
  // Load admin users
  const loadAdminUsers = async () => {
    // For now, we'll just load the hardcoded admin
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
  
  // Load default slides
  const loadDefaultSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .is('owner_id', null);
      
      if (error) {
        throw error;
      }
      
      const formattedSlides: DefaultSlide[] = (data || []).map(slide => ({
        id: slide.id,
        title: slide.title,
        content: slide.content,
        type: slide.type,
        imageUrl: slide.image_url,
        enabled: slide.enabled
      }));
      
      setDefaultSlides(formattedSlides);
    } catch (error) {
      console.error("Error loading default slides:", error);
      toast({
        title: "Error",
        description: "Failed to load default slides.",
        variant: "destructive",
      });
    }
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
  
  // Handle clicking on Manage Default Slides
  const handleManageDefaultSlides = () => {
    setCurrentTab("settings");
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
              {customers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No customer data available</p>
                </div>
              ) : (
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
                        <TableCell className="font-medium">{customer.businessName || "Not specified"}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.gamesPlayed}</TableCell>
                        <TableCell>{customer.registeredPlayers}</TableCell>
                        <TableCell>{new Date(customer.lastActive).toLocaleDateString()}</TableCell>
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
              )}
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
                  <Button onClick={() => navigate('/admin/intermission')}>
                    Manage Default Slides
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between mt-4">
                  <h3 className="text-lg font-medium">Default Slides Library</h3>
                  <Button variant="outline" size="sm" onClick={loadDefaultSlides}>
                    Refresh
                  </Button>
                </div>
                
                {defaultSlides.length === 0 ? (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No default slides available</p>
                    <Button className="mt-4" size="sm" onClick={() => navigate('/admin/intermission')}>
                      Create Default Slides
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {defaultSlides.map((slide) => (
                      <Card key={slide.id} className={!slide.enabled ? "opacity-50" : ""}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex justify-between">
                            <span>{slide.title}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${slide.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {slide.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </CardTitle>
                          <CardDescription>
                            {slide.type}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-24 overflow-hidden">
                          {slide.type === 'image' && slide.imageUrl ? (
                            <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                              <Image className="h-8 w-8 text-muted-foreground" />
                            </div>
                          ) : (
                            <p className="line-clamp-3 text-sm text-muted-foreground">
                              {slide.content || 'No content'}
                            </p>
                          )}
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => navigate(`/admin/intermission?slideId=${slide.id}`)}
                          >
                            Edit
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Question Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage the default question library
                    </p>
                  </div>
                  <Button onClick={() => navigate('/admin/import')}>
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
