/**
 * Servicio de Expediente Electrónico
 *
 * Implementa los requisitos de la Ley 21.180 para expedientes
 * administrativos electrónicos con:
 * - Índice electrónico
 * - Trazabilidad completa
 * - Foliado automático
 * - Integridad garantizada
 *
 * @module core/expediente-electronico
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../shared/utils/logger.js';
import { auditLog } from '../audit/services/audit.service.js';
import { AppError } from '../../shared/utils/errors.js';

/**
 * Estado del expediente
 */
export enum EstadoExpediente {
  BORRADOR = 'BORRADOR',
  EN_TRAMITE = 'EN_TRAMITE',
  PENDIENTE = 'PENDIENTE',
  RESUELTO = 'RESUELTO',
  ARCHIVADO = 'ARCHIVADO',
}

/**
 * Tipo de documento en expediente
 */
export enum TipoDocumento {
  SOLICITUD = 'SOLICITUD',
  RESOLUCION = 'RESOLUCION',
  INFORME = 'INFORME',
  CERTIFICADO = 'CERTIFICADO',
  NOTIFICACION = 'NOTIFICACION',
  ANEXO = 'ANEXO',
  OTRO = 'OTRO',
}

/**
 * Documento dentro del expediente
 */
export interface DocumentoExpediente {
  id: string;
  folio: number;
  tipo: TipoDocumento;
  titulo: string;
  descripcion?: string;
  archivoNombre: string;
  archivoTipo: string;
  archivoTamano: number;
  archivoHash: string;
  archivoUrl: string;
  firmado: boolean;
  firmaId?: string;
  fechaCreacion: Date;
  creadoPor: string;
  metadata?: Record<string, unknown>;
}

/**
 * Entrada en el índice del expediente
 */
export interface EntradaIndice {
  folio: number;
  documentoId: string;
  tipo: TipoDocumento;
  titulo: string;
  fechaIncorporacion: Date;
  incorporadoPor: string;
  hash: string;
}

/**
 * Expediente electrónico completo
 */
export interface Expediente {
  id: string;
  numero: string;
  materia: string;
  estado: EstadoExpediente;
  fechaCreacion: Date;
  fechaUltimaModificacion: Date;
  creadoPor: string;
  institucion: string;
  unidad: string;
  documentos: DocumentoExpediente[];
  indice: EntradaIndice[];
  folioActual: number;
  hashIntegridad: string;
  metadata?: Record<string, unknown>;
}

/**
 * Movimiento/Acción en el expediente
 */
export interface MovimientoExpediente {
  id: string;
  expedienteId: string;
  accion: string;
  descripcion: string;
  fecha: Date;
  usuarioId: string;
  usuarioNombre: string;
  detalles?: Record<string, unknown>;
}

class ExpedienteElectronicoService {
  /**
   * Crea un nuevo expediente electrónico
   */
  async crearExpediente(params: {
    numero: string;
    materia: string;
    institucion: string;
    unidad: string;
    creadoPor: string;
    metadata?: Record<string, unknown>;
  }): Promise<Expediente> {
    const expediente: Expediente = {
      id: uuidv4(),
      numero: params.numero,
      materia: params.materia,
      estado: EstadoExpediente.BORRADOR,
      fechaCreacion: new Date(),
      fechaUltimaModificacion: new Date(),
      creadoPor: params.creadoPor,
      institucion: params.institucion,
      unidad: params.unidad,
      documentos: [],
      indice: [],
      folioActual: 0,
      hashIntegridad: '',
      metadata: params.metadata,
    };

    expediente.hashIntegridad = this.calcularHashIntegridad(expediente);

    await auditLog({
      action: 'RESOURCE_CREATE',
      resourceType: 'Expediente',
      resourceId: expediente.id,
      userId: params.creadoPor,
      details: {
        numero: expediente.numero,
        materia: expediente.materia,
        institucion: expediente.institucion,
      },
    });

    logger.info('Expediente creado', {
      id: expediente.id,
      numero: expediente.numero,
    });

    return expediente;
  }

  /**
   * Agrega un documento al expediente con foliado automático
   */
  async agregarDocumento(
    expediente: Expediente,
    documento: {
      tipo: TipoDocumento;
      titulo: string;
      descripcion?: string;
      archivo: Buffer;
      archivoNombre: string;
      archivoTipo: string;
      agregadoPor: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ expediente: Expediente; documento: DocumentoExpediente }> {
    if (expediente.estado === EstadoExpediente.ARCHIVADO) {
      throw new AppError('No se pueden agregar documentos a un expediente archivado', 400);
    }

    // Incrementar folio
    const nuevoFolio = expediente.folioActual + 1;

    // Calcular hash del archivo
    const archivoHash = crypto.createHash('sha256').update(documento.archivo).digest('hex');

    // Crear documento
    const nuevoDocumento: DocumentoExpediente = {
      id: uuidv4(),
      folio: nuevoFolio,
      tipo: documento.tipo,
      titulo: documento.titulo,
      descripcion: documento.descripcion,
      archivoNombre: documento.archivoNombre,
      archivoTipo: documento.archivoTipo,
      archivoTamano: documento.archivo.length,
      archivoHash,
      archivoUrl: '', // Se establece al guardar
      firmado: false,
      fechaCreacion: new Date(),
      creadoPor: documento.agregadoPor,
      metadata: documento.metadata,
    };

    // Agregar al índice
    const entradaIndice: EntradaIndice = {
      folio: nuevoFolio,
      documentoId: nuevoDocumento.id,
      tipo: documento.tipo,
      titulo: documento.titulo,
      fechaIncorporacion: new Date(),
      incorporadoPor: documento.agregadoPor,
      hash: archivoHash,
    };

    // Actualizar expediente
    expediente.documentos.push(nuevoDocumento);
    expediente.indice.push(entradaIndice);
    expediente.folioActual = nuevoFolio;
    expediente.fechaUltimaModificacion = new Date();
    expediente.hashIntegridad = this.calcularHashIntegridad(expediente);

    await auditLog({
      action: 'RESOURCE_UPDATE',
      resourceType: 'Expediente',
      resourceId: expediente.id,
      userId: documento.agregadoPor,
      details: {
        accion: 'AGREGAR_DOCUMENTO',
        documentoId: nuevoDocumento.id,
        folio: nuevoFolio,
        tipo: documento.tipo,
      },
    });

    logger.info('Documento agregado a expediente', {
      expedienteId: expediente.id,
      documentoId: nuevoDocumento.id,
      folio: nuevoFolio,
    });

    return { expediente, documento: nuevoDocumento };
  }

  /**
   * Cambia el estado del expediente
   */
  async cambiarEstado(
    expediente: Expediente,
    nuevoEstado: EstadoExpediente,
    usuarioId: string,
    observacion?: string
  ): Promise<Expediente> {
    const estadoAnterior = expediente.estado;

    // Validar transiciones permitidas
    this.validarTransicionEstado(estadoAnterior, nuevoEstado);

    expediente.estado = nuevoEstado;
    expediente.fechaUltimaModificacion = new Date();
    expediente.hashIntegridad = this.calcularHashIntegridad(expediente);

    await auditLog({
      action: 'RESOURCE_UPDATE',
      resourceType: 'Expediente',
      resourceId: expediente.id,
      userId: usuarioId,
      details: {
        accion: 'CAMBIO_ESTADO',
        estadoAnterior,
        nuevoEstado,
        observacion,
      },
    });

    logger.info('Estado de expediente cambiado', {
      expedienteId: expediente.id,
      de: estadoAnterior,
      a: nuevoEstado,
    });

    return expediente;
  }

  /**
   * Verifica la integridad del expediente
   */
  verificarIntegridad(expediente: Expediente): {
    integro: boolean;
    problemas: string[];
  } {
    const problemas: string[] = [];

    // Verificar hash general
    const hashCalculado = this.calcularHashIntegridad(expediente);
    if (hashCalculado !== expediente.hashIntegridad) {
      problemas.push('El hash de integridad del expediente no coincide');
    }

    // Verificar secuencia de folios
    let folioEsperado = 1;
    for (const entrada of expediente.indice) {
      if (entrada.folio !== folioEsperado) {
        problemas.push(`Folio ${entrada.folio} fuera de secuencia, esperado ${folioEsperado}`);
      }
      folioEsperado++;
    }

    // Verificar que todos los documentos estén en el índice
    for (const doc of expediente.documentos) {
      const enIndice = expediente.indice.find(e => e.documentoId === doc.id);
      if (!enIndice) {
        problemas.push(`Documento ${doc.id} no está en el índice`);
      }
    }

    return {
      integro: problemas.length === 0,
      problemas,
    };
  }

  /**
   * Genera el índice electrónico en formato estándar
   */
  generarIndiceElectronico(expediente: Expediente): string {
    const lineas: string[] = [
      '='.repeat(80),
      'ÍNDICE ELECTRÓNICO DE EXPEDIENTE',
      '='.repeat(80),
      '',
      `Número de Expediente: ${expediente.numero}`,
      `Materia: ${expediente.materia}`,
      `Institución: ${expediente.institucion}`,
      `Unidad: ${expediente.unidad}`,
      `Estado: ${expediente.estado}`,
      `Fecha de Creación: ${expediente.fechaCreacion.toISOString()}`,
      `Total de Folios: ${expediente.folioActual}`,
      '',
      '-'.repeat(80),
      'DOCUMENTOS',
      '-'.repeat(80),
      '',
    ];

    for (const entrada of expediente.indice) {
      lineas.push(
        `Folio ${entrada.folio.toString().padStart(4, '0')}:`,
        `  Título: ${entrada.titulo}`,
        `  Tipo: ${entrada.tipo}`,
        `  Fecha: ${entrada.fechaIncorporacion.toISOString()}`,
        `  Incorporado por: ${entrada.incorporadoPor}`,
        `  Hash: ${entrada.hash}`,
        ''
      );
    }

    lineas.push(
      '-'.repeat(80),
      `Hash de Integridad: ${expediente.hashIntegridad}`,
      `Generado: ${new Date().toISOString()}`,
      '='.repeat(80)
    );

    return lineas.join('\n');
  }

  private calcularHashIntegridad(expediente: Expediente): string {
    const datos = {
      id: expediente.id,
      numero: expediente.numero,
      materia: expediente.materia,
      estado: expediente.estado,
      folioActual: expediente.folioActual,
      indice: expediente.indice.map(e => ({
        folio: e.folio,
        documentoId: e.documentoId,
        hash: e.hash,
      })),
    };

    return crypto.createHash('sha256').update(JSON.stringify(datos)).digest('hex');
  }

  private validarTransicionEstado(actual: EstadoExpediente, nuevo: EstadoExpediente): void {
    const transicionesPermitidas: Record<EstadoExpediente, EstadoExpediente[]> = {
      [EstadoExpediente.BORRADOR]: [EstadoExpediente.EN_TRAMITE],
      [EstadoExpediente.EN_TRAMITE]: [EstadoExpediente.PENDIENTE, EstadoExpediente.RESUELTO],
      [EstadoExpediente.PENDIENTE]: [EstadoExpediente.EN_TRAMITE, EstadoExpediente.RESUELTO],
      [EstadoExpediente.RESUELTO]: [EstadoExpediente.ARCHIVADO],
      [EstadoExpediente.ARCHIVADO]: [],
    };

    if (!transicionesPermitidas[actual].includes(nuevo)) {
      throw new AppError(
        `Transición de estado no permitida: ${actual} -> ${nuevo}`,
        400,
        'INVALID_STATE_TRANSITION'
      );
    }
  }
}

export const expedienteService = new ExpedienteElectronicoService();
