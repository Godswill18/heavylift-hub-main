import { memo } from 'react';

interface SuspensionWatermarkProps {
  isVisible: boolean;
}

const SuspensionWatermark = memo(({ isVisible }: SuspensionWatermarkProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <p
          className="text-[clamp(1.5rem,5vw,4rem)] font-black text-destructive/40 select-none transform -rotate-12 text-center max-w-full leading-tight px-4"
          style={{
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
            letterSpacing: '0.1em',
            wordSpacing: '0.2em',
          }}
        >
          THIS WEBSITE HAS BEEN
          <br />
          SUSPENDED BY THE DEVELOPER
          <br />
          Kindly contact support for more information.
        </p>
      </div>
    </div>
  );
});

SuspensionWatermark.displayName = 'SuspensionWatermark';

export default SuspensionWatermark;
