/**
 * Servicio de Protección de Datos Personales
 *
 * Implementa los requisitos de la Ley 19.628 sobre Protección
 * de Datos Personales y el Decreto N°6 de Salud.
 *
 * Principios:
 * - Confidencialidad
 * - Integridad
 * - Disponibilidad
 * - Minimización de datos
 * - Consentimiento informado
 *
 * @module core/proteccion-datos
 */

import crypto from 'crypto';
import { config } from '../../config/environment.js';
import { logger } from '../../shared/utils/logger.js';
import { auditLog } from '../audit/services/audit.service.js';

/**
 * Categorías de datos según sensibilidad
 */
export enum CategoriaDato {
  /** Datos públicos o no sensibles */
  PUBLICO = 'PUBLICO',
  /** Datos personales básicos */
  PERSONAL = 'PERSONAL',
  /** Datos sensibles (salud, origen étnico, etc.) */
  SENSIBLE = 'SENSIBLE',
  /** Datos de salud específicamente */
  SALUD = 'SALUD',
}

/**
 * Base legal para tratamiento de datos
 */
export enum BaseLegal {
  CONSENTIMIENTO = 'CONSENTIMIENTO',
  CONTRATO = 'CONTRATO',
  OBLIGACION_LEGAL = 'OBLIGACION_LEGAL',
  INTERES_VITAL = 'INTERES_VITAL',
  INTERES_PUBLICO = 'INTERES_PUBLICO',
  INTERES_LEGITIMO = 'INTERES_LEGITIMO',
}

/**
 * Registro de consentimiento
 */
export interface Consentimiento {
  id: string;
  titularRun: string;
  proposito: string;
  categoriasDatos: CategoriaDato[];
  baseLegal: BaseLegal;
  otorgado: boolean;
  fechaOtorgamiento?: Date;
  fechaRevocacion?: Date;
  medioObtencion: 'DIGITAL' | 'PRESENCIAL' | 'TELEFONICO';
  textoConsentimiento: string;
  ipOrigen?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Solicitud de derechos ARCO
 * (Acceso, Rectificación, Cancelación, Oposición)
 */
export interface SolicitudARCO {
  id: string;
  tipo: 'ACCESO' | 'RECTIFICACION' | 'CANCELACION' | 'OPOSICION';
  solicitanteRun: string;
  fechaSolicitud: Date;
  descripcion: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'RECHAZADA';
  fechaRespuesta?: Date;
  respuesta?: string;
  atendidoPor?: string;
}

/**
 * Configuración de campo de datos
 */
interface CampoConfig {
  categoria: CategoriaDato;
  encriptar: boolean;
  enmascarar: boolean;
  patronMascara?: string;
}

class ProteccionDatosService {
  private readonly camposConfig: Record<string, CampoConfig> = {
    run: { categoria: CategoriaDato.PERSONAL, encriptar: false, enmascarar: true },
    email: { categoria: CategoriaDato.PERSONAL, encriptar: false, enmascarar: true },
    telefono: { categoria: CategoriaDato.PERSONAL, encriptar: false, enmascarar: true },
    direccion: { categoria: CategoriaDato.PERSONAL, encriptar: true, enmascarar: false },
    diagnostico: { categoria: CategoriaDato.SALUD, encriptar: true, enmascarar: false },
    medicamentos: { categoria: CategoriaDato.SALUD, encriptar: true, enmascarar: false },
    alergias: { categoria: CategoriaDato.SALUD, encriptar: true, enmascarar: false },
    antecedentes: { categoria: CategoriaDato.SALUD, encriptar: true, enmascarar: false },
    grupo_sanguineo: { categoria: CategoriaDato.SALUD, encriptar: false, enmascarar: false },
    prevision: { categoria: CategoriaDato.PERSONAL, encriptar: false, enmascarar: false },
  };

  /**
   * Encripta datos sensibles para almacenamiento
   */
  encriptarDato(valor: string, categoria: CategoriaDato): string {
    if (categoria === CategoriaDato.PUBLICO) {
      return valor;
    }

    const iv = crypto.randomBytes(16);
    const key = Buffer.from(config.security.encryptionKey).slice(0, 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(valor, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Desencripta datos sensibles
   */
  desencriptarDato(valorEncriptado: string): string {
    const parts = valorEncriptado.split(':');
    if (parts.length !== 3) {
      throw new Error('Formato de dato encriptado inválido');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const key = Buffer.from(config.security.encryptionKey).slice(0, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Enmascara datos para visualización segura
   */
  enmascararDato(valor: string, tipo: string): string {
    switch (tipo) {
      case 'run':
        // 12345678-9 -> 12***78-9
        const parts = valor.split('-');
        if (parts.length === 2) {
          const num = parts[0];
          return `${num.slice(0, 2)}***${num.slice(-2)}-${parts[1]}`;
        }
        return '***';

      case 'email':
        // usuario@dominio.cl -> us***@dominio.cl
        const [user, domain] = valor.split('@');
        if (user && domain) {
          return `${user.slice(0, 2)}***@${domain}`;
        }
        return '***@***';

      case 'telefono':
        // +56912345678 -> +569***5678
        if (valor.length > 8) {
          return `${valor.slice(0, 4)}***${valor.slice(-4)}`;
        }
        return '***';

      default:
        if (valor.length > 4) {
          return `${valor.slice(0, 2)}${'*'.repeat(valor.length - 4)}${valor.slice(-2)}`;
        }
        return '*'.repeat(valor.length);
    }
  }

  /**
   * Procesa un objeto para proteger datos según configuración
   */
  protegerObjeto<T extends Record<string, unknown>>(
    objeto: T,
    modo: 'encriptar' | 'enmascarar'
  ): T {
    const resultado = { ...objeto };

    for (const [campo, config] of Object.entries(this.camposConfig)) {
      if (campo in resultado && resultado[campo]) {
        const valor = String(resultado[campo]);

        if (modo === 'encriptar' && config.encriptar) {
          (resultado as Record<string, unknown>)[campo] = this.encriptarDato(valor, config.categoria);
        } else if (modo === 'enmascarar' && config.enmascarar) {
          (resultado as Record<string, unknown>)[campo] = this.enmascararDato(valor, campo);
        }
      }
    }

    return resultado;
  }

  /**
   * Registra un nuevo consentimiento
   */
  async registrarConsentimiento(params: {
    titularRun: string;
    proposito: string;
    categoriasDatos: CategoriaDato[];
    baseLegal: BaseLegal;
    textoConsentimiento: string;
    medioObtencion: 'DIGITAL' | 'PRESENCIAL' | 'TELEFONICO';
    ipOrigen?: string;
  }): Promise<Consentimiento> {
    const consentimiento: Consentimiento = {
      id: crypto.randomUUID(),
      titularRun: params.titularRun,
      proposito: params.proposito,
      categoriasDatos: params.categoriasDatos,
      baseLegal: params.baseLegal,
      otorgado: true,
      fechaOtorgamiento: new Date(),
      medioObtencion: params.medioObtencion,
      textoConsentimiento: params.textoConsentimiento,
      ipOrigen: params.ipOrigen,
    };

    await auditLog({
      action: 'RESOURCE_CREATE',
      resourceType: 'Consentimiento',
      resourceId: consentimiento.id,
      userId: params.titularRun,
      details: {
        proposito: params.proposito,
        categorias: params.categoriasDatos,
        baseLegal: params.baseLegal,
      },
    });

    logger.info('Consentimiento registrado', {
      id: consentimiento.id,
      titular: this.enmascararDato(params.titularRun, 'run'),
      proposito: params.proposito,
    });

    return consentimiento;
  }

  /**
   * Revoca un consentimiento existente
   */
  async revocarConsentimiento(
    consentimientoId: string,
    titularRun: string
  ): Promise<Consentimiento> {
    // Aquí se buscaría y actualizaría en la base de datos
    const consentimiento: Consentimiento = {
      id: consentimientoId,
      titularRun,
      proposito: '',
      categoriasDatos: [],
      baseLegal: BaseLegal.CONSENTIMIENTO,
      otorgado: false,
      fechaRevocacion: new Date(),
      medioObtencion: 'DIGITAL',
      textoConsentimiento: '',
    };

    await auditLog({
      action: 'RESOURCE_UPDATE',
      resourceType: 'Consentimiento',
      resourceId: consentimientoId,
      userId: titularRun,
      details: {
        accion: 'REVOCACION',
        fechaRevocacion: consentimiento.fechaRevocacion,
      },
    });

    logger.info('Consentimiento revocado', {
      id: consentimientoId,
      titular: this.enmascararDato(titularRun, 'run'),
    });

    return consentimiento;
  }

  /**
   * Registra una solicitud ARCO
   */
  async registrarSolicitudARCO(params: {
    tipo: 'ACCESO' | 'RECTIFICACION' | 'CANCELACION' | 'OPOSICION';
    solicitanteRun: string;
    descripcion: string;
  }): Promise<SolicitudARCO> {
    const solicitud: SolicitudARCO = {
      id: crypto.randomUUID(),
      tipo: params.tipo,
      solicitanteRun: params.solicitanteRun,
      fechaSolicitud: new Date(),
      descripcion: params.descripcion,
      estado: 'PENDIENTE',
    };

    await auditLog({
      action: 'RESOURCE_CREATE',
      resourceType: 'SolicitudARCO',
      resourceId: solicitud.id,
      userId: params.solicitanteRun,
      details: {
        tipo: params.tipo,
        descripcion: params.descripcion.substring(0, 100),
      },
    });

    logger.info('Solicitud ARCO registrada', {
      id: solicitud.id,
      tipo: params.tipo,
      solicitante: this.enmascararDato(params.solicitanteRun, 'run'),
    });

    return solicitud;
  }

  /**
   * Obtiene la categoría de un campo
   */
  obtenerCategoriaCampo(campo: string): CategoriaDato {
    return this.camposConfig[campo]?.categoria || CategoriaDato.PERSONAL;
  }

  /**
   * Verifica si se puede acceder a un dato según su categoría
   */
  verificarAcceso(categoria: CategoriaDato, tieneConsentimiento: boolean): boolean {
    switch (categoria) {
      case CategoriaDato.PUBLICO:
        return true;
      case CategoriaDato.PERSONAL:
      case CategoriaDato.SENSIBLE:
      case CategoriaDato.SALUD:
        return tieneConsentimiento;
      default:
        return false;
    }
  }
}

export const proteccionDatosService = new ProteccionDatosService();
