'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getSupabaseClient } from '@/lib/supabase';
import {
  X,
  Download,
  Share2,
  Store,
  Phone,
  MapPin,
  QrCode,
  Copy,
  Check
} from 'lucide-react';

interface ShopQRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
}

interface ShopData {
  name: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
}

export default function ShopQRCodeModal({ visible, onClose, shopId, shopName }: ShopQRCodeModalProps) {
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate QR code value - Web URL that works with any phone camera
  const qrCodeValue = `https://happyinline.com/join/${shopId}`;
  const webUrl = qrCodeValue;

  useEffect(() => {
    if (visible && shopId) {
      fetchShopData();
    }
  }, [visible, shopId]);

  const fetchShopData = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('shops')
        .select('name, logo_url, address, city, phone')
        .eq('id', shopId)
        .single();

      if (!error && data) {
        setShopData(data);
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    }
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (larger for better quality)
    const scale = 3;
    canvas.width = 300 * scale;
    canvas.height = 400 * scale;

    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw shop name
    ctx.fillStyle = '#09264b';
    ctx.font = `bold ${24 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(shopData?.name || shopName, canvas.width / 2, 40 * scale);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // Draw QR code centered
      const qrSize = 220 * scale;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 60 * scale;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Draw "SCAN TO BOOK" text
      ctx.fillStyle = '#0393d5';
      ctx.font = `bold ${16 * scale}px Arial`;
      ctx.fillText('SCAN TO BOOK', canvas.width / 2, (60 + 220 + 30) * scale);

      // Draw "Powered by Happy InLine"
      ctx.fillStyle = '#666';
      ctx.font = `${12 * scale}px Arial`;
      ctx.fillText('Powered by Happy InLine', canvas.width / 2, (60 + 220 + 55) * scale);

      // Download
      const link = document.createElement('a');
      link.download = `${shopData?.name || shopName}-qr-code.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  };

  const handleShare = async () => {
    const shareText = `Check out ${shopData?.name || shopName} on Happy InLine!\n\nDownload the app to book your appointment!\n\nOr visit: ${webUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book at ${shopData?.name || shopName}`,
          text: shareText,
          url: webUrl,
        });
      } catch (error) {
        // User cancelled or share failed, fall back to copy
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyShopId = () => {
    navigator.clipboard.writeText(shopId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Share Your Business</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-60px)] p-6">
          {/* QR Code Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            {/* Business Header */}
            <div className="text-center mb-6">
              {shopData?.logo_url ? (
                <img
                  src={shopData.logo_url}
                  alt={shopData.name}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-[#0393d5] flex items-center justify-center">
                  <Store className="w-8 h-8 text-white" />
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">
                {shopData?.name || shopName}
              </h3>
            </div>

            {/* QR Code */}
            <div ref={qrRef} className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-xl border-4 border-[#0393d5]">
                <QRCodeSVG
                  value={qrCodeValue}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Scan Badge */}
            <div className="flex items-center justify-center gap-2 bg-[#0393d5] text-white py-2 px-6 rounded-full mx-auto w-fit mb-4">
              <QrCode className="w-4 h-4" />
              <span className="font-bold text-sm tracking-wider">SCAN TO BOOK</span>
            </div>

            {/* Business Info */}
            {shopData && (shopData.phone || shopData.city || shopData.address) && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {shopData.phone && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>{shopData.phone}</span>
                  </div>
                )}
                {(shopData.city || shopData.address) && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{shopData.city || shopData.address}</span>
                  </div>
                )}
              </div>
            )}

            {/* Powered By */}
            <div className="text-center mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">Powered by Happy InLine</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">How it works:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0393d5]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <QrCode className="w-3 h-3 text-[#0393d5]" />
                </div>
                <p className="text-sm text-gray-600">
                  Customers scan this QR code with their phone camera
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0393d5]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Store className="w-3 h-3 text-[#0393d5]" />
                </div>
                <p className="text-sm text-gray-600">
                  They'll create an account linked to your business
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0393d5]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#0393d5] text-xs font-bold">📅</span>
                </div>
                <p className="text-sm text-gray-600">
                  They can book appointments directly from the app
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#0393d5] text-[#0393d5] rounded-xl font-semibold hover:bg-[#0393d5]/5 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0393d5] text-white rounded-xl font-semibold hover:bg-[#027bb5] transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>

          {/* Shop ID Reference */}
          <div>
            <p className="text-sm text-gray-500 mb-2 font-medium">Shop ID (for customer reference):</p>
            <button
              onClick={copyShopId}
              className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
            >
              <code className="text-[#0393d5] font-mono font-semibold text-sm">
                {shopId}
              </code>
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Customers can use this ID to search for your business in the app
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
