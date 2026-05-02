import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/roles';

/**
 * Middleware de Autorização por Cargo (RBAC Genérico)
 * Protege rotas verificando se o cargo do usuário autenticado 
 * (req.user.role) está incluído na lista de cargos permitidos.
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // A tipagem do express.d.ts garante que req.user estará acessível
    // caso tenha passado pelo authenticate.
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Acesso proibido: nível de permissão insuficiente." });
      return;
    }
    next();
  };
};
