import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Brain,
  Shield,
  TrendingUp,
  Zap,
  Target,
  Award,
  Upload,
  BarChart3,
  Eye,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Assessment",
      description: "Advanced machine learning models including LightGBM, XGBoost, and logistic regression for accurate credit risk prediction.",
    },
    {
      icon: Eye,
      title: "Full Explainability",
      description: "SHAP and LIME integration provides transparent insights into every prediction, showing which factors influenced the decision.",
    },
    {
      icon: Shield,
      title: "Fairness Guaranteed",
      description: "Built-in fairness audits using AIF360 detect and mitigate bias, ensuring equitable treatment across demographic groups.",
    },
    {
      icon: Zap,
      title: "Resource Efficient",
      description: "Optimized for performance with lightweight models that deliver enterprise-grade results without heavy computational requirements.",
    },
    {
      icon: Target,
      title: "High Accuracy",
      description: "Rigorous cross-validation and performance metrics (AUC, F1, Precision, Recall) ensure reliable credit risk assessments.",
    },
    {
      icon: Award,
      title: "Production Ready",
      description: "Scalable architecture ready for deployment, with model versioning and comprehensive API documentation.",
    },
  ];

  const workflow = [
    {
      icon: Upload,
      title: "Upload Data",
      description: "Import borrower data via CSV or enter information manually",
    },
    {
      icon: BarChart3,
      title: "Model Evaluation",
      description: "Review performance metrics and select the best model",
    },
    {
      icon: Eye,
      title: "Get Predictions",
      description: "Receive credit risk scores with detailed explanations",
    },
    {
      icon: CheckCircle2,
      title: "Fairness Check",
      description: "Audit results for bias and ensure equitable decisions",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-background/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-primary-foreground">
              <Zap className="h-4 w-4" />
              AI-Powered Credit Risk Assessment
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-primary-foreground md:text-6xl">
              CredMill: Explainable & Fair Credit Scoring
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/90 md:text-xl">
              Resource-efficient AI system that provides transparent, unbiased credit risk assessments with full explainability and fairness guarantees.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link to="/predict">
                <Button size="lg" variant="secondary" className="font-semibold">
                  Try Prediction Demo
                </Button>
              </Link>
              <Link to="/upload">
                <Button size="lg" variant="outline" className="border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/20 text-primary-foreground font-semibold">
                  Upload Your Data
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose CredMill?</h2>
            <p className="text-lg text-muted-foreground">
              A comprehensive credit risk platform that combines cutting-edge AI with ethical principles
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Simple four-step process from data to decision
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {workflow.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                    {index + 1}
                  </div>
                  <step.icon className="mb-3 h-8 w-8 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < workflow.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powered by Leading Technologies</h2>
            <p className="text-lg text-muted-foreground">
              Built with industry-standard tools for machine learning, explainability, and fairness
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {["scikit-learn", "LightGBM", "XGBoost", "SHAP", "LIME", "AIF360", "Fairlearn", "SQLAlchemy"].map((tech) => (
              <Card key={tech} className="p-4 text-center hover:shadow-md transition-shadow">
                <p className="font-semibold text-primary">{tech}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-primary py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Ready to Transform Your Credit Assessment?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8">
              Start using CredMill today and experience the future of fair, explainable credit scoring.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link to="/predict">
                <Button size="lg" variant="secondary" className="font-semibold">
                  Get Started
                </Button>
              </Link>
              <Link to="/evaluation">
                <Button size="lg" variant="outline" className="border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/20 text-primary-foreground font-semibold">
                  View Demo Results
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
