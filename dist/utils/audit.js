"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIntegrityHash = generateIntegrityHash;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Gera um hash SHA-256 determinístico dos dados capturados.
 * As chaves são ordenadas para garantir que o mesmo objeto produza sempre o mesmo hash.
 */
function generateIntegrityHash(data) {
    const str = JSON.stringify(data, Object.keys(data).sort());
    return crypto_1.default.createHash('sha256').update(str).digest('hex');
}
