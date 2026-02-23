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
    console.error('Critical Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full shadow-2xl border-destructive/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-headline text-primary">Unexpected Issue</CardTitle>
          <CardDescription>
            The application encountered a temporary loading error. This is often caused by network instability or a timed-out connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-md text-xs font-code overflow-auto max-h-32 border border-border">
            {error.message || 'ChunkLoadError: Failed to load application resources.'}
          </div>
          <Button 
            onClick={() => reset()} 
            className="w-full gap-2 h-12 text-base font-bold"
            variant="default"
          >
            <RefreshCcw className="h-5 w-5" />
            Retry Connection
          </Button>
          <Button 
            onClick={() => window.location.href = '/'} 
            className="w-full h-12"
            variant="ghost"
          >
            Return to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
