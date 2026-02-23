
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Root Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full shadow-2xl border-destructive/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-headline">Something went wrong</CardTitle>
          <CardDescription>
            The application encountered an unexpected error. This might be due to a network timeout or a permission issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-md text-xs font-code overflow-auto max-h-32">
            {error.message || 'Unknown runtime error'}
          </div>
          <Button 
            onClick={() => reset()} 
            className="w-full gap-2"
            variant="default"
          >
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.href = '/'} 
            className="w-full"
            variant="ghost"
          >
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
