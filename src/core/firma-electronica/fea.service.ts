/**
 * Servicio de Firma Electrónica Avanzada (FEA)
 *
 * Implementa la firma electrónica según la Ley 19.799 y los
 * estándares técnicos del Gobierno Digital de Chile.
 *
 * Requerida para:
 * - Documentos clínicos sensibles
 * - Recetas electrónicas
 * - Expedientes administrativos
 *
 * @module core/firma-electronica/fea
 */

import crypto from 'crypto';
import forge from 'node-forge';
import { logger } from '../../shared/utils/logger.js';
import { AppError } from '../../shared/utils/errors.js';
import { auditLog } from '../audit/services/audit.service.js';

/**
 * Tipos de firma electrónica según Ley 19.799
 */
export enum TipoFirma {
  /** Firma electrónica simple */
  SIMPLE = 'SIMPLE',
  /** Firma electrónica avanzada */
  AVANZADA = 'AVANZADA',
}

/**
 * Información del firmante
 */
export interface DatosFirmante {
  run: string;
  nombreCompleto: string;
  cargo?: string;
  institucion?: string;
}

/**
 * Documento firmado
 */
export interface DocumentoFirmado {
  /** ID único del documento */
  documentoId: string;
  /** Hash del contenido original */
  hashOriginal: string;
  /** Firma digital */
  firma: string;
  /** Algoritmo usado */
  algoritmo: string;
  /** Tipo de firma */
  tipoFirma: TipoFirma;
  /** Timestamp de firma */
  fechaFirma: Date;
  /** Datos del firmante */
  firmante: DatosFirmante;
  /** Certificado usado (si aplica) */
  certificadoSerial?: string;
}

/**
 * Resultado de verificación
 */
export interface ResultadoVerificacion {
  valido: boolean;
  mensaje: string;
  fechaVerificacion: Date;
  detalles?: {
    hashCoincide: boolean;
    firmaValida: boolean;
    certificadoVigente?: boolean;
  };
}

class FirmaElectronicaService {
  private readonly HASH_ALGORITHM = 'SHA-256';

  /**
   * Calcula el hash de un documento
   */
  calcularHash(contenido: Buffer | string): string {
    const hash = crypto.createHash('sha256');
    hash.update(typeof contenido === 'string' ? Buffer.from(contenido) : contenido);
    return hash.digest('hex');
  }

  /**
   * Firma un documento con firma electrónica simple
   * Utiliza HMAC con la clave de la aplicación
   */
  async firmarSimple(
    contenido: Buffer | string,
    firmante: DatosFirmante,
    claveSecreta: string
  ): Promise<DocumentoFirmado> {
    const documentoId = crypto.randomUUID();
    const hashOriginal = this.calcularHash(contenido);

    // Crear firma HMAC
    const hmac = crypto.createHmac('sha256', claveSecreta);
    hmac.update(hashOriginal);
    hmac.update(firmante.run);
    hmac.update(new Date().toISOString());
    const firma = hmac.digest('hex');

    const documento: DocumentoFirmado = {
      documentoId,
      hashOriginal,
      firma,
      algoritmo: 'HMAC-SHA256',
      tipoFirma: TipoFirma.SIMPLE,
      fechaFirma: new Date(),
      firmante,
    };

    await auditLog({
      action: 'RESOURCE_CREATE',
      resourceType: 'FirmaElectronica',
      resourceId: documentoId,
      userId: firmante.run,
      details: {
        tipoFirma: TipoFirma.SIMPLE,
        hashDocumento: hashOriginal.substring(0, 16) + '...',
      },
    });

    logger.info('Documento firmado (simple)', {
      documentoId,
      firmante: this.maskRun(firmante.run),
    });

    return documento;
  }

  /**
   * Firma un documento con Firma Electrónica Avanzada
   * Requiere certificado digital válido
   */
  async firmarAvanzada(
    contenido: Buffer | string,
    firmante: DatosFirmante,
    certificadoPEM: string,
    clavePrivadaPEM: string,
    passphrase?: string
  ): Promise<DocumentoFirmado> {
    const documentoId = crypto.randomUUID();
    const hashOriginal = this.calcularHash(contenido);

    try {
      // Cargar certificado
      const cert = forge.pki.certificateFromPem(certificadoPEM);

      // Verificar vigencia del certificado
      const ahora = new Date();
      if (ahora < cert.validity.notBefore || ahora > cert.validity.notAfter) {
        throw new AppError('Certificado no vigente', 400, 'CERTIFICATE_EXPIRED');
      }

      // Cargar clave privada
      let privateKey: forge.pki.PrivateKey;
      if (passphrase) {
        privateKey = forge.pki.decryptRsaPrivateKey(clavePrivadaPEM, passphrase);
      } else {
        privateKey = forge.pki.privateKeyFromPem(clavePrivadaPEM);
      }

      if (!privateKey) {
        throw new AppError('No se pudo cargar la clave privada', 400, 'INVALID_PRIVATE_KEY');
      }

      // Crear firma
      const md = forge.md.sha256.create();
      md.update(hashOriginal, 'utf8');
      const signature = privateKey.sign(md);
      const firma = forge.util.encode64(signature);

      const documento: DocumentoFirmado = {
        documentoId,
        hashOriginal,
        firma,
        algoritmo: 'RSA-SHA256',
        tipoFirma: TipoFirma.AVANZADA,
        fechaFirma: new Date(),
        firmante,
        certificadoSerial: cert.serialNumber,
      };

      await auditLog({
        action: 'RESOURCE_CREATE',
        resourceType: 'FirmaElectronicaAvanzada',
        resourceId: documentoId,
        userId: firmante.run,
        details: {
          tipoFirma: TipoFirma.AVANZADA,
          certificadoSerial: cert.serialNumber,
          emisorCertificado: cert.issuer.getField('CN')?.value,
        },
      });

      logger.info('Documento firmado (FEA)', {
        documentoId,
        firmante: this.maskRun(firmante.run),
        certificadoSerial: cert.serialNumber,
      });

      return documento;
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Error al firmar documento', { error });
      throw new AppError('Error al crear firma electrónica avanzada', 500, 'SIGNATURE_ERROR');
    }
  }

  /**
   * Verifica una firma electrónica simple
   */
  async verificarFirmaSimple(
    contenido: Buffer | string,
    documento: DocumentoFirmado,
    claveSecreta: string
  ): Promise<ResultadoVerificacion> {
    const hashActual = this.calcularHash(contenido);
    const hashCoincide = hashActual === documento.hashOriginal;

    // Recalcular firma esperada
    const hmac = crypto.createHmac('sha256', claveSecreta);
    hmac.update(documento.hashOriginal);
    hmac.update(documento.firmante.run);
    hmac.update(documento.fechaFirma.toISOString());
    const firmaEsperada = hmac.digest('hex');

    const firmaValida = firmaEsperada === documento.firma;

    const resultado: ResultadoVerificacion = {
      valido: hashCoincide && firmaValida,
      mensaje: hashCoincide && firmaValida
        ? 'Firma válida'
        : !hashCoincide
          ? 'El documento ha sido modificado'
          : 'Firma inválida',
      fechaVerificacion: new Date(),
      detalles: {
        hashCoincide,
        firmaValida,
      },
    };

    await auditLog({
      action: 'RESOURCE_READ',
      resourceType: 'VerificacionFirma',
      resourceId: documento.documentoId,
      details: {
        resultado: resultado.valido ? 'valido' : 'invalido',
        tipoFirma: documento.tipoFirma,
      },
    });

    return resultado;
  }

  /**
   * Verifica una Firma Electrónica Avanzada
   */
  async verificarFirmaAvanzada(
    contenido: Buffer | string,
    documento: DocumentoFirmado,
    certificadoPEM: string
  ): Promise<ResultadoVerificacion> {
    const hashActual = this.calcularHash(contenido);
    const hashCoincide = hashActual === documento.hashOriginal;

    try {
      const cert = forge.pki.certificateFromPem(certificadoPEM);
      const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;

      // Verificar vigencia
      const ahora = new Date();
      const certificadoVigente = ahora >= cert.validity.notBefore && ahora <= cert.validity.notAfter;

      // Verificar firma
      const md = forge.md.sha256.create();
      md.update(documento.hashOriginal, 'utf8');
      const signature = forge.util.decode64(documento.firma);
      const firmaValida = publicKey.verify(md.digest().bytes(), signature);

      const resultado: ResultadoVerificacion = {
        valido: hashCoincide && firmaValida && certificadoVigente,
        mensaje: !hashCoincide
          ? 'El documento ha sido modificado'
          : !firmaValida
            ? 'Firma digital inválida'
            : !certificadoVigente
              ? 'Certificado no vigente'
              : 'Firma electrónica avanzada válida',
        fechaVerificacion: new Date(),
        detalles: {
          hashCoincide,
          firmaValida,
          certificadoVigente,
        },
      };

      await auditLog({
        action: 'RESOURCE_READ',
        resourceType: 'VerificacionFEA',
        resourceId: documento.documentoId,
        details: {
          resultado: resultado.valido ? 'valido' : 'invalido',
          certificadoSerial: documento.certificadoSerial,
        },
      });

      return resultado;
    } catch (error) {
      logger.error('Error al verificar FEA', { error });
      return {
        valido: false,
        mensaje: 'Error al verificar firma',
        fechaVerificacion: new Date(),
      };
    }
  }

  private maskRun(run: string): string {
    const parts = run.split('-');
    if (parts.length !== 2) return '***';
    const numero = parts[0];
    return `${numero.slice(0, 2)}***${numero.slice(-2)}-${parts[1]}`;
  }
}

export const firmaElectronicaService = new FirmaElectronicaService();
