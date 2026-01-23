
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/50 to-background"></div>
      <div className="relative w-full max-w-4xl z-10 py-12">
        <Card className="bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline text-primary">Privacy Policy</CardTitle>
            <CardDescription className="text-primary">Our policy on data collection and usage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose prose-invert max-w-none">
            <p>SmartAttend ("us", "we", or "our") operates this website (the "Service").</p>
            <p>This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data. We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.</p>
            <h3 className="text-xl font-semibold text-card-foreground"><strong>Information Collection and Use</strong></h3>
            <p>We collect several different types of information for various purposes to provide and improve our Service to you. This includes, but is not limited to, student names, registration numbers, photographs for attendance, and contact information.</p>
            <h3 className="text-xl font-semibold text-card-foreground"><strong>Use of Data</strong></h3>
            <p>SmartAttend uses the collected data for various purposes:</p>
            <ul>
              <li>To provide and maintain the Service</li>
              <li>To manage student and attendance records</li>
              <li>To provide analysis or valuable information so that we can improve the Service</li>
              <li>To monitor the usage of the Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
            <h3 className="text-xl font-semibold text-card-foreground"><strong>Security of Data</strong></h3>
            <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
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
