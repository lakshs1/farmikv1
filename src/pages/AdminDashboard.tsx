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
  Edit, 
  Trash2, 
  Receipt, 
  MessageSquare, 
  Mail, 
  Phone, 
  Eye, 
  Sliders, 
  Tag, 
  ExternalLink,
  Power,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import farmikLogo from "@/assets/logo-farmik.png";
import { 
  Offer, 
  SliderItem, 
  PromoCode, 
  ProductVariant,
  FALLBACK_OFFERS, 
  FALLBACK_SLIDERS, 
  FALLBACK_PROMO_CODES 
} from "@/integrations/supabase/offers-and-sliders";
import { uploadImageFile, uploadMultipleImageFiles } from "@/utils/imageUpload";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp?: number;
  discount_percentage?: number;
  image_url: string;
  images?: string[];
  stock_quantity: number;
  category: string;
  is_active: boolean;
  variants?: ProductVariant[];
  created_at: string;
}

interface NewProduct {
  name: string;
  description: string;
  mrp: number;
  discount_percentage: number;
  price: number;
  image_url: string;
  images?: string[];
  stock_quantity: number;
  category: string;
  variants?: ProductVariant[];
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
  const [offers, setOffers] = useState<Offer[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Product Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: "",
    description: "",
    mrp: 450,
    discount_percentage: 20,
    price: 360,
    image_url: "",
    stock_quantity: 50,
    category: "mustard-oil",
    variants: [],
  });

  // Variant input states for Add Product and Edit Product
  const [newVarSize, setNewVarSize] = useState("");
  const [newVarMrp, setNewVarMrp] = useState<number>(450);
  const [newVarDiscount, setNewVarDiscount] = useState<number>(20);
  const [newVarPrice, setNewVarPrice] = useState<number>(360);
  const [newVarStock, setNewVarStock] = useState<number>(50);

  const [editVarSize, setEditVarSize] = useState("");
  const [editVarMrp, setEditVarMrp] = useState<number>(450);
  const [editVarDiscount, setEditVarDiscount] = useState<number>(20);
  const [editVarPrice, setEditVarPrice] = useState<number>(360);
  const [editVarStock, setEditVarStock] = useState<number>(50);

  // Image Upload Loading States
  const [isUploadingProductImgs, setIsUploadingProductImgs] = useState(false);
  const [isUploadingEditProductImgs, setIsUploadingEditProductImgs] = useState(false);
  const [isUploadingSliderImg, setIsUploadingSliderImg] = useState(false);
  const [isUploadingEditSliderImg, setIsUploadingEditSliderImg] = useState(false);

  // Offer Modals
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isEditOfferDialogOpen, setIsEditOfferDialogOpen] = useState(false);
  const [newOffer, setNewOffer] = useState({
    title: "",
    subtitle: "",
    description: "",
    banner_url: "",
    badge_text: "Special Deal",
    discount_percentage: 20,
    is_active: true,
    create_promo: true,
    promo_code: "",
    promo_discount_type: "percentage" as "percentage" | "fixed",
    promo_discount_value: 20,
    promo_min_order: 499,
  });

  // Slider Modals
  const [isSliderDialogOpen, setIsSliderDialogOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<SliderItem | null>(null);
  const [isEditSliderDialogOpen, setIsEditSliderDialogOpen] = useState(false);
  const [newSlider, setNewSlider] = useState({
    title: "",
    subtitle: "",
    description: "",
    image_url: "",
    badge_text: "Featured Offer",
    button_text: "Explore Offer",
    link_url: "",
    offer_id: "",
    display_order: 1,
    is_active: true,
  });

  // Contact Message Modal
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

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

      if (session?.user) {
        await supabase
          .from('profiles')
          .upsert({
            user_id: session.user.id,
            email: sessionEmail,
            role: 'admin',
            full_name: session.user.user_metadata?.full_name || 'Admin'
          }, { onConflict: 'user_id' });
      }

      await Promise.all([
        fetchProducts(),
        fetchOffers(),
        fetchPromoCodes(),
        fetchSliders(),
        fetchCustomers(),
        fetchOrders(),
        fetchContactMessages()
      ]);
    } catch (err) {
      console.error("Auth check failed:", err);
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  /* ── 1. Fetching Data ─────────────────────────────────────── */
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setOffers(FALLBACK_OFFERS);
      } else {
        setOffers(data as Offer[]);
      }
    } catch {
      setOffers(FALLBACK_OFFERS);
    }
  };

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setPromoCodes(FALLBACK_PROMO_CODES);
      } else {
        setPromoCodes(data as PromoCode[]);
      }
    } catch {
      setPromoCodes(FALLBACK_PROMO_CODES);
    }
  };

  const fetchSliders = async () => {
    try {
      const { data, error } = await supabase
        .from('sliders')
        .select('*, offers(*)')
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        setSliders(FALLBACK_SLIDERS);
      } else {
        setSliders(data as SliderItem[]);
      }
    } catch {
      setSliders(FALLBACK_SLIDERS);
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

  /* ── 2. Product Management Handlers ────────────────────────── */
  const handleNewProductMrpChange = (mrpVal: number, discVal: number) => {
    const finalPrice = Math.round(mrpVal * (1 - discVal / 100));
    setNewProduct(prev => ({
      ...prev,
      mrp: mrpVal,
      discount_percentage: discVal,
      price: finalPrice
    }));
  };

  const handleEditProductMrpChange = (mrpVal: number, discVal: number) => {
    if (!editingProduct) return;
    const finalPrice = Math.round(mrpVal * (1 - discVal / 100));
    setEditingProduct(prev => prev ? ({
      ...prev,
      mrp: mrpVal,
      discount_percentage: discVal,
      price: finalPrice
    }) : null);
  };

  const handleAddVariantToNewProduct = () => {
    if (!newVarSize.trim()) {
      toast({
        title: "Variant size required",
        description: "Please enter a variant size like 500ml, 1L, 5L",
        variant: "destructive",
      });
      return;
    }
    const variant: ProductVariant = {
      size: newVarSize.trim(),
      mrp: newVarMrp,
      discount_percentage: newVarDiscount,
      price: newVarPrice || Math.round(newVarMrp * (1 - newVarDiscount / 100)),
      stock_quantity: newVarStock,
    };
    setNewProduct(prev => ({
      ...prev,
      variants: [...(prev.variants || []), variant]
    }));
    setNewVarSize("");
    toast({
      title: "Variant Added",
      description: `Added ${variant.size} pack (₹${variant.price}).`,
    });
  };

  const handleRemoveVariantFromNewProduct = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddVariantToEditProduct = () => {
    if (!editVarSize.trim() || !editingProduct) {
      toast({
        title: "Variant size required",
        description: "Please enter a variant size like 500ml, 1L, 5L",
        variant: "destructive",
      });
      return;
    }
    const variant: ProductVariant = {
      size: editVarSize.trim(),
      mrp: editVarMrp,
      discount_percentage: editVarDiscount,
      price: editVarPrice || Math.round(editVarMrp * (1 - editVarDiscount / 100)),
      stock_quantity: editVarStock,
    };
    setEditingProduct(prev => prev ? ({
      ...prev,
      variants: [...(prev.variants || []), variant]
    }) : null);
    setEditVarSize("");
    toast({
      title: "Variant Added",
      description: `Added ${variant.size} pack (₹${variant.price}).`,
    });
  };

  const handleRemoveVariantFromEditProduct = (index: number) => {
    setEditingProduct(prev => prev ? ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== index)
    }) : null);
  };

  // ── Image Upload Handlers ──
  const handleNewProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingProductImgs(true);
    try {
      const uploadedUrls = await uploadMultipleImageFiles(files, "products");
      const currentImages = newProduct.images || (newProduct.image_url ? [newProduct.image_url] : []);
      const mergedImages = [...currentImages, ...uploadedUrls];
      setNewProduct(prev => ({
        ...prev,
        images: mergedImages,
        image_url: prev.image_url || mergedImages[0] || "",
      }));
      toast({
        title: "Images Uploaded",
        description: `Successfully added ${uploadedUrls.length} picture(s) to product.`,
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingProductImgs(false);
      e.target.value = "";
    }
  };

  const handleEditProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduct) return;
    setIsUploadingEditProductImgs(true);
    try {
      const uploadedUrls = await uploadMultipleImageFiles(files, "products");
      const currentImages = editingProduct.images || (editingProduct.image_url ? [editingProduct.image_url] : []);
      const mergedImages = [...currentImages, ...uploadedUrls];
      setEditingProduct(prev => prev ? ({
        ...prev,
        images: mergedImages,
        image_url: prev.image_url || mergedImages[0] || "",
      }) : null);
      toast({
        title: "Images Uploaded",
        description: `Successfully added ${uploadedUrls.length} picture(s) to product.`,
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingEditProductImgs(false);
      e.target.value = "";
    }
  };

  const handleSliderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isEdit) {
      setIsUploadingEditSliderImg(true);
    } else {
      setIsUploadingSliderImg(true);
    }

    try {
      const url = await uploadImageFile(file, "sliders");
      if (isEdit) {
        setEditingSlider(prev => prev ? ({ ...prev, image_url: url }) : null);
      } else {
        setNewSlider(prev => ({ ...prev, image_url: url }));
      }
      toast({
        title: "Slider Image Uploaded",
        description: "Picture uploaded and attached to slider.",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      if (isEdit) {
        setIsUploadingEditSliderImg(false);
      } else {
        setIsUploadingSliderImg(false);
      }
      e.target.value = "";
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const primaryImage = newProduct.image_url || (newProduct.images && newProduct.images[0]) || "";
      if (!primaryImage) {
        toast({
          title: "Product Image Required",
          description: "Please upload at least 1 image or enter an image URL for the product.",
          variant: "destructive",
        });
        return;
      }

      const insertPayload: any = {
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        mrp: newProduct.mrp,
        discount_percentage: newProduct.discount_percentage,
        image_url: primaryImage,
        images: newProduct.images && newProduct.images.length > 0 ? newProduct.images : [primaryImage],
        stock_quantity: newProduct.stock_quantity,
        category: newProduct.category,
        is_active: true,
        variants: newProduct.variants || [],
      };

      let { data, error } = await supabase
        .from('products')
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        console.warn("Retrying insert without complex fields if columns not yet added:", error);
        delete insertPayload.variants;
        delete insertPayload.images;
        const res = await supabase
          .from('products')
          .insert([insertPayload])
          .select()
          .single();
        if (res.error) throw res.error;
        data = res.data;
      }

      setProducts(prev => [data || { ...insertPayload, id: String(Date.now()), created_at: new Date().toISOString() }, ...prev]);
      setNewProduct({
        name: "",
        description: "",
        mrp: 450,
        discount_percentage: 20,
        price: 360,
        image_url: "",
        images: [],
        stock_quantity: 50,
        category: "mustard-oil",
        variants: [],
      });

      toast({
        title: "Product Created",
        description: `${insertPayload.name} added successfully with pictures.`,
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
    const mrp = product.mrp || Math.round(product.price * 1.25);
    const discount_percentage = product.discount_percentage !== undefined && product.discount_percentage !== null
      ? product.discount_percentage
      : Math.round(((mrp - product.price) / mrp) * 100);

    let parsedVariants: ProductVariant[] = [];
    if (Array.isArray(product.variants)) {
      parsedVariants = product.variants.map((v: any) => {
        if (typeof v === 'string') {
          return { size: v, price: product.price, mrp, discount_percentage };
        }
        return v;
      });
    }

    let parsedImages: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      parsedImages = product.images;
    } else if (product.image_url) {
      parsedImages = [product.image_url];
    }

    setEditingProduct({
      ...product,
      mrp,
      discount_percentage,
      variants: parsedVariants,
      images: parsedImages,
    });
    setEditVarSize("");
    setEditVarMrp(mrp);
    setEditVarDiscount(discount_percentage);
    setEditVarPrice(product.price);
    setEditVarStock(product.stock_quantity);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      const primaryImage = editingProduct.image_url || (editingProduct.images && editingProduct.images[0]) || "";
      const updatePayload: any = {
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        mrp: editingProduct.mrp,
        discount_percentage: editingProduct.discount_percentage,
        stock_quantity: editingProduct.stock_quantity,
        image_url: primaryImage,
        images: editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : [primaryImage],
        category: editingProduct.category,
        is_active: editingProduct.is_active,
        variants: editingProduct.variants || [],
      };

      const { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', editingProduct.id);

      if (error) {
        console.warn("Retrying update without extra columns if not yet added:", error);
        delete updatePayload.variants;
        delete updatePayload.images;
        const { error: retryErr } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', editingProduct.id);
        if (retryErr) throw retryErr;
      }

      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...editingProduct, image_url: primaryImage } : p));
      setIsEditDialogOpen(false);
      setEditingProduct(null);

      toast({
        title: "Product Updated",
        description: `Product details and images saved successfully.`,
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
        description: "Item removed from store.",
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
    const newStatus = !currentStatus;
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: newStatus })
        .eq('id', productId);

      if (error) console.warn("Supabase update warning:", error);

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_active: newStatus } : p
      ));

      toast({
        title: `Product ${newStatus ? 'Activated' : 'Deactivated'}`,
        description: `Product is now ${newStatus ? 'visible' : 'hidden'}.`,
      });
    } catch (error: any) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: newStatus } : p));
    }
  };

  /* ── 3. Offers Management Handlers (Active/Inactive + Edit) ── */
  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const promoCodeStr = newOffer.create_promo && newOffer.promo_code.trim()
        ? newOffer.promo_code.trim().toUpperCase()
        : undefined;

      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .insert([{
          title: newOffer.title,
          subtitle: newOffer.subtitle || null,
          description: newOffer.description || null,
          banner_url: newOffer.banner_url || null,
          badge_text: newOffer.badge_text || "Special Offer",
          discount_percentage: newOffer.discount_percentage,
          promo_code: promoCodeStr || null,
          is_active: newOffer.is_active
        }])
        .select()
        .single();

      if (offerError) throw offerError;

      if (promoCodeStr && offerData) {
        await supabase
          .from('promo_codes')
          .insert([{
            code: promoCodeStr,
            offer_id: offerData.id,
            discount_type: newOffer.promo_discount_type,
            discount_value: newOffer.promo_discount_value,
            min_order_amount: newOffer.promo_min_order,
            is_active: newOffer.is_active
          }]);
      }

      await Promise.all([fetchOffers(), fetchPromoCodes()]);
      setIsOfferDialogOpen(false);
      setNewOffer({
        title: "",
        subtitle: "",
        description: "",
        banner_url: "",
        badge_text: "Special Deal",
        discount_percentage: 20,
        is_active: true,
        create_promo: true,
        promo_code: "",
        promo_discount_type: "percentage",
        promo_discount_value: 20,
        promo_min_order: 499,
      });

      toast({
        title: "Offer Created",
        description: `Offer "${offerData.title}" published.`,
      });
    } catch (err: any) {
      toast({
        title: "Error creating offer",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleEditOfferOpen = (offer: Offer) => {
    setEditingOffer({ ...offer });
    setIsEditOfferDialogOpen(true);
  };

  const handleSaveEditOffer = async () => {
    if (!editingOffer) return;
    try {
      const { error } = await supabase
        .from('offers')
        .update({
          title: editingOffer.title,
          subtitle: editingOffer.subtitle,
          description: editingOffer.description,
          banner_url: editingOffer.banner_url,
          badge_text: editingOffer.badge_text,
          discount_percentage: editingOffer.discount_percentage,
          promo_code: editingOffer.promo_code,
          is_active: editingOffer.is_active
        })
        .eq('id', editingOffer.id);

      if (error) console.warn("Supabase update error:", error);

      setOffers(prev => prev.map(o => o.id === editingOffer.id ? editingOffer : o));
      setIsEditOfferDialogOpen(false);
      setEditingOffer(null);

      toast({
        title: "Offer Updated",
        description: `Offer "${editingOffer.title}" updated successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const toggleOfferStatus = async (offerId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_active: newStatus })
        .eq('id', offerId);

      if (error) console.warn("Supabase update warning:", error);

      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, is_active: newStatus } : o));
      toast({
        title: `Offer ${newStatus ? 'Activated' : 'Deactivated'}`,
        description: `Offer is now ${newStatus ? 'Active (Live)' : 'Inactive (Hidden)'}.`,
      });
    } catch (err: any) {
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, is_active: newStatus } : o));
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const { error } = await supabase.from('offers').delete().eq('id', offerId);
      if (error) throw error;
      setOffers(prev => prev.filter(o => o.id !== offerId));
      toast({
        title: "Offer Deleted",
        description: "Offer removed successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const togglePromoStatus = async (promoId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: newStatus })
        .eq('id', promoId);

      if (error) console.warn("Supabase update warning:", error);

      setPromoCodes(prev => prev.map(p => p.id === promoId ? { ...p, is_active: newStatus } : p));
      toast({
        title: `Promo Code ${newStatus ? 'Activated' : 'Deactivated'}`,
        description: `Code is now ${newStatus ? 'Active' : 'Inactive'}.`,
      });
    } catch (err: any) {
      setPromoCodes(prev => prev.map(p => p.id === promoId ? { ...p, is_active: newStatus } : p));
    }
  };

  const handleDeletePromoCode = async (promoId: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      const { error } = await supabase.from('promo_codes').delete().eq('id', promoId);
      if (error) throw error;
      setPromoCodes(prev => prev.filter(p => p.id !== promoId));
      toast({
        title: "Promo Code Deleted",
        description: "Code removed from system.",
      });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /* ── 4. Sliders Management Handlers (Active/Inactive + Edit) ── */
  const handleAddSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetLink = newSlider.offer_id 
        ? `/offers/${newSlider.offer_id}` 
        : (newSlider.link_url || "/products");

      const { data, error } = await supabase
        .from('sliders')
        .insert([{
          title: newSlider.title,
          subtitle: newSlider.subtitle || null,
          description: newSlider.description || null,
          image_url: newSlider.image_url,
          badge_text: newSlider.badge_text || "Special Offer",
          button_text: newSlider.button_text || "Shop Now",
          link_url: targetLink,
          offer_id: newSlider.offer_id ? newSlider.offer_id : null,
          display_order: Number(newSlider.display_order) || 1,
          is_active: newSlider.is_active
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchSliders();
      setIsSliderDialogOpen(false);
      setNewSlider({
        title: "",
        subtitle: "",
        description: "",
        image_url: "",
        badge_text: "Featured Offer",
        button_text: "Explore Offer",
        link_url: "",
        offer_id: "",
        display_order: 1,
        is_active: true,
      });

      toast({
        title: "Slider Created",
        description: `Slider banner "${data.title}" added.`,
      });
    } catch (err: any) {
      toast({
        title: "Error creating slider",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleEditSliderOpen = (slider: SliderItem) => {
    setEditingSlider({ ...slider });
    setIsEditSliderDialogOpen(true);
  };

  const handleSaveEditSlider = async () => {
    if (!editingSlider) return;
    try {
      const targetLink = editingSlider.offer_id 
        ? `/offers/${editingSlider.offer_id}` 
        : (editingSlider.link_url || "/products");

      const { error } = await supabase
        .from('sliders')
        .update({
          title: editingSlider.title,
          subtitle: editingSlider.subtitle,
          description: editingSlider.description,
          image_url: editingSlider.image_url,
          badge_text: editingSlider.badge_text,
          button_text: editingSlider.button_text,
          link_url: targetLink,
          offer_id: editingSlider.offer_id || null,
          display_order: Number(editingSlider.display_order) || 1,
          is_active: editingSlider.is_active
        })
        .eq('id', editingSlider.id);

      if (error) console.warn("Supabase update error:", error);

      await fetchSliders();
      setIsEditSliderDialogOpen(false);
      setEditingSlider(null);

      toast({
        title: "Slider Updated",
        description: "Slider details saved successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const toggleSliderStatus = async (sliderId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const { error } = await supabase
        .from('sliders')
        .update({ is_active: newStatus })
        .eq('id', sliderId);

      if (error) console.warn("Supabase update warning:", error);

      setSliders(prev => prev.map(s => s.id === sliderId ? { ...s, is_active: newStatus } : s));
      toast({
        title: `Slider ${newStatus ? 'Activated' : 'Deactivated'}`,
        description: `Slider is now ${newStatus ? 'Active on homescreen' : 'Hidden from homescreen'}.`,
      });
    } catch (err: any) {
      setSliders(prev => prev.map(s => s.id === sliderId ? { ...s, is_active: newStatus } : s));
    }
  };

  const handleDeleteSlider = async (sliderId: string) => {
    if (!confirm("Are you sure you want to delete this slider?")) return;
    try {
      const { error } = await supabase.from('sliders').delete().eq('id', sliderId);
      if (error) throw error;
      setSliders(prev => prev.filter(s => s.id !== sliderId));
      toast({
        title: "Slider Deleted",
        description: "Hero slide removed from homepage.",
      });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /* ── 5. Contact Enquiry Handlers ─────────────────────────── */
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
      if (selectedMessage && selectedMessage.id === messageId) {
        setIsMessageDialogOpen(false);
        setSelectedMessage(null);
      }

      toast({
        title: "Message Deleted",
        description: "Enquiry record deleted.",
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
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#1A3C2A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-xs font-medium">Authenticating Admin Workspace...</p>
        </div>
      </div>
    );
  }

  const activeProducts = products.filter(p => p.is_active).length;
  const activeOffersCount = offers.filter(o => o.is_active).length;
  const activeSlidersCount = sliders.filter(s => s.is_active).length;
  const newMessagesCount = messages.filter(m => m.status === "new").length;

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={farmikLogo} alt="FARMIK" className="h-9 w-auto object-contain" />
            <div className="border-l border-gray-200 pl-3">
              <h1 className="text-sm font-bold text-gray-900 leading-none">
                Admin Portal
              </h1>
              <p className="text-[11px] text-gray-500 mt-0.5">
                FARMIK Pure Cold-Pressed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/products")}
              variant="outline"
              size="sm"
              className="text-xs text-[#1A3C2A] hover:bg-gray-50"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Live Store
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Main Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-7 mb-8 bg-white border border-gray-200 p-1 rounded-xl text-xs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Offers ({activeOffersCount}/{offers.length})
            </TabsTrigger>
            <TabsTrigger value="sliders" className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" />
              Sliders ({activeSlidersCount}/{sliders.length})
            </TabsTrigger>
            <TabsTrigger value="queries" className="relative">
              Enquiries ({messages.length})
              {newMessagesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-700 text-white text-[9px] font-bold">
                  {newMessagesCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          </TabsList>

          {/* ── 1. Overview Tab ──────────────────────────────────── */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase text-gray-500">Products</CardTitle>
                  <Package className="h-4 w-4 text-[#2D5A27]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{products.length}</div>
                  <p className="text-xs text-emerald-700 font-medium">{activeProducts} active in store</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase text-gray-500">Active Offers</CardTitle>
                  <Tag className="h-4 w-4 text-[#2D5A27]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{activeOffersCount}</div>
                  <p className="text-xs text-gray-500">{offers.length} total offers</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase text-gray-500">Active Sliders</CardTitle>
                  <Sliders className="h-4 w-4 text-[#2D5A27]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{activeSlidersCount}</div>
                  <p className="text-xs text-gray-500">{sliders.length} total banners</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase text-gray-500">Enquiries</CardTitle>
                  <MessageSquare className="h-4 w-4 text-[#2D5A27]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
                  <p className="text-xs text-emerald-700 font-bold">{newMessagesCount} unread</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase text-gray-500">Customers</CardTitle>
                  <Users className="h-4 w-4 text-[#2D5A27]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
                  <p className="text-xs text-gray-500">registered users</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── 2. Products Tab ──────────────────────────────────── */}
          <TabsContent value="products">
            <div className="space-y-6">
              {/* Add New Product Card */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Add New Product
                  </CardTitle>
                  <p className="text-xs text-gray-500">
                    Enter MRP and Discount % on MRP to calculate selling price.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-xs font-semibold text-gray-700">Product Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g. 100% Pure Kachi Ghani Mustard Oil"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          required
                          className="text-xs mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="category" className="text-xs font-semibold text-gray-700">Category *</Label>
                        <Input
                          id="category"
                          placeholder="Mustard Oil / Specialty Oils / Gift Sets"
                          value={newProduct.category}
                          onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                          required
                          className="text-xs mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="stock" className="text-xs font-semibold text-gray-700">Stock Quantity *</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={newProduct.stock_quantity}
                          onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: Number(e.target.value) })}
                          required
                          className="text-xs mt-1"
                        />
                      </div>
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                      <div>
                        <Label htmlFor="mrp" className="text-xs font-semibold text-gray-700">
                          Original MRP (₹) *
                        </Label>
                        <Input
                          id="mrp"
                          type="number"
                          value={newProduct.mrp}
                          onChange={(e) => handleNewProductMrpChange(Number(e.target.value), newProduct.discount_percentage)}
                          required
                          className="text-xs mt-1 bg-white font-bold"
                        />
                      </div>

                      <div>
                        <Label htmlFor="discount" className="text-xs font-semibold text-gray-700">
                          Discount on MRP (%) *
                        </Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          max="100"
                          value={newProduct.discount_percentage}
                          onChange={(e) => handleNewProductMrpChange(newProduct.mrp, Number(e.target.value))}
                          required
                          className="text-xs mt-1 bg-white font-bold text-emerald-700"
                        />
                      </div>

                      <div>
                        <Label htmlFor="price" className="text-xs font-semibold text-gray-700">
                          Final Selling Price (₹)
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => {
                            const p = Number(e.target.value);
                            const disc = newProduct.mrp > 0 ? Math.round(((newProduct.mrp - p) / newProduct.mrp) * 100) : 0;
                            setNewProduct({ ...newProduct, price: p, discount_percentage: disc });
                          }}
                          required
                          className="text-xs mt-1 bg-white font-bold text-[#1A3C2A]"
                        />
                      </div>
                    </div>

                    {/* Product Variants Configuration Section */}
                    <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <Label className="text-xs font-bold text-[#1A3C2A] flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-700" />
                            Available Variants / Pack Sizes (e.g. 500ml, 1L, 5L, 15L)
                          </Label>
                          <p className="text-[11px] text-gray-500">
                            Add pack size options with their respective pricing. Customers will be able to select their preferred pack.
                          </p>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-gray-400 font-semibold uppercase">Presets:</span>
                          {["500ml", "1L", "2L", "5L", "15L"].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setNewVarSize(preset);
                                let multiplier = 1;
                                if (preset === "500ml") multiplier = 0.55;
                                if (preset === "1L") multiplier = 1;
                                if (preset === "2L") multiplier = 1.95;
                                if (preset === "5L") multiplier = 4.75;
                                if (preset === "15L") multiplier = 13.8;
                                const mrp = Math.round(newProduct.mrp * multiplier);
                                const disc = newProduct.discount_percentage || 20;
                                const price = Math.round(mrp * (1 - disc / 100));
                                setNewVarMrp(mrp);
                                setNewVarDiscount(disc);
                                setNewVarPrice(price);
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold rounded bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Variant Input Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end bg-white p-2.5 rounded-lg border border-emerald-100">
                        <div>
                          <Label className="text-[10px] font-semibold text-gray-600">Size / Pack</Label>
                          <Input
                            placeholder="e.g. 1L or 500ml"
                            value={newVarSize}
                            onChange={(e) => setNewVarSize(e.target.value)}
                            className="h-8 text-xs mt-0.5"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-semibold text-gray-600">MRP (₹)</Label>
                          <Input
                            type="number"
                            value={newVarMrp}
                            onChange={(e) => {
                              const mrp = Number(e.target.value);
                              setNewVarMrp(mrp);
                              setNewVarPrice(Math.round(mrp * (1 - newVarDiscount / 100)));
                            }}
                            className="h-8 text-xs mt-0.5"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-semibold text-gray-600">Disc (%)</Label>
                          <Input
                            type="number"
                            value={newVarDiscount}
                            onChange={(e) => {
                              const disc = Number(e.target.value);
                              setNewVarDiscount(disc);
                              setNewVarPrice(Math.round(newVarMrp * (1 - disc / 100)));
                            }}
                            className="h-8 text-xs mt-0.5 text-emerald-700 font-bold"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-semibold text-gray-600">Selling Price (₹)</Label>
                          <Input
                            type="number"
                            value={newVarPrice}
                            onChange={(e) => {
                              const p = Number(e.target.value);
                              setNewVarPrice(p);
                              setNewVarDiscount(newVarMrp > 0 ? Math.round(((newVarMrp - p) / newVarMrp) * 100) : 0);
                            }}
                            className="h-8 text-xs mt-0.5 font-bold text-[#1A3C2A]"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <Button
                            type="button"
                            onClick={handleAddVariantToNewProduct}
                            size="sm"
                            className="w-full h-8 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
                          </Button>
                        </div>
                      </div>

                      {/* Added Variants List */}
                      {newProduct.variants && newProduct.variants.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {newProduct.variants.map((v, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-xs shadow-2xs"
                            >
                              <span className="font-bold text-[#1A3C2A]">{v.size}</span>
                              <span className="text-gray-400 line-through text-[11px]">₹{v.mrp}</span>
                              <span className="font-bold text-emerald-700">₹{v.price}</span>
                              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded font-semibold">
                                {v.discount_percentage}% OFF
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariantFromNewProduct(idx)}
                                className="text-red-500 hover:text-red-700 p-0.5 ml-1"
                                title="Remove variant"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Multi-Image Upload Section */}
                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                            Product Pictures (Upload Multiple Allowed) *
                          </Label>
                          <p className="text-[11px] text-gray-500">
                            Upload photos directly from your device. You can select multiple images at once.
                          </p>
                        </div>
                        {newProduct.images && newProduct.images.length > 0 && (
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded self-start sm:self-auto">
                            {newProduct.images.length} photo(s) attached
                          </span>
                        )}
                      </div>

                      {/* File Upload Dropzone */}
                      <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 rounded-xl p-4 cursor-pointer transition-colors text-center flex flex-col items-center justify-center gap-1.5 block">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleNewProductImageUpload}
                          className="hidden"
                          disabled={isUploadingProductImgs}
                        />
                        {isUploadingProductImgs ? (
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading picture(s)...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-emerald-700" />
                            <span className="text-xs font-bold text-emerald-900">
                              Click to Choose & Upload Pictures (Multiple files supported)
                            </span>
                            <span className="text-[10px] text-gray-400">
                              PNG, JPG, WEBP formats supported
                            </span>
                          </>
                        )}
                      </label>

                      {/* Uploaded Photos Gallery Preview */}
                      {newProduct.images && newProduct.images.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-gray-700">Uploaded Photos:</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                            {newProduct.images.map((imgUrl, imgIdx) => {
                              const isCover = (newProduct.image_url || newProduct.images![0]) === imgUrl;
                              return (
                                <div
                                  key={imgIdx}
                                  className={`relative group rounded-lg overflow-hidden border aspect-square bg-gray-100 ${
                                    isCover ? 'ring-2 ring-emerald-600 border-emerald-500' : 'border-gray-200'
                                  }`}
                                >
                                  <img src={imgUrl} alt={`Product ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                  {isCover && (
                                    <span className="absolute top-1 left-1 bg-emerald-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                      Cover
                                    </span>
                                  )}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                                    {!isCover && (
                                      <button
                                        type="button"
                                        onClick={() => setNewProduct(prev => ({ ...prev, image_url: imgUrl }))}
                                        className="text-[9px] font-bold bg-white text-emerald-900 px-1.5 py-0.5 rounded hover:bg-emerald-50"
                                        title="Set as main cover image"
                                      >
                                        Cover
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = (newProduct.images || []).filter((_, idx) => idx !== imgIdx);
                                        const newCover = isCover ? (updated[0] || "") : newProduct.image_url;
                                        setNewProduct(prev => ({ ...prev, images: updated, image_url: newCover }));
                                      }}
                                      className="p-1 rounded bg-red-600 text-white hover:bg-red-700"
                                      title="Remove photo"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-xs font-semibold text-gray-700">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Extraction method, purity notes, culinary recommendations..."
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        rows={2}
                        className="text-xs mt-1 resize-none"
                      />
                    </div>

                    <Button type="submit" className="bg-[#1A3C2A] hover:bg-[#2D5A27] text-white text-xs font-semibold">
                      <Plus className="mr-1.5 h-4 w-4" /> Add Product
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Product Listing Table */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Products List
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-gray-100 bg-gray-50 text-gray-600 uppercase text-[11px] font-bold">
                        <tr>
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">MRP</th>
                          <th className="py-3 px-4">Discount</th>
                          <th className="py-3 px-4">Selling Price</th>
                          <th className="py-3 px-4">Variants</th>
                          <th className="py-3 px-4">Stock</th>
                          <th className="py-3 px-4">Active / Inactive</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((p) => {
                          const mrp = p.mrp || Math.round(p.price * 1.25);
                          const disc = p.discount_percentage !== undefined && p.discount_percentage !== null
                            ? p.discount_percentage
                            : Math.round(((mrp - p.price) / mrp) * 100);

                          const variantsList: ProductVariant[] = Array.isArray(p.variants)
                            ? p.variants.map((v: any) => typeof v === "string" ? { size: v, price: p.price } : v)
                            : [];

                          return (
                            <tr key={p.id} className="hover:bg-gray-50/80">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={p.image_url}
                                    alt={p.name}
                                    className="w-10 h-10 rounded-lg object-cover bg-gray-50 shrink-0 border border-gray-200"
                                  />
                                  <div>
                                    <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                                    <p className="text-[10px] text-gray-400 line-clamp-1">{p.description}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-gray-600 font-medium">{p.category}</td>
                              <td className="py-3.5 px-4 text-gray-400 line-through">₹{mrp}</td>
                              <td className="py-3.5 px-4 font-bold text-emerald-700">
                                {disc}% OFF
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#1A3C2A] text-sm">₹{p.price}</td>
                              <td className="py-3.5 px-4">
                                {variantsList.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                                    {variantsList.map((v, vi) => (
                                      <span
                                        key={vi}
                                        className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-900"
                                      >
                                        {v.size} {v.price ? `(₹${v.price})` : ""}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-gray-400 italic">Single size</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-gray-700">{p.stock_quantity}</td>
                              <td className="py-3.5 px-4">
                                <button
                                  type="button"
                                  onClick={() => toggleProductStatus(p.id, p.is_active)}
                                  className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-colors flex items-center gap-1.5 ${
                                    p.is_active
                                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                                  }`}
                                >
                                  <Power className={`w-3 h-3 ${p.is_active ? 'text-emerald-700' : 'text-gray-400'}`} />
                                  <span>{p.is_active ? "Active" : "Inactive"}</span>
                                </button>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditOpen(p)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── 3. Offers & Promo Codes Tab ─────────────────────── */}
          <TabsContent value="offers">
            <div className="space-y-6">
              {/* Header & Add Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Offers Management ({activeOffersCount} Active / {offers.length} Total)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Toggle offers active or inactive to show or hide them on the store.
                  </p>
                </div>
                <Button
                  onClick={() => setIsOfferDialogOpen(true)}
                  className="bg-[#1A3C2A] hover:bg-[#2D5A27] text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Offer
                </Button>
              </div>

              {/* Offers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {offers.map((offer) => (
                  <Card key={offer.id} className={`bg-white border ${offer.is_active ? 'border-gray-200' : 'border-gray-300 opacity-80'} rounded-xl overflow-hidden flex flex-col justify-between`}>
                    <div>
                      {offer.banner_url && (
                        <div className="h-32 w-full overflow-hidden bg-gray-100 relative">
                          <img
                            src={offer.banner_url}
                            alt={offer.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 left-2.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            {offer.badge_text || "Special Offer"}
                          </div>
                          {offer.discount_percentage && offer.discount_percentage > 0 && (
                            <div className="absolute top-2.5 right-2.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              {offer.discount_percentage}% OFF
                            </div>
                          )}
                        </div>
                      )}
                      
                      <CardContent className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900 text-base">
                            {offer.title}
                          </h3>
                        </div>

                        {offer.subtitle && (
                          <p className="text-xs font-medium text-emerald-800">
                            {offer.subtitle}
                          </p>
                        )}

                        <p className="text-xs text-gray-500 line-clamp-2">
                          {offer.description}
                        </p>

                        {offer.promo_code && (
                          <div className="p-2 rounded bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                            <span className="text-gray-600">Promo Code:</span>
                            <span className="font-mono font-bold text-emerald-900">
                              {offer.promo_code}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex items-center justify-between">
                      {/* Active / Inactive Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleOfferStatus(offer.id, offer.is_active)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-colors flex items-center gap-1.5 ${
                          offer.is_active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                        }`}
                        title="Click to toggle active/inactive"
                      >
                        <Power className={`w-3 h-3 ${offer.is_active ? 'text-emerald-700' : 'text-gray-400'}`} />
                        <span>{offer.is_active ? "Active" : "Inactive"}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditOfferOpen(offer)}
                          className="h-7 px-2 text-xs"
                          title="Edit Offer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/offers/${offer.id}`)}
                          className="h-7 px-2 text-xs"
                          title="Preview Page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="text-red-600 hover:bg-red-50 text-xs h-7 px-2"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Promo Codes Table */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Promo Codes ({promoCodes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-gray-100 bg-gray-50 text-gray-600 uppercase text-[11px] font-bold">
                        <tr>
                          <th className="py-3 px-4">Promo Code</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Discount</th>
                          <th className="py-3 px-4">Min. Order</th>
                          <th className="py-3 px-4">Active / Inactive</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {promoCodes.map((promo) => (
                          <tr key={promo.id} className="hover:bg-gray-50/80">
                            <td className="py-3 px-4 font-mono font-bold text-gray-900 text-sm">
                              {promo.code}
                            </td>
                            <td className="py-3 px-4 uppercase text-[10px] text-gray-500">
                              {promo.discount_type}
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-800">
                              {promo.discount_type === "percentage" ? `${promo.discount_value}% OFF` : `₹${promo.discount_value} OFF`}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              ₹{promo.min_order_amount}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => togglePromoStatus(promo.id, promo.is_active)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${
                                  promo.is_active
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : "bg-gray-100 text-gray-500 border border-gray-300"
                                }`}
                              >
                                <Power className="w-2.5 h-2.5" />
                                <span>{promo.is_active ? "Active" : "Inactive"}</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePromoCode(promo.id)}
                                className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── 4. Hero Sliders Tab ──────────────────────────────── */}
          <TabsContent value="sliders">
            <div className="space-y-6">
              {/* Header & Add Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Homescreen Sliders ({activeSlidersCount} Active / {sliders.length} Total)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Toggle sliders active or inactive to show or hide them on the homescreen.
                  </p>
                </div>
                <Button
                  onClick={() => setIsSliderDialogOpen(true)}
                  className="bg-[#1A3C2A] hover:bg-[#2D5A27] text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Slider
                </Button>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sliders.map((s) => {
                  const linkedOffer = offers.find(o => o.id === s.offer_id);

                  return (
                    <Card key={s.id} className={`bg-white border ${s.is_active ? 'border-gray-200' : 'border-gray-300 opacity-80'} rounded-xl overflow-hidden flex flex-col justify-between`}>
                      <div>
                        {/* Thumbnail */}
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                          <img
                            src={s.image_url}
                            alt={s.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            Order #{s.display_order}
                          </div>
                          {s.badge_text && (
                            <div className="absolute top-2 right-2 bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              {s.badge_text}
                            </div>
                          )}
                        </div>

                        <CardContent className="p-4 space-y-2">
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                            {s.title}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {s.subtitle || s.description}
                          </p>

                          <div className="p-2 bg-gray-50 rounded text-[11px] text-gray-600 border border-gray-100 flex items-center justify-between">
                            <span className="font-semibold text-[#1A3C2A] truncate max-w-[180px]">
                              {linkedOffer ? `Linked: ${linkedOffer.title}` : `Link: ${s.link_url || "/products"}`}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {s.button_text}
                            </span>
                          </div>
                        </CardContent>
                      </div>

                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex items-center justify-between">
                        {/* Active / Inactive Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleSliderStatus(s.id, s.is_active)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-colors flex items-center gap-1.5 ${
                            s.is_active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                          }`}
                          title="Click to toggle active/inactive"
                        >
                          <Power className={`w-3 h-3 ${s.is_active ? 'text-emerald-700' : 'text-gray-400'}`} />
                          <span>{s.is_active ? "Active" : "Inactive"}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSliderOpen(s)}
                            className="h-7 px-2 text-xs"
                            title="Edit Slider"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSlider(s.id)}
                            className="text-red-600 hover:bg-red-50 text-xs h-7 px-2"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── 5. Contact Enquiries Tab ─────────────────────────── */}
          <TabsContent value="queries">
            <Card className="bg-white border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Customer Contact Enquiries
                  </CardTitle>
                </div>
                <Badge variant="outline" className="border-emerald-700 text-emerald-800 bg-emerald-50">
                  {newMessagesCount} Unread
                </Badge>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">No contact messages received yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-gray-100 bg-gray-50 text-gray-600 uppercase text-[11px] font-bold">
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
                          <tr key={msg.id} className={`hover:bg-gray-50 ${msg.status === "new" ? "bg-emerald-50/30 font-medium" : ""}`}>
                            <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                              {new Date(msg.created_at).toLocaleDateString("en-IN")}
                            </td>
                            <td className="py-3 px-4 font-semibold text-gray-900">{msg.name}</td>
                            <td className="py-3 px-4 text-gray-600">
                              <div>{msg.email}</div>
                              {msg.phone && <div className="text-gray-400">{msg.phone}</div>}
                            </td>
                            <td className="py-3 px-4 text-gray-800 max-w-xs truncate">{msg.subject}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                msg.status === "new" 
                                  ? "bg-amber-100 text-amber-800"
                                  : msg.status === "read"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {msg.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenMessageModal(msg)}
                                  className="h-7 px-2 text-xs"
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
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

          {/* ── 6. Customers Tab ─────────────────────────────────── */}
          <TabsContent value="customers">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Registered Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
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
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-900">{c.full_name || "User"}</td>
                          <td className="py-3 px-4 text-gray-600">{c.email || "-"}</td>
                          <td className="py-3 px-4 text-gray-600">{c.phone || "-"}</td>
                          <td className="py-3 px-4 text-gray-500">
                            {new Date(c.created_at).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 7. Orders Tab ────────────────────────────────────── */}
          <TabsContent value="orders">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#1A3C2A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Orders & Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                    <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">No orders recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
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
                          <tr key={o.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-mono text-gray-700">{o.id.slice(0, 8)}...</td>
                            <td className="py-3 px-4 font-medium text-gray-900">{o.profiles?.full_name || o.profiles?.email || "Customer"}</td>
                            <td className="py-3 px-4 font-bold text-[#1A3C2A]">₹{o.total_amount}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-500">
                              {new Date(o.created_at).toLocaleDateString("en-IN")}
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
        </Tabs>
      </div>

      {/* ── Dialog: Edit Product Modal ─────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl bg-white rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A3C2A]">
              Edit Product Details
            </DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="edit-name" className="text-xs font-semibold text-gray-700">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>

              {/* Base Pricing */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <Label htmlFor="edit-mrp" className="text-xs font-semibold text-gray-700">Default MRP (₹)</Label>
                  <Input
                    id="edit-mrp"
                    type="number"
                    value={editingProduct.mrp || 0}
                    onChange={(e) => handleEditProductMrpChange(Number(e.target.value), editingProduct.discount_percentage || 0)}
                    className="text-xs mt-1 bg-white font-bold"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-disc" className="text-xs font-semibold text-gray-700">Default Disc %</Label>
                  <Input
                    id="edit-disc"
                    type="number"
                    value={editingProduct.discount_percentage || 0}
                    onChange={(e) => handleEditProductMrpChange(editingProduct.mrp || 0, Number(e.target.value))}
                    className="text-xs mt-1 bg-white font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price" className="text-xs font-semibold text-gray-700">Selling Price (₹)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      const mrp = editingProduct.mrp || p;
                      const disc = mrp > 0 ? Math.round(((mrp - p) / mrp) * 100) : 0;
                      setEditingProduct({ ...editingProduct, price: p, discount_percentage: disc });
                    }}
                    className="text-xs mt-1 bg-white font-bold text-[#1A3C2A]"
                  />
                </div>
              </div>

              {/* Available Variants (1L, 5L, 500ml, etc.) */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <Label className="text-xs font-bold text-[#1A3C2A] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-700" />
                      Product Variants & Pack Sizes (e.g. 500ml, 1L, 5L, 15L)
                    </Label>
                    <p className="text-[11px] text-gray-500">
                      Configure different pack sizes available for this product with custom prices.
                    </p>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Presets:</span>
                    {["500ml", "1L", "2L", "5L", "15L"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setEditVarSize(preset);
                          let multiplier = 1;
                          if (preset === "500ml") multiplier = 0.55;
                          if (preset === "1L") multiplier = 1;
                          if (preset === "2L") multiplier = 1.95;
                          if (preset === "5L") multiplier = 4.75;
                          if (preset === "15L") multiplier = 13.8;
                          const baseMrp = editingProduct.mrp || editingProduct.price * 1.25;
                          const mrp = Math.round(baseMrp * multiplier);
                          const disc = editingProduct.discount_percentage || 20;
                          const price = Math.round(mrp * (1 - disc / 100));
                          setEditVarMrp(mrp);
                          setEditVarDiscount(disc);
                          setEditVarPrice(price);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Variant Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div>
                    <Label className="text-[10px] font-semibold text-gray-600">Size / Pack</Label>
                    <Input
                      placeholder="e.g. 1L or 500ml"
                      value={editVarSize}
                      onChange={(e) => setEditVarSize(e.target.value)}
                      className="h-8 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold text-gray-600">MRP (₹)</Label>
                    <Input
                      type="number"
                      value={editVarMrp}
                      onChange={(e) => {
                        const mrp = Number(e.target.value);
                        setEditVarMrp(mrp);
                        setEditVarPrice(Math.round(mrp * (1 - editVarDiscount / 100)));
                      }}
                      className="h-8 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold text-gray-600">Disc (%)</Label>
                    <Input
                      type="number"
                      value={editVarDiscount}
                      onChange={(e) => {
                        const disc = Number(e.target.value);
                        setEditVarDiscount(disc);
                        setEditVarPrice(Math.round(editVarMrp * (1 - disc / 100)));
                      }}
                      className="h-8 text-xs mt-0.5 text-emerald-700 font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold text-gray-600">Selling Price (₹)</Label>
                    <Input
                      type="number"
                      value={editVarPrice}
                      onChange={(e) => {
                        const p = Number(e.target.value);
                        setEditVarPrice(p);
                        setEditVarDiscount(editVarMrp > 0 ? Math.round(((editVarMrp - p) / editVarMrp) * 100) : 0);
                      }}
                      className="h-8 text-xs mt-0.5 font-bold text-[#1A3C2A]"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Button
                      type="button"
                      onClick={handleAddVariantToEditProduct}
                      size="sm"
                      className="w-full h-8 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
                    </Button>
                  </div>
                </div>

                {/* List of Configured Variants */}
                {editingProduct.variants && editingProduct.variants.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-gray-700">Configured Variants ({editingProduct.variants.length}):</div>
                    <div className="flex flex-wrap gap-2">
                      {editingProduct.variants.map((v, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-xs shadow-2xs"
                        >
                          <span className="font-bold text-[#1A3C2A]">{v.size}</span>
                          <span className="text-gray-400 line-through text-[11px]">₹{v.mrp}</span>
                          <span className="font-bold text-emerald-700">₹{v.price}</span>
                          <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded font-semibold">
                            {v.discount_percentage}% OFF
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantFromEditProduct(idx)}
                            className="text-red-500 hover:text-red-700 p-0.5 ml-1"
                            title="Remove variant"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">No pack variants configured yet. Use the presets above to add options like 500ml, 1L, 5L.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-cat" className="text-xs font-semibold text-gray-700">Category</Label>
                  <Input
                    id="edit-cat"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stock" className="text-xs font-semibold text-gray-700">Stock Quantity</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: Number(e.target.value) })}
                    className="text-xs mt-1"
                  />
                </div>
              </div>

              {/* Multi-Image Upload Section for Edit Product */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                      Product Gallery & Pictures (Multiple Upload)
                    </Label>
                    <p className="text-[11px] text-gray-500">
                      Manage photos for this product. You can upload additional photos or change the primary cover picture.
                    </p>
                  </div>
                  {editingProduct.images && editingProduct.images.length > 0 && (
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded self-start sm:self-auto">
                      {editingProduct.images.length} photo(s)
                    </span>
                  )}
                </div>

                {/* Upload Button */}
                <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 rounded-xl p-3.5 cursor-pointer transition-colors text-center flex flex-col items-center justify-center gap-1 block">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditProductImageUpload}
                    className="hidden"
                    disabled={isUploadingEditProductImgs}
                  />
                  {isUploadingEditProductImgs ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 py-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading pictures...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900">
                        + Click to Add More Photos from Device
                      </span>
                    </>
                  )}
                </label>

                {/* Current Photos Gallery Preview */}
                {editingProduct.images && editingProduct.images.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-gray-700">Gallery Photos:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {editingProduct.images.map((imgUrl, imgIdx) => {
                        const isCover = (editingProduct.image_url || editingProduct.images![0]) === imgUrl;
                        return (
                          <div
                            key={imgIdx}
                            className={`relative group rounded-lg overflow-hidden border aspect-square bg-gray-100 ${
                              isCover ? 'ring-2 ring-emerald-600 border-emerald-500' : 'border-gray-200'
                            }`}
                          >
                            <img src={imgUrl} alt={`Product ${imgIdx + 1}`} className="w-full h-full object-cover" />
                            {isCover && (
                              <span className="absolute top-1 left-1 bg-emerald-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                Cover
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct(prev => prev ? ({ ...prev, image_url: imgUrl }) : null)}
                                  className="text-[9px] font-bold bg-white text-emerald-900 px-1.5 py-0.5 rounded hover:bg-emerald-50"
                                  title="Set as main cover"
                                >
                                  Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (editingProduct.images || []).filter((_, idx) => idx !== imgIdx);
                                  const newCover = isCover ? (updated[0] || "") : editingProduct.image_url;
                                  setEditingProduct(prev => prev ? ({ ...prev, images: updated, image_url: newCover }) : null);
                                }}
                                className="p-1 rounded bg-red-600 text-white hover:bg-red-700"
                                title="Remove photo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="edit-desc" className="text-xs font-semibold text-gray-700">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={2}
                  className="text-xs mt-1 resize-none"
                />
              </div>

              {/* Status Toggle in Edit Product */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs font-semibold text-gray-700">Product Status:</span>
                <button
                  type="button"
                  onClick={() => setEditingProduct({ ...editingProduct, is_active: !editingProduct.is_active })}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                    editingProduct.is_active
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-gray-100 text-gray-600 border border-gray-300"
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{editingProduct.is_active ? "Active" : "Inactive"}</span>
                </button>
              </div>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit} className="bg-[#1A3C2A] text-white text-xs">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Create Offer Modal ─────────────────────────── */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="max-w-lg bg-white rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A3C2A]">
              Create New Promotional Offer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddOffer} className="space-y-3 pt-1">
            <div>
              <Label htmlFor="off-title" className="text-xs font-semibold text-gray-700">Offer Title *</Label>
              <Input
                id="off-title"
                placeholder="e.g. Festive Harvest Special — Flat 25% Off"
                value={newOffer.title}
                onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                required
                className="text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="off-sub" className="text-xs font-semibold text-gray-700">Subtitle</Label>
                <Input
                  id="off-sub"
                  placeholder="e.g. Pure cold-pressed oils"
                  value={newOffer.subtitle}
                  onChange={(e) => setNewOffer({ ...newOffer, subtitle: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label htmlFor="off-badge" className="text-xs font-semibold text-gray-700">Badge Tag</Label>
                <Input
                  id="off-badge"
                  placeholder="e.g. Mega Deal"
                  value={newOffer.badge_text}
                  onChange={(e) => setNewOffer({ ...newOffer, badge_text: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="off-disc" className="text-xs font-semibold text-gray-700">Headline Discount (%)</Label>
                <Input
                  id="off-disc"
                  type="number"
                  value={newOffer.discount_percentage}
                  onChange={(e) => setNewOffer({ ...newOffer, discount_percentage: Number(e.target.value) })}
                  className="text-xs mt-1 font-bold"
                />
              </div>

              <div>
                <Label htmlFor="off-banner" className="text-xs font-semibold text-gray-700">Banner Image URL</Label>
                <Input
                  id="off-banner"
                  placeholder="https://..."
                  value={newOffer.banner_url}
                  onChange={(e) => setNewOffer({ ...newOffer, banner_url: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="off-desc" className="text-xs font-semibold text-gray-700">Description</Label>
              <Textarea
                id="off-desc"
                placeholder="Offer details..."
                value={newOffer.description}
                onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                rows={2}
                className="text-xs mt-1 resize-none"
              />
            </div>

            {/* Status Option */}
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs font-semibold text-gray-700">Initial Status:</span>
              <button
                type="button"
                onClick={() => setNewOffer({ ...newOffer, is_active: !newOffer.is_active })}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                  newOffer.is_active
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-gray-100 text-gray-600 border border-gray-300"
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{newOffer.is_active ? "Active" : "Inactive"}</span>
              </button>
            </div>

            {/* Attached Promo Code Section */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#2D5A27]" />
                  Generate Promo Code for this Offer
                </span>
                <input
                  type="checkbox"
                  checked={newOffer.create_promo}
                  onChange={(e) => setNewOffer({ ...newOffer, create_promo: e.target.checked })}
                  className="rounded text-emerald-700 h-4 w-4"
                />
              </div>

              {newOffer.create_promo && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <Label htmlFor="promo-code" className="text-[10px] font-semibold text-gray-700">Code *</Label>
                    <Input
                      id="promo-code"
                      placeholder="HARVEST25"
                      value={newOffer.promo_code}
                      onChange={(e) => setNewOffer({ ...newOffer, promo_code: e.target.value.toUpperCase() })}
                      className="text-xs uppercase font-mono font-bold mt-1 bg-white"
                      required={newOffer.create_promo}
                    />
                  </div>

                  <div>
                    <Label htmlFor="promo-val" className="text-[10px] font-semibold text-gray-700">Discount (% or ₹)</Label>
                    <Input
                      id="promo-val"
                      type="number"
                      value={newOffer.promo_discount_value}
                      onChange={(e) => setNewOffer({ ...newOffer, promo_discount_value: Number(e.target.value) })}
                      className="text-xs mt-1 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <Label htmlFor="promo-min" className="text-[10px] font-semibold text-gray-700">Min Order (₹)</Label>
                    <Input
                      id="promo-min"
                      type="number"
                      value={newOffer.promo_min_order}
                      onChange={(e) => setNewOffer({ ...newOffer, promo_min_order: Number(e.target.value) })}
                      className="text-xs mt-1 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOfferDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#1A3C2A] text-white text-xs">
                Publish Offer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Edit Offer Modal ───────────────────────────── */}
      <Dialog open={isEditOfferDialogOpen} onOpenChange={setIsEditOfferDialogOpen}>
        <DialogContent className="max-w-lg bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A3C2A]">
              Edit Offer
            </DialogTitle>
          </DialogHeader>
          {editingOffer && (
            <div className="space-y-3 pt-1">
              <div>
                <Label htmlFor="edit-off-title" className="text-xs font-semibold text-gray-700">Title</Label>
                <Input
                  id="edit-off-title"
                  value={editingOffer.title}
                  onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-off-sub" className="text-xs font-semibold text-gray-700">Subtitle</Label>
                  <Input
                    id="edit-off-sub"
                    value={editingOffer.subtitle || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, subtitle: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-off-badge" className="text-xs font-semibold text-gray-700">Badge Text</Label>
                  <Input
                    id="edit-off-badge"
                    value={editingOffer.badge_text || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, badge_text: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-off-disc" className="text-xs font-semibold text-gray-700">Discount (%)</Label>
                  <Input
                    id="edit-off-disc"
                    type="number"
                    value={editingOffer.discount_percentage || 0}
                    onChange={(e) => setEditingOffer({ ...editingOffer, discount_percentage: Number(e.target.value) })}
                    className="text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-off-code" className="text-xs font-semibold text-gray-700">Promo Code</Label>
                  <Input
                    id="edit-off-code"
                    value={editingOffer.promo_code || ""}
                    onChange={(e) => setEditingOffer({ ...editingOffer, promo_code: e.target.value.toUpperCase() })}
                    className="text-xs mt-1 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-off-banner" className="text-xs font-semibold text-gray-700">Banner Image URL</Label>
                <Input
                  id="edit-off-banner"
                  value={editingOffer.banner_url || ""}
                  onChange={(e) => setEditingOffer({ ...editingOffer, banner_url: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-off-desc" className="text-xs font-semibold text-gray-700">Description</Label>
                <Textarea
                  id="edit-off-desc"
                  value={editingOffer.description || ""}
                  onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                  rows={2}
                  className="text-xs mt-1 resize-none"
                />
              </div>

              {/* Status Toggle in Edit Offer */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs font-semibold text-gray-700">Offer Status:</span>
                <button
                  type="button"
                  onClick={() => setEditingOffer({ ...editingOffer, is_active: !editingOffer.is_active })}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                    editingOffer.is_active
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-gray-100 text-gray-600 border border-gray-300"
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{editingOffer.is_active ? "Active (Live)" : "Inactive (Hidden)"}</span>
                </button>
              </div>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditOfferDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEditOffer} className="bg-[#1A3C2A] text-white text-xs">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Create Slider Modal ────────────────────────── */}
      <Dialog open={isSliderDialogOpen} onOpenChange={setIsSliderDialogOpen}>
        <DialogContent className="max-w-lg bg-white rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A3C2A]">
              Add Homescreen Slider
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSlider} className="space-y-3 pt-1">
            <div>
              <Label htmlFor="sl-title" className="text-xs font-semibold text-gray-700">Headline *</Label>
              <Input
                id="sl-title"
                placeholder="e.g. Pure Cold-Pressed Mustard Oil"
                value={newSlider.title}
                onChange={(e) => setNewSlider({ ...newSlider, title: e.target.value })}
                required
                className="text-xs mt-1"
              />
            </div>

            <div>
              <Label htmlFor="sl-sub" className="text-xs font-semibold text-gray-700">Subtitle</Label>
              <Input
                id="sl-sub"
                placeholder="Traditional wooden churn..."
                value={newSlider.subtitle}
                onChange={(e) => setNewSlider({ ...newSlider, subtitle: e.target.value })}
                className="text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sl-badge" className="text-xs font-semibold text-gray-700">Badge</Label>
                <Input
                  id="sl-badge"
                  placeholder="Featured Deal"
                  value={newSlider.badge_text}
                  onChange={(e) => setNewSlider({ ...newSlider, badge_text: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sl-btn" className="text-xs font-semibold text-gray-700">CTA Text</Label>
                <Input
                  id="sl-btn"
                  placeholder="Shop Now"
                  value={newSlider.button_text}
                  onChange={(e) => setNewSlider({ ...newSlider, button_text: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            {/* Link to Offer Dropdown */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
              <Label htmlFor="sl-offer" className="text-xs font-bold text-gray-800">
                Link to an Offer (Dropdown)
              </Label>
              <select
                id="sl-offer"
                value={newSlider.offer_id}
                onChange={(e) => setNewSlider({ ...newSlider, offer_id: e.target.value })}
                className="w-full text-xs p-2 rounded bg-white border border-gray-200 outline-none"
              >
                <option value="">-- No Offer Linked (Use Custom Link) --</option>
                {offers.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.title} {off.is_active ? "(Active)" : "(Inactive)"}
                  </option>
                ))}
              </select>
            </div>

            {!newSlider.offer_id && (
              <div>
                <Label htmlFor="sl-link" className="text-xs font-semibold text-gray-700">Custom Target Link URL</Label>
                <Input
                  id="sl-link"
                  placeholder="/products"
                  value={newSlider.link_url}
                  onChange={(e) => setNewSlider({ ...newSlider, link_url: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
            )}

            {/* Slider Image Uploader (1 Picture) */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
              <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                Slider Banner Picture (Upload 1 Image) *
              </Label>
              <p className="text-[11px] text-gray-500">
                Upload a high-quality picture from your device for this homescreen slider banner.
              </p>

              {newSlider.image_url ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-[16/8] bg-black/5 flex items-center justify-center">
                  <img src={newSlider.image_url} alt="Slider Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="px-3 py-1.5 rounded-lg bg-white text-emerald-900 text-xs font-bold cursor-pointer hover:bg-emerald-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSliderImageUpload(e, false)}
                        className="hidden"
                        disabled={isUploadingSliderImg}
                      />
                      Replace Picture
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewSlider(prev => ({ ...prev, image_url: "" }))}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 rounded-xl p-4 cursor-pointer transition-colors text-center flex flex-col items-center justify-center gap-1.5 block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSliderImageUpload(e, false)}
                    className="hidden"
                    disabled={isUploadingSliderImg}
                  />
                  {isUploadingSliderImg ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading banner picture...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900">
                        Click to Upload Banner Image
                      </span>
                      <span className="text-[10px] text-gray-400">
                        PNG, JPG, WEBP formats (Landscape 16:9 recommended)
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            <div>
              <Label htmlFor="sl-order" className="text-xs font-semibold text-gray-700">Display Order</Label>
              <Input
                id="sl-order"
                type="number"
                value={newSlider.display_order}
                onChange={(e) => setNewSlider({ ...newSlider, display_order: Number(e.target.value) })}
                className="text-xs mt-1 font-bold"
              />
            </div>

            {/* Status Option */}
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs font-semibold text-gray-700">Initial Status:</span>
              <button
                type="button"
                onClick={() => setNewSlider({ ...newSlider, is_active: !newSlider.is_active })}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                  newSlider.is_active
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-gray-100 text-gray-600 border border-gray-300"
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{newSlider.is_active ? "Active" : "Inactive"}</span>
              </button>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsSliderDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#1A3C2A] text-white text-xs">
                Add Slider
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Edit Slider Modal ──────────────────────────── */}
      <Dialog open={isEditSliderDialogOpen} onOpenChange={setIsEditSliderDialogOpen}>
        <DialogContent className="max-w-lg bg-white rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A3C2A]">
              Edit Slider Banner
            </DialogTitle>
          </DialogHeader>
          {editingSlider && (
            <div className="space-y-3 pt-1">
              <div>
                <Label htmlFor="edit-sl-title" className="text-xs font-semibold text-gray-700">Headline</Label>
                <Input
                  id="edit-sl-title"
                  value={editingSlider.title}
                  onChange={(e) => setEditingSlider({ ...editingSlider, title: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-sl-sub" className="text-xs font-semibold text-gray-700">Subtitle</Label>
                <Input
                  id="edit-sl-sub"
                  value={editingSlider.subtitle || ""}
                  onChange={(e) => setEditingSlider({ ...editingSlider, subtitle: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-sl-badge" className="text-xs font-semibold text-gray-700">Badge</Label>
                  <Input
                    id="edit-sl-badge"
                    value={editingSlider.badge_text || ""}
                    onChange={(e) => setEditingSlider({ ...editingSlider, badge_text: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sl-btn" className="text-xs font-semibold text-gray-700">Button Text</Label>
                  <Input
                    id="edit-sl-btn"
                    value={editingSlider.button_text || ""}
                    onChange={(e) => setEditingSlider({ ...editingSlider, button_text: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                <Label htmlFor="edit-sl-offer" className="text-xs font-bold text-gray-800">
                  Link to Offer
                </Label>
                <select
                  id="edit-sl-offer"
                  value={editingSlider.offer_id || ""}
                  onChange={(e) => setEditingSlider({ ...editingSlider, offer_id: e.target.value || null })}
                  className="w-full text-xs p-2 rounded bg-white border border-gray-200 outline-none"
                >
                  <option value="">-- No Offer Linked (Use Custom Link) --</option>
                  {offers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.title} {off.is_active ? "(Active)" : "(Inactive)"}
                    </option>
                  ))}
                </select>
              </div>

              {!editingSlider.offer_id && (
                <div>
                  <Label htmlFor="edit-sl-link" className="text-xs font-semibold text-gray-700">Custom Target Link URL</Label>
                  <Input
                    id="edit-sl-link"
                    value={editingSlider.link_url || ""}
                    onChange={(e) => setEditingSlider({ ...editingSlider, link_url: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>
              )}

              {/* Slider Image Uploader for Edit Modal */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                  Slider Banner Picture (Upload 1 Image)
                </Label>
                <p className="text-[11px] text-gray-500">
                  Upload a new picture or change the existing slider picture from your device.
                </p>

                {editingSlider.image_url ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-[16/8] bg-black/5 flex items-center justify-center">
                    <img src={editingSlider.image_url} alt="Slider Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-white text-emerald-900 text-xs font-bold cursor-pointer hover:bg-emerald-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSliderImageUpload(e, true)}
                          className="hidden"
                          disabled={isUploadingEditSliderImg}
                        />
                        Replace Picture
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditingSlider(prev => prev ? ({ ...prev, image_url: "" }) : null)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 rounded-xl p-4 cursor-pointer transition-colors text-center flex flex-col items-center justify-center gap-1.5 block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSliderImageUpload(e, true)}
                      className="hidden"
                      disabled={isUploadingEditSliderImg}
                    />
                    {isUploadingEditSliderImg ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading banner picture...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-emerald-700" />
                        <span className="text-xs font-bold text-emerald-900">
                          Click to Upload New Banner Image
                        </span>
                        <span className="text-[10px] text-gray-400">
                          PNG, JPG, WEBP formats (Landscape 16:9 recommended)
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>

              <div>
                <Label htmlFor="edit-sl-order" className="text-xs font-semibold text-gray-700">Display Order</Label>
                <Input
                  id="edit-sl-order"
                  type="number"
                  value={editingSlider.display_order}
                  onChange={(e) => setEditingSlider({ ...editingSlider, display_order: Number(e.target.value) })}
                  className="text-xs mt-1 font-bold"
                />
              </div>

              {/* Status Toggle in Edit Slider */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs font-semibold text-gray-700">Slider Status:</span>
                <button
                  type="button"
                  onClick={() => setEditingSlider({ ...editingSlider, is_active: !editingSlider.is_active })}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                    editingSlider.is_active
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-gray-100 text-gray-600 border border-gray-300"
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{editingSlider.is_active ? "Active (Live on Home)" : "Inactive (Hidden)"}</span>
                </button>
              </div>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditSliderDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEditSlider} className="bg-[#1A3C2A] text-white text-xs">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Contact Message View Modal ─────────────────── */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1A3C2A]">
              Contact Enquiry
            </DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                <p className="font-bold text-gray-900 text-sm">{selectedMessage.name}</p>
                <p className="text-gray-600 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {selectedMessage.email}</p>
                {selectedMessage.phone && (
                  <p className="text-gray-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {selectedMessage.phone}</p>
                )}
                <p className="text-[10px] text-gray-400">
                  Received: {new Date(selectedMessage.created_at).toLocaleString("en-IN")}
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-700 mb-1">Subject:</p>
                <p className="p-2 bg-gray-50 rounded font-medium text-gray-900">{selectedMessage.subject}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-700 mb-1">Message:</p>
                <div className="p-3 bg-white border border-gray-200 rounded text-gray-800 leading-relaxed max-h-48 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-gray-700">Status:</span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant={selectedMessage.status === "new" ? "default" : "outline"}
                    onClick={() => handleUpdateMessageStatus(selectedMessage.id, "new")}
                    className="text-[10px] h-6 px-2"
                  >
                    New
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedMessage.status === "read" ? "default" : "outline"}
                    onClick={() => handleUpdateMessageStatus(selectedMessage.id, "read")}
                    className="text-[10px] h-6 px-2"
                  >
                    Read
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedMessage.status === "replied" ? "default" : "outline"}
                    onClick={() => handleUpdateMessageStatus(selectedMessage.id, "replied")}
                    className="text-[10px] h-6 px-2"
                  >
                    Replied
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsMessageDialogOpen(false)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;