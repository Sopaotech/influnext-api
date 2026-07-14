import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const srcPath = 'C:\\Users\\alexs\\.gemini\\antigravity-ide\\brain\\a6ebead6-98ec-44e8-8082-f4ca86c3d11f\\influnext_pwa_icon_black_bg_1781481821310.png';
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
