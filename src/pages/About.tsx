import { Heart, Leaf, Award, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import farmikLogo from "@/assets/farmik-oils-logo.png";
import mustardOilProduct from "@/assets/mustard-oil-product.jpg";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-6">
              About Farmik Oils
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Preserving tradition, delivering purity. Our story is rooted in generations of cold-press expertise 
              and a commitment to bringing you the finest mustard oil using authentic methods.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Founded with a vision to preserve traditional oil extraction methods, Farmik Oils began as a 
                  small family operation in the heart of Punjab's mustard fields. Our founders recognized that 
                  modern processing was stripping away the natural goodness that made mustard oil a cornerstone 
                  of healthy Indian cooking.
                </p>
                <p>
                  Today, we continue this legacy by using time-honored cold-press techniques that have been 
                  passed down through generations. Our wooden churns and traditional stone mills ensure that 
                  every drop of oil retains its natural nutrients, authentic flavor, and health benefits.
                </p>
                <p>
                  At Farmik Oils, we believe that the best products come from respecting both nature and tradition. 
                  That's why we source only the finest mustard seeds and extract oil at temperatures that preserve 
                  its natural properties, delivering you the purest, most nutritious mustard oil possible.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-8">
                <img 
                  src={farmikLogo} 
                  alt="Farmik Oils Traditional Methods"
                  className="w-full h-auto max-w-md mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Traditional Cold-Press Method */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-accent/20 to-primary/20 rounded-3xl p-8">
                <img 
                  src={mustardOilProduct} 
                  alt="Traditional Cold-Press Mustard Oil Process"
                  className="w-full h-auto max-w-md mx-auto rounded-2xl"
                />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Traditional Cold-Press Method
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our cold-press process is a celebration of traditional craftsmanship. Unlike modern industrial 
                  methods that use high heat and chemicals, our approach preserves the oil's natural integrity.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Seed Selection</h4>
                      <p className="text-sm">Handpicked premium mustard seeds from organic farms</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Wooden Churning</h4>
                      <p className="text-sm">Traditional wooden gharats crush seeds at low temperature</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Natural Filtration</h4>
                      <p className="text-sm">Pure oil is naturally filtered without chemicals</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Quality Testing</h4>
                      <p className="text-sm">Every batch tested for purity and nutritional content</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Brand Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything we do is guided by our commitment to quality, tradition, and your family's health.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Leaf,
                title: "Natural Purity",
                description: "100% pure, unrefined oil with no chemicals, preservatives, or artificial additives."
              },
              {
                icon: Heart,
                title: "Health First",
                description: "Rich in omega-3, vitamin E, and antioxidants for your family's wellness and nutrition."
              },
              {
                icon: Award,
                title: "Traditional Excellence",
                description: "Time-honored cold-press methods that preserve nutrients and authentic taste."
              },
              {
                icon: Users,
                title: "Customer Trust",
                description: "Building lasting relationships through consistent quality and exceptional service."
              }
            ].map((value, index) => (
              <Card key={index} className="text-center border-0 shadow-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="border-0 shadow-card">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">Our Mission</h3>
                <p className="text-muted-foreground">
                  To preserve and promote traditional cold-press methods while delivering the purest, 
                  most nutritious mustard oil to families across India. We are committed to supporting 
                  healthy lifestyles through authentic, chemical-free products that honor our culinary heritage.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-card">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">Our Vision</h3>
                <p className="text-muted-foreground">
                  To become India's most trusted brand for traditional cold-pressed oils, known for 
                  uncompromising quality and authentic taste. We envision a future where every kitchen 
                  has access to pure, healthy oils that support both personal wellness and cultural traditions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quality Promise */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Our Quality Promise</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Every bottle of Farmik Oils undergoes rigorous quality testing to ensure you receive 
            the finest cold-pressed mustard oil. We stand behind our products with a commitment 
            to excellence that has earned the trust of thousands of families.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="bg-primary/5 rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2">Purity Guarantee</h4>
              <p className="text-muted-foreground">No chemicals, additives, or artificial processing</p>
            </div>
            <div className="bg-accent/5 rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2">Freshness Assured</h4>
              <p className="text-muted-foreground">Small batches ensure maximum freshness and quality</p>
            </div>
            <div className="bg-primary/5 rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2">Nutrient Rich</h4>
              <p className="text-muted-foreground">Cold-press method preserves natural vitamins and minerals</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;