
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="relative min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/50 to-background"></div>
      <div className="relative w-full max-w-4xl z-10 py-12">
        <Card className="bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline text-foreground">Terms and Conditions</CardTitle>
            <CardDescription>Legal terms for using SmartAttend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose prose-invert max-w-none">
            <p>Welcome to SmartAttend!</p>
            <p>These terms and conditions outline the rules and regulations for the use of SmartAttend's Website, located at this domain.</p>
            <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use SmartAttend if you do not agree to take all of the terms and conditions stated on this page.</p>
            <h3 className="text-xl font-semibold text-card-foreground"><strong>License</strong></h3>
            <p>Unless otherwise stated, SmartAttend and/or its licensors own the intellectual property rights for all material on SmartAttend. All intellectual property rights are reserved. You may access this from SmartAttend for your own personal use subjected to restrictions set in these terms and conditions.</p>
            <p>You must not:</p>
            <ul>
              <li>Republish material from SmartAttend</li>
              <li>Sell, rent or sub-license material from SmartAttend</li>
              <li>Reproduce, duplicate or copy material from SmartAttend</li>
              <li>Redistribute content from SmartAttend</li>
            </ul>
            <h3 className="text-xl font-semibold text-card-foreground"><strong>Disclaimer</strong></h3>
            <p>To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:</p>
            <ul>
                <li>limit or exclude our or your liability for death or personal injury;</li>
                <li>limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
                <li>limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
                <li>exclude any of our or your liabilities that may not be excluded under applicable law.</li>
            </ul>
             <div className="pt-6 text-center">
                <Link href="/" className="font-semibold text-primary hover:underline">
                    Back to Home
                </Link>
             </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
