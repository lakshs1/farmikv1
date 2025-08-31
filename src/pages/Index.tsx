import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Truck, Shield, Leaf, Award } from "lucide-react";
import farmikLogo from "@/assets/farmik-oils-logo.png";
import mustardOilProduct from "@/assets/mustard-oil-product.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 mustard-wave">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 farm-hover">
                Premium Cold-Pressed
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 animate-float">
                Pure <span className="text-primary">Mustard Oil</span> from Traditional Methods
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Experience the authentic taste and health benefits of traditional cold-pressed mustard oil. 
                Rich in omega-3 fatty acids, antioxidants, and natural nutrients for your family's wellness.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/products">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 farm-hover">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Shop Now
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto farm-hover">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-8 farm-hover">
                <img 
                  src={mustardOilProduct} 
                  alt="Premium Cold-Pressed Mustard Oil - Best Quality Healthy Oil"
                  className="w-full h-auto max-w-md mx-auto rounded-2xl shadow-2xl farm-hover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose Farmik Oils?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We combine traditional cold-press methods with modern quality standards to deliver the purest mustard oil.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Leaf,
                title: "100% Natural",
                description: "Pure, unrefined mustard oil with no chemicals or additives"
              },
              {
                icon: Award,
                title: "Premium Quality",
                description: "Traditional cold-press extraction preserves natural nutrients"
              },
              {
                icon: Shield,
                title: "Health Benefits",
                description: "Rich in omega-3, antioxidants, and essential fatty acids"
              },
              {
                icon: Truck,
                title: "Fast Delivery",
                description: "Quick and secure delivery to your doorstep nationwide"
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Health Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Health Benefits of Cold-Pressed Mustard Oil
              </h2>
              <div className="space-y-4">
                {[
                  "Rich in Omega-3 and Omega-6 fatty acids for heart health",
                  "Natural antibacterial and antifungal properties",
                  "Boosts immunity and supports respiratory health",
                  "Improves circulation and promotes healthy skin",
                  "Contains vitamin E and natural antioxidants",
                  "Supports digestive health and metabolism"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Heart className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
              <Link to="/products" className="inline-block mt-6">
                <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
                  Explore Our Products
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-3xl p-8">
                <img 
                  src={farmikLogo} 
                  alt="Farmik Oils - Traditional Cold Press Methods"
                  className="w-full h-auto max-w-md mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of satisfied customers who trust Farmik Oils for their family's health.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Priya Sharma",
                location: "Delhi",
                review: "The best mustard oil I've ever used! Pure, authentic taste and amazing quality. My family loves it."
              },
              {
                name: "Rajesh Kumar",
                location: "Mumbai",
                review: "Farmik Oils has become our go-to choice. The cold-press method really makes a difference in taste and health benefits."
              },
              {
                name: "Anita Singh",
                location: "Pune",
                review: "Excellent quality and fast delivery. The oil is pure and you can taste the authenticity. Highly recommended!"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-card">
                <CardContent className="p-6">
                  <div className="text-primary text-4xl mb-4">"</div>
                  <p className="text-muted-foreground mb-4 italic">{testimonial.review}</p>
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary-glow">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience Pure, Healthy Mustard Oil?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Order now and enjoy the authentic taste of traditional cold-pressed mustard oil delivered to your home.
          </p>
          <Link to="/products">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Shop Premium Oils
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
