"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
/**
 * Middleware de Autorização por Cargo (RBAC Genérico)
 * Protege rotas verificando se o cargo do usuário autenticado
 * (req.user.role) está incluído na lista de cargos permitidos.
 */
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        // A tipagem do express.d.ts garante que req.user estará acessível
        // caso tenha passado pelo authenticate.
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: "Acesso proibido: nível de permissão insuficiente." });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
