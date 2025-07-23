export interface PricingPlan {
  id: string;
  title: string;
  description: string;
  price: string;
  priceSubtext: string;
  features: string[];
  buttonText: string;
  buttonVariant: "default" | "outline" | "secondary" | "destructive" | "ghost";
  isPopular: boolean;
  isPrimary: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    title: "Free",
    description: "Perfect for getting started with boreal.chat",
    price: "Free",
    priceSubtext: "/forever",
    features: [
      "Bring your own key (BYOK) option",
      "<strong>Access to all AI models</strong>",
      "Unlimited syncing across all platforms",
      "Chat organization & archiving",
      "No censorship, complete privacy",
      "Open-source & self-hostable",
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline",
    isPopular: false,
    isPrimary: false,
  },
  {
    id: "unlimited",
    title: "Unlimited",
    description: "For power users who need everything",
    price: "10€",
    priceSubtext: "/month",
    features: [
      "<strong>Everything in the Free plan, plus:</strong>",
      "<strong>Voice mode</strong>",
      '<strong>Unlimited Messages</strong> <small class="text-muted-foreground">(fair rate limits applied)</small>',
      '<strong>Unlimited storage</strong> <small class="text-muted-foreground">(fair rate limits applied)</small>',
      "<strong>Priority support</strong>",
      "<strong>Advanced features first</strong>",
    ],
    buttonText: "Get Unlimited",
    buttonVariant: "default",
    isPopular: true,
    isPrimary: true,
  },
];
