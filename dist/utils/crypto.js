"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.ENCRYPTION_KEY || '0'.repeat(64); // 32 bytes em hex
const KEY_BUFFER = Buffer.from(KEY_HEX, 'hex');
function encrypt(plaintext) {
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, KEY_BUFFER, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const payload = {
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        data: encrypted.toString('hex'),
    };
    return JSON.stringify(payload);
}
function decrypt(ciphertext) {
    const { iv, tag, data } = JSON.parse(ciphertext);
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, KEY_BUFFER, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    return Buffer.concat([
        decipher.update(Buffer.from(data, 'hex')),
        decipher.final(),
    ]).toString('utf8');
}
