import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Truck, Smartphone, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentGatewayProps {
  totalAmount: number;
  onPaymentSuccess: (paymentMethod: string, paymentId?: string) => void;
  onCancel: () => void;
}

const PaymentGateway = ({ totalAmount, onPaymentSuccess, onCancel }: PaymentGatewayProps) => {
  const [selectedMethod, setSelectedMethod] = useState("cod");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setProcessing(true);

    try {
      if (selectedMethod === "cod") {
        // Cash on Delivery - process immediately
        setTimeout(() => {
          onPaymentSuccess("cash_on_delivery");
          toast({
            title: "Order placed successfully!",
            description: "Your order will be delivered and payment collected at your doorstep.",
          });
        }, 1000);
      } else if (selectedMethod === "online") {
        // Online payment - integrate with PhonePe
        const PHONEPE_API_KEY = process.env.REACT_APP_PHONEPE_API_KEY;
        
        if (!PHONEPE_API_KEY) {
          toast({
            title: "Payment Gateway Error",
            description: "PhonePe API key not configured. Please contact support.",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }

        // Simulate PhonePe integration
        // In production, this would make actual API calls to PhonePe
        setTimeout(() => {
          const mockPaymentId = `PHONEPE_${Date.now()}`;
          onPaymentSuccess("online_payment", mockPaymentId);
          toast({
            title: "Payment successful!",
            description: `Payment completed via PhonePe. ID: ${mockPaymentId}`,
          });
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Payment failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <span>Choose Payment Method</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="font-medium">Total Amount:</span>
          <span className="text-2xl font-bold text-primary">₹{totalAmount.toFixed(2)}</span>
        </div>

        <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <RadioGroupItem value="cod" id="cod" />
            <Label htmlFor="cod" className="flex items-center space-x-3 cursor-pointer flex-1">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Cash on Delivery</p>
                <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <RadioGroupItem value="online" id="online" />
            <Label htmlFor="online" className="flex items-center space-x-3 cursor-pointer flex-1">
              <Smartphone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Online Payment</p>
                <p className="text-sm text-muted-foreground">Pay securely via PhonePe</p>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {selectedMethod === "online" && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-foreground">
                  API Configuration Required
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add your PhonePe API key to environment variables as REACT_APP_PHONEPE_API_KEY
                </p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={processing}
            className="flex-1 bg-primary hover:bg-primary/90 farm-hover"
          >
            {processing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>
                  {selectedMethod === "cod" ? "Processing..." : "Redirecting..."}
                </span>
              </div>
            ) : (
              <>
                {selectedMethod === "cod" ? "Place Order" : "Pay Now"}
              </>
            )}
          </Button>
        </div>

        {selectedMethod === "online" && (
          <p className="text-xs text-center text-muted-foreground">
            You will be redirected to PhonePe for secure payment
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentGateway;