import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Stripe integration from blueprint: javascript_stripe
// Runtime check - don't crash if key is missing
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface CheckoutFormProps {
  conversationId: string;
  reportType: string;
}

const CheckoutForm = ({ conversationId, reportType }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/chat?payment=success&conversationId=${conversationId}`,
        },
      });

      if (error) {
        toast({
          title: "支付失败",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "支付错误",
        description: err.message || "处理支付时出错",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            处理中...
          </>
        ) : (
          `支付 $2.00`
        )}
      </Button>
    </form>
  );
};

export default function ReportCheckout() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(0);
  const [reportId, setReportId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Get conversationId from URL params
  const params = new URLSearchParams(window.location.search);
  const conversationId = params.get('conversationId');
  const reportType = params.get('reportType') || 'angelic';

  // Check if Stripe is configured
  if (!stripePublicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>支付功能未配置</CardTitle>
            <CardDescription>
              管理员尚未配置Stripe支付系统。请联系网站管理员以启用此功能。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/chat')} className="w-full" data-testid="button-back-chat">
              返回对话
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (!conversationId) {
      setLocation('/chat');
      return;
    }

    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-report-payment", { 
      conversationId, 
      reportType 
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setReportId(data.reportId); // Store reportId for status checking
        setAmount(data.amount / 100); // Convert from cents to dollars
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error creating payment intent:", error);
        toast({
          title: "创建支付失败",
          description: "无法初始化支付，请重试",
          variant: "destructive",
        });
        setLocation('/chat');
      });
  }, [conversationId, reportType, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">准备支付...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>支付失败</CardTitle>
            <CardDescription>无法初始化支付，请重试</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/chat')} className="w-full" data-testid="button-back-chat">
              返回对话
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>购买 Angelic 报告</CardTitle>
          <CardDescription>
            完成支付后，我们将生成专业的创业分析报告并发送到您的邮箱
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">报告类型</span>
              <span className="text-sm">{reportType === 'angelic' ? 'Angelic 报告' : '标准报告'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">价格</span>
              <span className="text-lg font-bold text-primary">${amount.toFixed(2)} USD</span>
            </div>
          </div>

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm conversationId={conversationId!} reportType={reportType} />
          </Elements>

          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/chat')} 
              className="text-sm"
              data-testid="button-cancel-payment"
            >
              取消
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
