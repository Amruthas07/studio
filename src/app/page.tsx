import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginFormDynamic } from '@/components/auth/login-form-dynamic';


export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-collage');

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover -z-10"
          data-ai-hint={heroImage.imageHint}
          priority
        />
      )}
      <div className="absolute inset-0 bg-black/50 -z-10" />

      <div className="w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-sm border border-border/20 rounded-xl shadow-2xl">
          <div className="p-8 text-center">
            <h1 className="font-headline text-4xl font-bold text-primary-foreground">
              FaceAttend
            </h1>
            <p className="mt-2 text-primary-foreground/80">
              Smart Face Recognition Attendance System
            </p>
          </div>

          <div className="p-8 pt-0">
            <LoginFormDynamic />
          </div>
        </div>
      </div>
    </main>
  );
}
