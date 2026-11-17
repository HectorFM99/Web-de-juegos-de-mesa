import type { NextFunction, Request, Response } from 'express';
import type { HelmetOptions } from 'helmet';

/**
 * Cabeceras de seguridad HTTP del backend, configuradas con Helmet.
 * Los valores siguen las mismas políticas que las cabeceras del frontend (nginx.conf).
 */
export const helmetOptions: HelmetOptions = {
  // INTEGRITY: la API solo devuelve JSON, así que no necesita cargar ningún recurso.
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  // CONFIDENTIALITY: aislamiento entre orígenes.
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  // El frontend (otro puerto/origen) consume la API vía CORS, que no se ve afectado por CORP.
  crossOriginResourcePolicy: { policy: 'same-origin' },
  // X-Frame-Options: la API nunca debe mostrarse dentro de un iframe (anti-clickjacking).
  frameguard: { action: 'deny' },
  // Strict-Transport-Security: 1 año, subdominios y preload.
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Oculta X-Powered-By: Express (fingerprinting del servidor).
  hidePoweredBy: true,
  // X-Content-Type-Options: nosniff
  noSniff: true,
  // X-XSS-Protection: 0 (el filtro antiguo de los navegadores introducía vulnerabilidades).
  xXssProtection: true,
  xDnsPrefetchControl: { allow: false },
  xDownloadOptions: true,
  xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
  originAgentCluster: true,
};

/** Permissions-Policy no está incluida en Helmet, así que se añade con un middleware propio. */
export const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), payment=()';

export function permissionsPolicy(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
  next();
}
