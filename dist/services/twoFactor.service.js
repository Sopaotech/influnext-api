"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const otplib_1 = require("otplib");
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = require("../utils/crypto");
const APP_NAME = 'InfluNext';
class TwoFactorService {
    /**
     * Gera um novo secret TOTP e retorna o QR Code para o usuário escanear.
     * Compatível com Google Authenticator (TOTP, 6 dígitos, 30s).
     */
    static async generateSetup(email) {
        const secret = (0, otplib_1.generateSecret)();
        const otpauthUrl = (0, otplib_1.generateURI)({
            issuer: APP_NAME,
            label: email,
            secret,
        });
        const qrCodeData = await qrcode_1.default.toDataURL(otpauthUrl);
        const encrypted = (0, crypto_1.encrypt)(secret);
        return { secret, otpauthUrl, qrCodeData, encrypted };
    }
    /**
     * Verifica se o código TOTP informado é válido contra o secret criptografado.
     */
    static verifyToken(encryptedSecret, token) {
        try {
            const secret = (0, crypto_1.decrypt)(encryptedSecret);
            const result = (0, otplib_1.verifySync)({ token, secret });
            return result.valid;
        }
        catch {
            return false;
        }
    }
}
exports.TwoFactorService = TwoFactorService;
