import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { encrypt, decrypt } from '../utils/crypto';

const APP_NAME = 'InfluNext';

interface TwoFactorSetup {
  secret:      string; // plain (exibir ao usuário uma vez)
  otpauthUrl:  string;
  qrCodeData:  string; // data URL base64 do QR
  encrypted:   string; // salvar no banco
}

export class TwoFactorService {
  /**
   * Gera um novo secret TOTP e retorna o QR Code para o usuário escanear.
   * Compatível com Google Authenticator (TOTP, 6 dígitos, 30s).
   */
  static async generateSetup(email: string): Promise<TwoFactorSetup> {
    const secret     = generateSecret();
    const otpauthUrl = generateURI({
      issuer: APP_NAME,
      label:  email,
      secret,
    });
    const qrCodeData = await QRCode.toDataURL(otpauthUrl);
    const encrypted  = encrypt(secret);

    return { secret, otpauthUrl, qrCodeData, encrypted };
  }

  /**
   * Verifica se o código TOTP informado é válido contra o secret criptografado.
   */
  static verifyToken(encryptedSecret: string, token: string): boolean {
    try {
      const secret = decrypt(encryptedSecret);
      const result = verifySync({ token, secret });
      return result.valid;
    } catch {
      return false;
    }
  }
}
