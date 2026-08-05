import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const allowedEmails = [
      "annupusa01@gmail.com",
      "annu_pusa@yahoo.co.in",
      "lakshyaj8779@gmail.com"
    ];

    const emailClean = credentials.email.toLowerCase().trim();

    if (!allowedEmails.includes(emailClean)) {
      toast({
        title: "Access Denied",
        description: "This email is not authorized as an admin",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailClean,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.user) {
        // Ensure their role in profiles table is 'admin' so RLS works
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (profile && profile.role !== 'admin') {
          await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('user_id', data.user.id);
        } else if (!profile) {
          // If profile doesn't exist, create it as admin
          await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              email: data.user.email!,
              full_name: data.user.user_metadata?.full_name || 'Admin',
              role: 'admin'
            });
        }

        // Store admin session in localStorage
        localStorage.setItem("adminSession", JSON.stringify({
          isAdmin: true,
          email: data.user.email,
          loginTime: new Date().toISOString()
        }));
        
        toast({
          title: "Login successful!",
          description: "Welcome to the admin dashboard",
        });
        
        navigate("/admin/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
            <p className="text-muted-foreground">
              Enter your admin credentials to continue
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter admin email"
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials(prev => ({ ...prev, email: e.target.value }))
                  }
                  required
                  className="border-muted-foreground/20 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials(prev => ({ ...prev, password: e.target.value }))
                    }
                    required
                    className="border-muted-foreground/20 focus:border-primary pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 farm-hover"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                Authorized Admin Accounts only. Login via your registered Supabase credentials.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;