import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface RealFibQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  testId?: string;
  badgeLabel?: string;
}

const escapeXml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const createFibBadgeDataUri = (label: string): string => {
  const safeLabel = escapeXml(label.trim().slice(0, 6) || 'FIB');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 26"><rect x="1" y="1" width="42" height="24" rx="7" fill="#FFFFFF" stroke="#008955" stroke-width="2"/><text x="22" y="17" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="11.5" font-weight="900" fill="#007B4E" letter-spacing="0.8">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const RealFibQrCode: React.FC<RealFibQrCodeProps> = ({
  value,
  size = 152,
  className = '',
  testId = 'real-fib-qr-svg',
  badgeLabel = 'FIB',
}) => {
  const safeValue = (value || '').trim() || 'fib://pay?currency=IQD';
  const cleanBadge = (badgeLabel || '').trim();
  const badgeHeight = Math.max(18, Math.round(size * 0.16));
  const badgeWidth = Math.max(30, Math.round(size * 0.27));

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl bg-white p-2.5 border-2 border-emerald-500/60 shadow-[0_12px_32px_rgba(0,168,107,0.22)] ${className}`}
      data-testid={testId}
      data-qr-payload={safeValue}
    >
      <QRCodeSVG
        value={safeValue}
        size={size}
        level="Q"
        bgColor="#FFFFFF"
        fgColor="#061B2E"
        includeMargin={false}
        imageSettings={
          cleanBadge
            ? {
                src: createFibBadgeDataUri(cleanBadge),
                height: badgeHeight,
                width: badgeWidth,
                excavate: true,
              }
            : undefined
        }
        role="img"
        aria-label={`FIB QR Code (${safeValue})`}
      />
    </div>
  );
};
