import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  LogOut, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Edit,
  Trash2,
  Upload,
  UserCheck,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: "",
    description: "",
    price: 0,
    image_url: "",
    stock_quantity: 0,
    category: "mustard-oil",
  });

  // Product edit states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Customer & Order history states
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const allowedEmails = [
        "annupusa01@gmail.com",
        "annu_pusa@yahoo.co.in",
        "lakshyaj8779@gmail.com"
      ];
      
      const { data: { user } } = await supabase.auth.getUser();
      const adminSession = localStorage.getItem("adminSession");
      const sessionData = adminSession ? JSON.parse(adminSession) : null;
      const userEmail = user?.email || sessionData?.email;

      if (!userEmail || !allowedEmails.includes(userEmail.toLowerCase().trim())) {
        toast({
          title: "Access Denied",
          description: "You are not authorized to view the Admin Dashboard",
          variant: "destructive",
        });
        navigate("/admin/login");
        return;
      }

      // Automatically elevate profile role in profiles table to 'admin' so they bypass RLS
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profile && profile.role !== 'admin') {
          await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('user_id', user.id);
        } else if (!profile) {
          await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || 'Admin',
              role: 'admin'
            });
        }
      }

      await fetchProducts();
      await fetchCustomersAndOrders();
    };

    checkAdmin();
  }, [navigate]);

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
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersAndOrders = async () => {
    setOrdersLoading(true);
    try {
      // Fetch customer profiles
      const { data: customerData, error: customerError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (customerError) throw customerError;
      setCustomers(customerData || []);

      // Fetch orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;
      setOrders(orderData || []);
    } catch (error) {
      console.error('Error fetching customers/orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adminSession");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/");
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...newProduct,
          is_active: true,
        }])
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
        title: "Success!",
        description: "Product added successfully",
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({
        title: "Success!",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ));

      toast({
        title: "Success!",
        description: `Product ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  const handleOpenEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price,
          image_url: editingProduct.image_url,
          stock_quantity: editingProduct.stock_quantity,
          category: editingProduct.category,
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id ? { ...p, ...editingProduct } : p
      ));

      toast({
        title: "Success!",
        description: "Product updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus as any })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));

      toast({
        title: "Order Updated",
        description: `Order status set to ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeProducts = products.filter(p => p.is_active).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <Button onClick={handleLogout} variant="outline" className="farm-hover">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Manage Products</TabsTrigger>
            <TabsTrigger value="add-product">Add Product</TabsTrigger>
            <TabsTrigger value="customers-orders">Customers & Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="farm-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeProducts} active
                  </p>
                </CardContent>
              </Card>

              <Card className="farm-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStock}</div>
                  <p className="text-xs text-muted-foreground">
                    units available
                  </p>
                </CardContent>
              </Card>

              <Card className="farm-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {[...new Set(products.map(p => p.category))].length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    product categories
                  </p>
                </CardContent>
              </Card>

              <Card className="farm-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(0) : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    average product price
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">₹{product.price}</p>
                        </div>
                      </div>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Card key={product.id} className="farm-hover">
                      <CardContent className="p-4">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                        <h3 className="font-semibold mb-2">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-bold text-primary">₹{product.price}</span>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditDialog(product)}
                            className="flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleProductStatus(product.id, product.is_active)}
                          >
                            {product.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-product" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter product name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full p-2 border border-input rounded-md bg-background"
                        required
                      >
                        <option value="mustard-oil">Mustard Oil</option>
                        <option value="coconut-oil">Coconut Oil</option>
                        <option value="sesame-oil">Sesame Oil</option>
                        <option value="groundnut-oil">Groundnut Oil</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="Enter price"
                        min="0"
                        step="0.01"
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
                        placeholder="Enter stock quantity"
                        min="0"
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
                      placeholder="Enter image URL"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter product description"
                      rows={4}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 farm-hover">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers-orders" className="mt-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="farm-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{customers.length}</div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>

              <Card className="farm-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <p className="text-xs text-muted-foreground">Orders placed in total</p>
                </CardContent>
              </Card>

              <Card className="farm-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{orders.reduce((sum, o) => sum + Number(o.total_amount), 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Sum of order totals</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Customer Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-muted-foreground">
                    <thead className="text-xs text-foreground uppercase bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Address</th>
                        <th className="px-4 py-3">Joined Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id} className="border-b hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium text-foreground">{c.full_name || "N/A"}</td>
                          <td className="px-4 py-3">{c.email}</td>
                          <td className="px-4 py-3">{c.phone || "N/A"}</td>
                          <td className="px-4 py-3 max-w-xs truncate" title={c.address}>{c.address || "N/A"}</td>
                          <td className="px-4 py-3">
                            {new Date(c.created_at).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                      {customers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-muted-foreground">
                            No customers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-muted-foreground">
                    <thead className="text-xs text-foreground uppercase bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Total Amount</th>
                        <th className="px-4 py-3">Shipping Address</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => {
                        const customer = customers.find(c => c.user_id === o.user_id);
                        return (
                          <tr key={o.id} className="border-b hover:bg-muted/20">
                            <td className="px-4 py-3 font-mono text-xs text-foreground">
                              #{o.id.slice(0, 8)}
                              {o.product_details && Array.isArray(o.product_details) ? (
                                <div className="mt-2 text-xs text-muted-foreground bg-muted/40 p-2 rounded space-y-1">
                                  {o.product_details.map((item: any, idx: number) => (
                                    <div key={idx}>
                                      • {item.name} (x{item.quantity})
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-foreground">{customer?.full_name || o.customer_name || "Customer"}</p>
                              <p className="text-xs">{customer?.email || o.customer_email || "N/A"}</p>
                              <p className="text-xs text-muted-foreground">{customer?.phone || o.customer_phone}</p>
                            </td>
                            <td className="px-4 py-3">
                              {new Date(o.created_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="px-4 py-3 font-bold text-foreground">₹{Number(o.total_amount).toFixed(2)}</td>
                            <td className="px-4 py-3 max-w-xs truncate" title={o.shipping_address}>{o.shipping_address}</td>
                            <td className="px-4 py-3">
                              <Badge className="capitalize">
                                {o.status || "pending"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={o.status || "pending"}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className="p-1 border rounded bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-muted-foreground">
                            No orders found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product Info</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <form onSubmit={handleUpdateProductSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (₹)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stock Quantity</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, stock_quantity: parseInt(e.target.value) || 0 } : null)}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <select
                  id="edit-category"
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, category: e.target.value } : null)}
                  className="w-full p-2 border border-input rounded-md bg-background"
                  required
                >
                  <option value="mustard-oil">Mustard Oil</option>
                  <option value="coconut-oil">Coconut Oil</option>
                  <option value="sesame-oil">Sesame Oil</option>
                  <option value="groundnut-oil">Groundnut Oil</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Image URL</Label>
                <Input
                  id="edit-image"
                  value={editingProduct.image_url}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, image_url: e.target.value } : null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;