import { QRCodeSVG } from 'qrcode.react';

const portalOrigin = (import.meta.env.VITE_PORTAL_URL || 'https://parkplacevillage.com').replace(/\/$/, '');
const guideUrl = `${portalOrigin}/portal-access-guide`;

export default function LoginHelpGuide() {
    return (
        <section className="mx-auto mt-8 w-full max-w-sm border-t border-white/30 pt-6 text-center">
            <h3 className="text-sm font-semibold text-white">Need help accessing the portal?</h3>
            <p className="mt-1 text-xs font-light text-white/80">
                Scan the QR code for the members guide.
            </p>
            <div className="mx-auto mt-4 w-fit rounded-lg bg-white p-3 shadow-lg">
                <QRCodeSVG
                    value={guideUrl}
                    size={152}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    title="HOA Portal members guide"
                />
            </div>
        </section>
    );
}
