'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  label?: string;
  onSignatureChange?: (signature: string | null) => void;
}

export function SignaturePad({ label, onSignatureChange }: SignaturePadProps) {
  const fullscreenCanvas = useRef<SignatureCanvas>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [fullscreenSize, setFullscreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isFullscreen) {
      const updateSize = () => {
        setFullscreenSize({
          width: window.innerWidth - 48,
          height: window.innerHeight - 200,
        });
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
    return undefined;
  }, [isFullscreen]);

  const clearSignature = () => {
    setSignatureData(null);
    onSignatureChange?.(null);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const clearFullscreen = () => {
    fullscreenCanvas.current?.clear();
  };

  const saveFullscreenSignature = () => {
    if (fullscreenCanvas.current && !fullscreenCanvas.current.isEmpty()) {
      const dataUrl = fullscreenCanvas.current.toDataURL('image/png');
      setSignatureData(dataUrl);
      onSignatureChange?.(dataUrl);
    }
    setIsFullscreen(false);
  };

  const cancelFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <>
      <div className="inline-flex flex-col gap-2">
        {/* Label + Signature Area aligned together */}
        <div className="flex items-center gap-2">
          {label && <span className="font-bold">{label}:</span>}
          <div
            className="relative w-64 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-white"
            onClick={openFullscreen}
          >
            {signatureData ? (
              <img
                src={signatureData}
                alt="Signature"
                className="h-[100px] w-[256px] object-contain"
              />
            ) : (
              <div className="flex h-[100px] w-[256px] items-center justify-center">
                <span className="text-xs text-gray-400">Click to sign</span>
              </div>
            )}
            {/* Expand icon */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFullscreen();
              }}
              className="absolute right-2 top-2 rounded bg-gray-100 p-1 hover:bg-gray-200"
              title="Sign in fullscreen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Clear Button */}
        {signatureData && (
          <button
            type="button"
            onClick={clearSignature}
            className="w-fit rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-bold">Sign Here</h2>
            <button
              type="button"
              onClick={cancelFullscreen}
              className="rounded p-2 hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Canvas Area */}
          <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white">
              {fullscreenSize.width > 0 && (
                <SignatureCanvas
                  ref={fullscreenCanvas}
                  canvasProps={{
                    width: fullscreenSize.width,
                    height: fullscreenSize.height,
                    className: 'cursor-crosshair',
                  }}
                />
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between border-t p-4">
            <button
              type="button"
              onClick={clearFullscreen}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelFullscreen}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFullscreenSignature}
                className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                Save Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
