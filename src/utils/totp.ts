import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Configure otplib
authenticator.options = { 
    window: 6, // Allow 1 step window for time drift
    step: 30
};

export function generateSecret() {
    return authenticator.generateSecret();
}

export function generateToken(secret: string) {
    return authenticator.generate(secret);
}

export function verifyToken(token: string, secret: string) {
    try {
        return authenticator.verify({ token, secret });
    } catch (e) {
        return false;
    }
}

/**
 * Generates a Data URL (SVG format) for the QR code.
 * Using SVG is recommended for Cloudflare Workers as it doesn't require Canvas/ImageMagick.
 */
export async function generateQRCode(secret: string, accountName: string, issuer: string): Promise<string> {
    const otpauth = authenticator.keyuri(accountName, issuer, secret);
    // Returns an SVG string. We can embed this directly or encode it as data URI.
    // For <img> src, we'll use Data URI format.
    const svgString = await QRCode.toString(otpauth, { type: 'svg', margin: 2 });
    
    // Convert SVG string to Data URI
    const base64Svg = btoa(svgString);
    return `data:image/svg+xml;base64,${base64Svg}`;
}
