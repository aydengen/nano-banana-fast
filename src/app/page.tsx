'use client';

import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import PolaroidCard from '@/app/components/PolaroidCard';
import { createAlbumPage } from '@/app/lib/albumUtils';
import Footer from '@/app/components/Footer';

const DECADES = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s'];

// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
  { top: '5%', left: '10%', rotate: -8 },
  { top: '15%', left: '60%', rotate: 5 },
  { top: '45%', left: '5%', rotate: 3 },
  { top: '2%', left: '35%', rotate: 10 },
  { top: '40%', left: '70%', rotate: -12 },
  { top: '50%', left: '38%', rotate: -3 },
];

const GHOST_POLAROIDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
  { initial: { x: "0%", y: "-200%", rotate: 0 }, transition: { delay: 0.5 } },
  { initial: { x: "100%", y: "150%", rotate: 10 }, transition: { delay: 0.3 } },
];

type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
  status: ImageStatus;
  url?: string;
  error?: string;
}

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-yellow-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-yellow-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);
  return matches;
};

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
  const [, setIsLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setAppState('image-uploaded');
        setGeneratedImages({}); // Clear previous results
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClick = async () => {
    if (!uploadedImage) return;

    setIsLoading(true);
    setAppState('generating');

    const initialImages: Record<string, GeneratedImage> = {};
    DECADES.forEach(decade => {
      initialImages[decade] = { status: 'pending' };
    });
    setGeneratedImages(initialImages);

    const concurrencyLimit = 2; // Process two decades at a time
    const decadesQueue = [...DECADES];

    const processDecade = async (decade: string) => {
      try {
        const prompt = `Reimagine the person in this photo in the style of the ${decade}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that decade. The output must be a photorealistic image showing the person clearly.`;

        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageDataUrl: uploadedImage,
            prompt,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        setGeneratedImages(prev => ({
          ...prev,
          [decade]: { status: 'done', url: data.imageUrl },
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setGeneratedImages(prev => ({
          ...prev,
          [decade]: { status: 'error', error: errorMessage },
        }));
        console.error(`Failed to generate image for ${decade}:`, err);
      }
    };

    const workers = Array(concurrencyLimit).fill(null).map(async () => {
      while (decadesQueue.length > 0) {
        const decade = decadesQueue.shift();
        if (decade) {
          await processDecade(decade);
        }
      }
    });

    await Promise.all(workers);

    setIsLoading(false);
    setAppState('results-shown');
  };

  const handleRegenerateDecade = async (decade: string) => {
    if (!uploadedImage) return;

    // Prevent re-triggering if a generation is already in progress
    if (generatedImages[decade]?.status === 'pending') {
      return;
    }

    console.log(`Regenerating image for ${decade}...`);

    // Set the specific decade to 'pending' to show the loading spinner
    setGeneratedImages(prev => ({
      ...prev,
      [decade]: { status: 'pending' },
    }));

    // Call the generation service for the specific decade
    try {
      const prompt = `Reimagine the person in this photo in the style of the ${decade}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that decade. The output must be a photorealistic image showing the person clearly.`;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUrl: uploadedImage,
          prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setGeneratedImages(prev => ({
        ...prev,
        [decade]: { status: 'done', url: data.imageUrl },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setGeneratedImages(prev => ({
        ...prev,
        [decade]: { status: 'error', error: errorMessage },
      }));
      console.error(`Failed to regenerate image for ${decade}:`, err);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setGeneratedImages({});
    setAppState('idle');
  };

  const handleDownloadIndividualImage = (decade: string) => {
    const image = generatedImages[decade];
    if (image?.status === 'done' && image.url) {
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `时光相片-${decade}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadAlbum = async () => {
    setIsDownloading(true);
    try {
      const imageData = Object.entries(generatedImages)
        .filter(([, image]) => image.status === 'done' && image.url)
        .reduce((acc, [decade, image]) => {
          acc[decade] = image!.url!;
          return acc;
        }, {} as Record<string, string>);

      if (Object.keys(imageData).length < DECADES.length) {
        alert("Please wait for all images to finish generating before downloading the album.");
        return;
      }

      const albumDataUrl = await createAlbumPage(imageData);

      const link = document.createElement('a');
      link.href = albumDataUrl;
      link.download = '时光专辑.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Failed to create or download album:", error);
      alert("Sorry, there was an error creating your album. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05]"></div>

      <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
        <div className="text-center mb-10">
          <h1 className="text-6xl md:text-8xl font-caveat font-bold text-neutral-100">时光照相馆</h1>
          <p className="font-permanent-marker text-neutral-300 mt-2 text-xl tracking-wide">看看不同时光里的自己</p>
        </div>

        {appState === 'idle' && (
          <div className="relative flex flex-col items-center justify-center w-full">
            {/* Ghost polaroids for intro animation */}
            {GHOST_POLAROIDS_CONFIG.map((config, index) => (
              <motion.div
                key={index}
                className="absolute w-80 h-[26rem] rounded-md p-4 bg-neutral-100/10 blur-sm"
                initial={config.initial}
                animate={{
                  x: "0%", y: "0%", rotate: (Math.random() - 0.5) * 20,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{
                  ...config.transition,
                  ease: "circOut",
                  duration: 2,
                }}
              />
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2, duration: 0.8, type: 'spring' }}
              className="flex flex-col items-center"
            >
              <label htmlFor="file-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                <PolaroidCard
                  caption="点击开始"
                  status="done"
                />
              </label>
              <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
              <p className="mt-8 font-permanent-marker text-neutral-500 text-center max-w-xs text-lg">
                点击相框上传照片，开启你的时光之旅。
              </p>
            </motion.div>
          </div>
        )}

        {appState === 'image-uploaded' && uploadedImage && (
          <div className="flex flex-col items-center gap-6">
            <PolaroidCard
              imageUrl={uploadedImage}
              caption="你的照片"
              status="done"
            />
            <div className="flex items-center gap-4 mt-4">
              <button onClick={handleReset} className={secondaryButtonClasses}>
                换一张
              </button>
              <button onClick={handleGenerateClick} className={primaryButtonClasses}>
                生成
              </button>
            </div>
          </div>
        )}

        {(appState === 'generating' || appState === 'results-shown') && (
          <>
            {isMobile ? (
              <div className="w-full max-w-sm flex-1 overflow-y-auto mt-4 space-y-8 p-4">
                {DECADES.map((decade) => (
                  <div key={decade} className="flex justify-center">
                    <PolaroidCard
                      caption={decade}
                      status={generatedImages[decade]?.status || 'pending'}
                      imageUrl={generatedImages[decade]?.url}
                      error={generatedImages[decade]?.error}
                      onShake={handleRegenerateDecade}
                      onDownload={handleDownloadIndividualImage}
                      isMobile={isMobile}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div ref={dragAreaRef} className="relative w-full max-w-5xl h-[860px] mt-4">
                {DECADES.map((decade, index) => {
                  const { top, left, rotate } = POSITIONS[index];
                  return (
                    <motion.div
                      key={decade}
                      className="absolute cursor-grab active:cursor-grabbing"
                      style={{ top, left }}
                      initial={{ opacity: 0, scale: 0.5, y: 100, rotate: 0 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        rotate: `${rotate}deg`,
                      }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
                    >
                      <PolaroidCard
                        dragConstraintsRef={dragAreaRef as React.RefObject<HTMLElement>}
                        caption={decade}
                        status={generatedImages[decade]?.status || 'pending'}
                        imageUrl={generatedImages[decade]?.url}
                        error={generatedImages[decade]?.error}
                        onShake={handleRegenerateDecade}
                        onDownload={handleDownloadIndividualImage}
                        isMobile={isMobile}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
            <div className="h-20 mt-4 flex items-center justify-center">
              {appState === 'results-shown' && (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={handleDownloadAlbum}
                    disabled={isDownloading}
                    className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isDownloading ? '生成专辑...' : '下载专辑'}
                  </button>
                  <button onClick={handleReset} className={secondaryButtonClasses}>
                    再来一张
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
