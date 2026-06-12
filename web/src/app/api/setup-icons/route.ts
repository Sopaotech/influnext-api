import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const srcPath = 'C:\\Users\\alexs\\.gemini\\antigravity\\brain\\100492a8-6c2f-4eb3-b693-b4e5e9c6a6ba\\influnext_pwa_icon_1781218488314.png';
    const publicDir = path.join(process.cwd(), 'public');
    
    const destIcon = path.join(publicDir, 'icon.png');
    const destAppleIcon = path.join(publicDir, 'apple-icon.png');
    
    if (!fs.existsSync(srcPath)) {
      return NextResponse.json({ 
        error: 'Source image not found in artifacts directory.', 
        checkedPath: srcPath 
      }, { status: 404 });
    }
    
    // Copy to icon.png
    fs.copyFileSync(srcPath, destIcon);
    // Copy to apple-icon.png
    fs.copyFileSync(srcPath, destAppleIcon);
    
    return NextResponse.json({ 
      success: true, 
      message: 'PWA PNG icons generated and copied successfully!',
      copiedTo: [destIcon, destAppleIcon]
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Failed to copy icon files.', 
      details: err.message 
    }, { status: 500 });
  }
}
