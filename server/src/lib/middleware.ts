import { NextFunction, Request, Response } from "express";
import { auth } from "./auth.js";

export const getUserMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers as any,
      });
      
      (req as any).user = {
        id: session?.user.id ?? null,
      };
      
      next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.redirect('/login?error=auth_failed');
    }
  };