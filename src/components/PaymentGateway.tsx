import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Truck, Smartphone, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {useAuth} from "@/hooks/useAuth";
// import PayuPaymentPage from "./PayuPaymentPage.tsx";

interface PaymentGatewayProps {
  totalAmount: number;
  onPaymentSuccess: (paymentMethod: string, paymentId?: string) => void;
  onCancel: () => void;
}

interface PayuData {
  amount: number;
  productioninfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
}

const PaymentGateway = ({ totalAmount, onPaymentSuccess, onCancel }: PaymentGatewayProps) => {
  const [selectedMethod, setSelectedMethod] = useState("cod");
  const [hash, setHash] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<PayuData>({
    amount: 0,
  productioninfo: "",
  firstname: "",
  email: "",
  phone: "",
  surl: "",
  furl: ""
  });
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();


  const handlePayment = async () => {
    setProcessing(true);

    try {
      if (selectedMethod === "cod") {
        // ✅ Cash on Delivery
        setTimeout(() => {
          onPaymentSuccess("cash_on_delivery");
          toast({
            title: "Order placed successfully!",
            description: "Your order will be delivered and payment collected at your doorstep.",
          });
          setProcessing(false);
        }, 1000);
      } else if (selectedMethod === "online") {
        // ✅ PayU integration via Supabase Edge Function
        const response = await fetch(
          "https://liolbsrurnunulzlpprk.supabase.co/functions/v1/createpayuorder",
          {
            method: "POST",
            headers: { "Content-Type": "application/json",
              "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpb2xic3J1cm51bnVsemxwcHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODg0MTAsImV4cCI6MjA3MjA2NDQxMH0.pfNSqW5-ieGxlWc4MqkY7qZRXh2T7-O2vVXl-oLLdKU",   // required
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpb2xic3J1cm51bnVsemxwcHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODg0MTAsImV4cCI6MjA3MjA2NDQxMH0.pfNSqW5-ieGxlWc4MqkY7qZRXh2T7-O2vVXl-oLLdKU"
             },
            body: JSON.stringify({
              amount: totalAmount,
              productinfo: "Order",
              firstname: user.user_metadata.full_name || "customer",
              email: user.email || "customer@mail.com",
              phone: user.phone ||"9876543210",
              surl: "https://farmik.netlify.app/cart",
              furl: "https://farmik.netlify.app/cart",
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to create PayU order");
        }

        const data = await response.json();
        setHash(data.hash);
        setTransactionId(data.txnid);
        setOpen(true);
        setFormData(data);

        // Create hidden form & submit to PayU Hosted Checkout
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.action; // PayU URL
        form.style.display = "none";

        const fields = ["key","txnid","amount","productinfo","firstname","email","phone","surl",
        "furl","hash"];
        fields.forEach((field) => {
          const input = document.createElement("input");
          input.name = field;
          input.value = data[field];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit(); //  Redirects user to PayU secure page
      }
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "Unable to process payment. Try again.",
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
        {/* Amount */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="font-medium">Total Amount:</span>
          <span className="text-2xl font-bold text-primary">₹{(totalAmount).toFixed(2)}</span>
        </div>

        {/* Payment options */}
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
                <p className="text-sm text-muted-foreground">Redirect to PayU for secure payment</p>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {/* Warning note */}
        {selectedMethod === "online" && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-foreground">
                  You’ll be redirected to PayU’s secure checkout
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please don’t refresh or close the window during payment
                </p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Action buttons */}
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
            className="flex-1 bg-primary hover:bg-primary/90"
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
        {/* {
          open && <PayuPaymentPage data={formData} hash={hash} transactionId={transactionId} open={open}/>
        } */}
      </CardContent>
    </Card>
  );
};

export default PaymentGateway;
