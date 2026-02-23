'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

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

  const isChunkError = error.message?.includes('ChunkLoadError') || error.name === 'ChunkLoadError';

  const handleReset = () => {
    if (isChunkError) {
      // For chunk errors, a hard reload is usually required to fetch new assets
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full shadow-2xl border-destructive/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-headline text-primary">
            {isChunkError ? 'Connection Interrupted' : 'Unexpected Issue'}
          </CardTitle>
          <CardDescription>
            {isChunkError 
              ? 'The application failed to load some resources. This often happens after an update or due to a temporary network blip.' 
              : 'The application encountered a temporary loading error. This is often caused by network instability.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-md text-xs font-code overflow-auto max-h-32 border border-border">
            {error.message || 'Unknown application error occurred.'}
          </div>
          <Button 
            onClick={handleReset} 
            className="w-full gap-2 h-12 text-base font-bold"
            variant="default"
          >
            <RefreshCcw className="h-5 w-5" />
            {isChunkError ? 'Reload Application' : 'Retry Connection'}
          </Button>
          <Button 
            onClick={() => window.location.href = '/'} 
            className="w-full h-12 gap-2"
            variant="ghost"
          >
            <Home className="h-4 w-4" />
            Return to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
