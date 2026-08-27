import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Plus, 
  LogOut, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Edit,
  Trash2,
  Receipt,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import farmikLogo from "@/assets/logo-farmik.png";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

interface NewProduct {
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  category: string;
}

interface CustomerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

interface OrderRecord {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address?: string;
  profiles?: CustomerProfile;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  created_at: string;
}

const ALLOWED_ADMINS = [
  "annupusa01@gmail.com",
  "annu_pusa@yahoo.co.in",
  "lakshyaj8779@gmail.com",
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // View Message Detail Modal State
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: "",
    description: "",
    price: 0,
    image_url: "",
    stock_quantity: 0,
    category: "mustard-oil",
  });

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const adminSession = localStorage.getItem("adminSession");
      
      const sessionEmail = session?.user?.email?.toLowerCase().trim() || 
                           (adminSession ? JSON.parse(adminSession).email : null);

      if (!sessionEmail || !ALLOWED_ADMINS.includes(sessionEmail)) {
        toast({
          title: "Unauthorized",
          description: "Please sign in with an authorized admin email.",
          variant: "destructive",
        });
        navigate("/admin/login");
        return;
      }

      // Automatically sync admin role if logged in with Supabase auth session
      if (session?.user) {
        const { error: roleError } = await supabase
          .from('profiles')
          .upsert({
            user_id: session.user.id,
            email: sessionEmail,
            role: 'admin',
            full_name: session.user.user_metadata?.full_name || 'Admin'
          }, { onConflict: 'user_id' });

        if (roleError) {
          console.error("Failed to auto-sync admin role in profile:", roleError);
        }
      }

      await Promise.all([fetchProducts(), fetchCustomers(), fetchOrders(), fetchContactMessages()]);
    } catch (err) {
      console.error("Auth check failed:", err);
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchContactMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adminSession");
    toast({
      title: "Logged out",
      description: "Admin session ended.",
    });
    navigate("/");
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...newProduct, is_active: true }])
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [data, ...prev]);
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        image_url: "",
        stock_quantity: 0,
        category: "mustard-oil",
      });

      toast({
        title: "Product Created",
        description: "New product has been listed.",
      });
      setActiveTab("products");
    } catch (error: any) {
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditOpen = (product: Product) => {
    setEditingProduct({ ...product });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price,
          stock_quantity: editingProduct.stock_quantity,
          image_url: editingProduct.image_url,
          category: editingProduct.category,
          is_active: editingProduct.is_active,
        })
        .eq('id', editingProduct.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Updates denied. Your admin session does not have database write permission (RLS). Please log out and log back in to sync permissions.");
      }

      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
      setIsEditDialogOpen(false);
      setEditingProduct(null);

      toast({
        title: "Product Updated",
        description: "Price, stock, and details saved.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({
        title: "Product Deleted",
        description: "Item removed from inventory.",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Updates denied. Your admin session does not have database write permission (RLS). Please log out and log back in to sync permissions.");
      }

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ));

      toast({
        title: "Status Updated",
        description: `Product ${!currentStatus ? 'activated' : 'deactivated'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Status change failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Contact Message Management Handlers
  const handleUpdateMessageStatus = async (messageId: string, newStatus: "new" | "read" | "replied") => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: newStatus } : m));
      if (selectedMessage && selectedMessage.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast({
        title: "Status Updated",
        description: `Enquiry marked as ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this enquiry message?")) return;
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      setIsMessageDialogOpen(false);
      setSelectedMessage(null);

      toast({
        title: "Enquiry Deleted",
        description: "Message removed.",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenMessageModal = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setIsMessageDialogOpen(true);
    if (msg.status === "new") {
      handleUpdateMessageStatus(msg.id, "read");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeProducts = products.filter(p => p.is_active).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const newMessagesCount = messages.filter(m => m.status === "new").length;

  return (
    <div className="min-h-screen bg-[#FAF9F5] pt-24 pb-16">
      {/* Header */}
      <header className="border-b border-emerald-950/10 bg-white mb-8 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={farmikLogo} alt="FARMIK logo" className="h-9 w-auto text-[#2D5A27]" />
            <div>
              <h1 className="text-2xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                FARMIK Admin Portal
              </h1>
              <p className="text-xs text-gray-500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Managing products, orders, customers, and user contact enquiries
              </p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-white border border-emerald-950/10 p-1 rounded-xl shadow-xs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="queries" className="relative">
              Enquiries ({messages.length})
              {newMessagesCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                  {newMessagesCount} New
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card className="bg-white border-emerald-950/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Products</CardTitle>
                  <Package className="h-4 w-4 text-[#2D5A27]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{products.length}</div>
                  <p className="text-xs text-emerald-700 font-medium">{activeProducts} active in store</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-emerald-950/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Inventory Stock</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-[#2D5A27]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{totalStock}</div>
                  <p className="text-xs text-gray-500">total units available</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-emerald-950/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contact Enquiries</CardTitle>
                  <MessageSquare className="h-4 w-4 text-[#2D5A27]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
                  <p className="text-xs text-emerald-700 font-bold">{newMessagesCount} unread messages</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-emerald-950/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Registered Users</CardTitle>
                  <Users className="h-4 w-4 text-[#2D5A27]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
                  <p className="text-xs text-gray-500">customer profiles</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-emerald-950/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Orders</CardTitle>
                  <Receipt className="h-4 w-4 text-[#2D5A27]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                  <p className="text-xs text-gray-500">customer transactions</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contact Enquiries / Messages Section */}
          <TabsContent value="queries">
            <Card className="bg-white border-emerald-950/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Customer Contact Enquiries
                  </CardTitle>
                  <p className="text-xs text-gray-500">Messages submitted through the Contact Us form</p>
                </div>
                <Badge variant="outline" className="border-emerald-700 text-emerald-800 bg-emerald-50">
                  {newMessagesCount} Unread
                </Badge>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No contact messages received yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-gray-100 bg-gray-50 text-gray-600 uppercase text-[11px] font-bold tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Contact Info</th>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {messages.map((msg) => (
                          <tr key={msg.id} className={`hover:bg-emerald-50/40 transition-colors ${msg.status === "new" ? "bg-emerald-50/20 font-medium" : ""}`}>
                            <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                              {new Date(msg.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-gray-900">{msg.name}</td>
                            <td className="py-3.5 px-4 text-xs text-gray-600">
                              <div>{msg.email}</div>
                              {msg.phone && <div className="text-gray-400">{msg.phone}</div>}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-gray-800 max-w-xs truncate">{msg.subject}</td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                msg.status === "new" 
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : msg.status === "read"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              }`}>
                                {msg.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenMessageModal(msg)}
                                  className="h-8 px-2.5 text-xs border-emerald-950/20 text-[#1A3C2A] hover:bg-emerald-50"
                                  title="View Full Enquiry"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="h-8 w-8 p-0"
                                  title="Delete Message"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Products */}
          <TabsContent value="products">
            <Card className="bg-white border-emerald-950/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Products & Inventory</CardTitle>
                <Button onClick={() => setActiveTab("add-product")} size="sm" className="bg-[#1A3C2A] hover:bg-[#2D5A27] text-white">
                  <Plus className="h-4 w-4 mr-1" /> Add Product
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden bg-white border border-gray-100 shadow-xs">
                      <div className="aspect-[4/3] bg-muted relative">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <Badge 
                          variant={product.is_active ? "default" : "secondary"}
                          className={`absolute top-2 right-2 ${product.is_active ? "bg-[#1A3C2A]" : "bg-gray-500"}`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-base mb-1 text-gray-900">{product.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-bold text-sm text-[#1A3C2A]">₹{product.price}</span>
                          <span className="text-xs text-gray-600">
                            Stock: <strong>{product.stock_quantity}</strong>
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditOpen(product)}
                            className="flex-1 text-xs"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleProductStatus(product.id, product.is_active)}
                            className="text-xs"
                          >
                            {product.is_active ? "Hide" : "Show"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="w-8 h-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers */}
          <TabsContent value="customers">
            <Card className="bg-white border-emerald-950/10">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Customer Directory</CardTitle>
              </CardHeader>
              <CardContent>
                {customers.length === 0 ? (
                  <p className="text-gray-500 text-sm py-6">No customer profiles found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-gray-100 bg-gray-50 text-gray-600 uppercase text-[11px] font-bold">
                        <tr>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Joined Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {customers.map((c) => (
                          <tr key={c.id} className="hover:bg-emerald-50/40">
                            <td className="py-3 px-4 font-medium text-gray-900">{c.full_name || "N/A"}</td>
                            <td className="py-3 px-4 text-gray-600">{c.email || "N/A"}</td>
                            <td className="py-3 px-4 text-gray-600">{c.phone || "N/A"}</td>
                            <td className="py-3 px-4 text-gray-500 text-xs">
                              {new Date(c.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders">
            <Card className="bg-white border-emerald-950/10">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-sm py-6">No orders recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-gray-100 bg-gray-50 text-gray-600 uppercase text-[11px] font-bold">
                        <tr>
                          <th className="py-3 px-4">Order ID</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map((o) => (
                          <tr key={o.id} className="hover:bg-emerald-50/40">
                            <td className="py-3 px-4 font-mono text-xs text-gray-700">{o.id.slice(0, 8)}...</td>
                            <td className="py-3 px-4 text-gray-900 font-medium">{o.profiles?.full_name || o.user_id}</td>
                            <td className="py-3 px-4 font-bold text-[#1A3C2A]">₹{o.total_amount}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-emerald-700 text-emerald-800">{o.status || "Completed"}</Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-500 text-xs">
                              {new Date(o.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Product Tab */}
          <TabsContent value="add-product">
            <Card className="bg-white border-emerald-950/10">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Add New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={newProduct.stock_quantity}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={newProduct.image_url}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, image_url: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      required
                    />
                  </div>

                  <Button type="submit" className="bg-[#1A3C2A] hover:bg-[#2D5A27] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Product Modal */}
      {isEditDialogOpen && editingProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#1A3C2A]">Edit Product — {editingProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (₹)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stock Quantity</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-image">Image URL</Label>
                <Input
                  id="edit-image"
                  value={editingProduct.image_url}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} className="bg-[#1A3C2A] hover:bg-[#2D5A27] text-white">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Contact Enquiry Modal */}
      {isMessageDialogOpen && selectedMessage && (
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Enquiry Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Sender Name</p>
                  <p className="font-bold text-gray-900">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Received Date</p>
                  <p className="text-gray-700 text-xs">
                    {new Date(selectedMessage.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#2D5A27]" />
                  <a href={`mailto:${selectedMessage.email}`} className="text-xs text-emerald-800 font-semibold underline">
                    {selectedMessage.email}
                  </a>
                </div>
                {selectedMessage.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#2D5A27]" />
                    <a href={`tel:${selectedMessage.phone}`} className="text-xs text-emerald-800 font-semibold underline">
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">Subject</p>
                <p className="font-semibold text-gray-900">{selectedMessage.subject}</p>
              </div>

              <div className="bg-[#FAF9F5] p-4 rounded-xl border border-emerald-950/10">
                <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">Message Content</p>
                <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-gray-600">Update Status:</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={selectedMessage.status === "read" ? "default" : "outline"}
                    onClick={() => handleUpdateMessageStatus(selectedMessage.id, "read")}
                    className="text-xs h-8"
                  >
                    Mark Read
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedMessage.status === "replied" ? "default" : "outline"}
                    onClick={() => handleUpdateMessageStatus(selectedMessage.id, "replied")}
                    className="text-xs h-8 bg-emerald-800 text-white hover:bg-emerald-900"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Replied
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="destructive"
                onClick={() => handleDeleteMessage(selectedMessage.id)}
                size="sm"
              >
                Delete Enquiry
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsMessageDialogOpen(false)}
                size="sm"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminDashboard;