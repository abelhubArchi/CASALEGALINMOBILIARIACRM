import { jsPDF } from 'jspdf';
import { LOGO_INMO_BASE64 } from '#lib/assets/logoInmoBase64.js';

/**
 * Prepara los datos del asesor y de Casa Legal inyectando las fechas y ciudad
 * @param {Object} asesor
 */
export function getContratoData(asesor = {}) {
  const nombreAsesor = (asesor.nombreCompleto || `${asesor.nombres || ''} ${asesor.apellidos || ''}`).trim() || 'ASESOR INMOBILIARIO';
  const ciAsesor = asesor.ciConExpedido || asesor.ciCompleto || (asesor.ci ? `${asesor.ci} ${asesor.expedido || ''}`.trim() : 'S/N');
  const direccionAsesor = asesor.direccion || asesor.calle || 'Domicilio fijado en el Estado Plurinacional de Bolivia';
  
  // La sede oficial y legal donde se firma el contrato es siempre El Alto / La Paz
  const ciudadFirma = 'El Alto';
  
  // Fecha actual en formato boliviano formal
  const fecha = new Date();
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dia = fecha.getDate();
  const mesNombre = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();
  const fechaFirmaTexto = `${dia} de ${mesNombre} de ${anio}`;

  return {
    empresa: 'CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L.',
    nitEmpresa: '708808027',
    direccionEmpresa: 'AV. Satélite N° 2020 Edificio Torre CAUSAE 6.º Piso, Zona 12 de Octubre de la ciudad de El Alto',
    representante: 'Msc. Hugo Santos Quelca Q.',
    ciRepresentante: '6021044 LP',
    poder: 'Nº 358/2025 de fecha 05/11/2025 (Notaría de Fe Pública 41 Dr. Paulo Cesar Paco Limachi)',
    nombreAsesor,
    ciAsesor,
    direccionAsesor,
    ciudadFirma,
    fechaFirmaTexto,
    dia,
    mesNombre,
    anio
  };
}

export const CLAUSULAS_CONTRATO_BASE = [
  {
    num: 'PRIMERA',
    titulo: 'DE LAS PARTES',
    contenido: (d) => `Intervienen en la celebración del presente contrato:
1.1. ${d.empresa}, con domicilio ubicado en la ${d.direccionEmpresa}, debidamente representada por el Gerente Inmobiliario, ${d.representante}, con C.I. N° ${d.ciRepresentante}, hábil por ley; que de acuerdo a poder de representación ${d.poder}, Matrícula de Comercio N° ${d.nitEmpresa}, actuará en favor de ${d.empresa}, NIT. ${d.nitEmpresa}, en adelante y para efectos del presente contrato CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L.
1.2. ${d.nombreAsesor}, quien es mayor de edad, hábil por ley, titular de la Cédula de Identidad N° ${d.ciAsesor}, con domicilio en ${d.direccionAsesor}, quien en adelante y para efectos del presente contrato se denominará simplemente EL ASESOR.`
  },
  {
    num: 'SEGUNDA',
    titulo: 'DEL OBJETO',
    contenido: (d) => `Por el presente contrato, de su libre y espontánea voluntad, sin que medie error, dolo, violencia o cualquier vicio del consentimiento que pueda invalidar la legalidad de este documento, CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L. contrata al Asesor para operar dentro de la red de asesores en el rubro de los Bienes Raíces de Casa Legal, dicho acceso será a favor e interés de su persona únicamente.

2.1. CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L. por su parte operará en conjunto con EL ASESOR brindando información sobre su cartera de clientes e inmuebles, extendiendo el derecho de uso de la marca CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L. además de facilitar el uso de sus instalaciones a favor del ASESOR, quedando prohibido ceder o compartir usuario y contraseña y credenciales a terceros sin importar las circunstancias.

2.2. EL ASESOR deberá utilizar la Marca CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L. para toda captación de inmueble, requerimiento de clientes, la comercialización de dichos inmuebles y el desarrollo y posicionamiento en el mercado de bienes raíces dentro del territorio boliviano. Por tal motivo queda entendido que, a partir del presente contrato, cualquier operación comercial relacionada al rubro de bienes raíces constituye un trabajo en conjunto entre EL ASESOR y la Marca CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L. y por tanto deberá ser reportada a la oficina a través de su LÍDER. En caso de que EL ASESOR no reportase esta información u omitiese la declaración y/o pago de cualquier concepto que corresponda por la venta, anticrético o alquiler de bienes inmuebles, será pasible a las sanciones civiles y penales que establece el ordenamiento jurídico boliviano y desvinculación directa de la red inmobiliaria.

En este sentido, el Asesor podrá realizar todas las actividades de promoción, venta, corretaje, comercialización y asesoramiento en materia inmobiliaria (las "Actividades de Agencia"):
a) Promoción e intermediación en actividades de comercialización de bienes raíces, aplicando los estándares y procedimientos establecidos.
b) Atender, asesorar y servir a los clientes de CASA LEGAL manteniendo en orden toda la documentación requerida.
c) Captar nuevos clientes en favor y beneficio de la red y elaborar el listado de inmuebles con respaldo de contrato de exclusividad o no exclusividad.
d) Entregar informe mensual relativo a contratos celebrados, promovidos y cerrados.
e) Informar inmediatamente acerca de cualquier anomalía detectada.
f) Actuar como depositario responsable de todo el material publicitario y distintivos de marca proporcionados.
g) Asistir obligatoriamente a convocatorias de seguimiento y coordinación.
h) Ajustarse estrictamente a las políticas de promociones y código ético.
i) Asistir puntualmente a citas con clientes.
j) Asistir a reuniones periódicas con la gerencia.
k) Asistir a los cursos de capacitación obligatorios para el crecimiento profesional.
l) Visitar y verificar propiedades asignadas en cartera.`
  },
  {
    num: 'TERCERA',
    titulo: 'DE LAS CAPTACIONES Y CLIENTES',
    contenido: (d) => `Al pertenecer a la red EL ASESOR y CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L., acuerdan las partes que todo cliente o inmueble captado durante la duración del presente contrato serán de exclusiva y única propiedad de la red a través de su franquicia CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L.
3.1. Toda captación de inmueble deberá contar obligatoriamente con contrato de captación formal, avalúo de respaldo y firma del Representante Legal.
3.2. Al término o rescisión del contrato, EL ASESOR deberá comunicar a todos sus clientes que sus inmuebles serán traspasados a otro asesor de la red.
3.3. EL ASESOR reconoce que el respaldo de la Marca CASA LEGAL le brinda credibilidad, prestigio y herramientas comerciales de vanguardia.`
  },
  {
    num: 'CUARTA',
    titulo: 'DE LOS GASTOS DE COMERCIALIZACIÓN DE LOS INMUEBLES',
    contenido: (d) => `EL ASESOR correrá con los gastos de comercialización de los inmuebles captados por su persona o referidos por otros asesores y aceptados:
4.1. Letreros y señalética con logotipo oficial y número de contacto autorizado.
4.2. Avisos de prensa y publicaciones de marketing digital en redes sociales y portales web inmobiliarios.
4.3. Comunicaciones y logística de visitas e inspecciones.`
  },
  {
    num: 'QUINTA',
    titulo: 'CUOTA MENSUAL OPERATIVA Y USO DE MARCA',
    contenido: (d) => `EL ASESOR se compromete a cumplir con la cuota mensual operativa fijada por la oficina, destinada a plataformas tecnológicas, soporte operativo, capacitaciones y bonos, cancelada hasta el día 5 de cada mes adelantado. Todo arte, letrero y publicación debe incluir obligatoriamente el nombre del asesor junto a CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L.`
  },
  {
    num: 'SEXTA',
    titulo: 'DISTRIBUCIÓN DE INGRESOS',
    contenido: (d) => `Como fruto del esfuerzo conjunto entre EL ASESOR y CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L.:
- Se destinará un 10% del total de la comisión a favor de la inmobiliaria por concepto de derecho de uso de marca, soporte corporativo y gastos administrativos.
- El porcentaje para EL ASESOR corresponde al 20% del total de la comisión por la labor de intermediación y asesoría efectiva.
A) OPERACIÓN DIRECTA: EL ASESOR se compromete al pago del 10% destinado a Gastos de Administración por cada operación comercial. Cada parte emitirá la factura correspondiente por los ingresos efectivamente percibidos.`
  },
  {
    num: 'SÉPTIMA',
    titulo: 'CONFIDENCIALIDAD',
    contenido: (d) => `EL ASESOR se obliga a guardar absoluta reserva y confidencialidad respecto a carteras de clientes, bases de datos de inmuebles, métodos operativos y secretos comerciales, obligación que subsiste de manera indefinida incluso tras la conclusión del contrato.`
  },
  {
    num: 'OCTAVA',
    titulo: 'TERMINACIÓN DE CONTRATO',
    contenido: (d) => `El contrato podrá resolverse conforme al Art. 1255 del Código de Comercio o por decisión unilateral comunicada por escrito con un preaviso mínimo de treinta (30) días calendario. A la resolución, EL ASESOR dispone de cinco (5) días hábiles para dar de baja fanpages, retirar publicidad y devolver material institucional.`
  },
  {
    num: 'NOVENA',
    titulo: 'RELACIÓN CONTRACTUAL',
    contenido: (d) => `Se deja expresamente convenido que entre las partes no existe relación obrero-patronal ni subordinación laboral, rigiéndose la relación de forma independiente bajo las normas mercantiles de agencia inmobiliaria.`
  },
  {
    num: 'DÉCIMA',
    titulo: 'DE LA VIGENCIA',
    contenido: (d) => `El presente contrato tendrá una duración de 1 (UN) año calendario a partir de su suscripción, renovable tácitamente salvo que alguna de las partes comunique su intención contraria con al menos siete (7) días de anticipación.`
  },
  {
    num: 'UNDÉCIMA',
    titulo: 'CONCILIACIÓN Y ARBITRAJE',
    contenido: (d) => `Cualquier controversia se someterá en primera instancia a Conciliación según el Reglamento Interno y, en su defecto, al arbitraje institucional administrado por el Centro de Conciliación y Arbitraje Comercial de la Cámara de Comercio de La Paz, con renuncia a la vía judicial ordinaria.`
  },
  {
    num: 'DÉCIMA SEGUNDA',
    titulo: 'PACTO DE NO COMPETENCIA',
    contenido: (d) => `En virtud del Art. 1249 del Código de Comercio, EL ASESOR no podrá operar ni promover líneas inmobiliarias competidoras dentro del área durante el plazo de un (1) año, bajo pena de resarcimiento de daños con una penalidad tasada de US$ 5.000 (Cinco Mil Dólares Americanos).`
  },
  {
    num: 'DÉCIMA TERCERA',
    titulo: 'DEBERES DEL ASESOR',
    contenido: (d) => `Cumplir fielmente las directrices corporativas, mantener informado al líder sobre condiciones de mercado, rendir cuentas en plazos fijados y asistir a la Convención Anual de CASA LEGAL.`
  },
  {
    num: 'DÉCIMA CUARTA',
    titulo: 'PROHIBICIONES DEL ASESOR',
    contenido: (d) => `Prohibido suscribir contratos sin facultades notariales a nombre de la empresa, alterar marcas o listas de precios, generar litigios que menoscaben la reputación institucional, transferir sus derechos contractuales o ceder información confidencial.`
  },
  {
    num: 'DÉCIMA QUINTA',
    titulo: 'DIVISIBILIDAD',
    contenido: (d) => `La invalidez de alguna cláusula no afectará la vigencia y exigibilidad de las restantes estipulaciones del contrato.`
  },
  {
    num: 'DÉCIMA SEXTA',
    titulo: 'CONTRATO COMPLETO',
    contenido: (d) => `Este documento recoge la totalidad de acuerdos entre las partes, anulando cualquier entendimiento verbal anterior.`
  },
  {
    num: 'DÉCIMA SÉPTIMA',
    titulo: 'DE LA ACEPTACIÓN Y CONFORMIDAD',
    contenido: (d) => `Las partes manifiestan su plena y libre conformidad con todas y cada una de las cláusulas precedentes, firmando al pie en señal de aceptación en la ciudad de ${d.ciudadFirma}, a los ${d.fechaFirmaTexto}.`
  }
];

export const CLAUSULAS_CONTRATO = CLAUSULAS_CONTRATO_BASE;

/**
 * Función que dibuja vectorialmente un rombo sólido en el PDF sin usar caracteres unicode para evitar errores como "%Æ"
 */
function drawSolidDiamond(doc, x, y, size = 3, r = 11, g = 48, b = 58) {
  doc.setFillColor(r, g, b);
  const lines = [
    [size, size],
    [-size, size],
    [-size, -size],
    [size, -size]
  ];
  doc.lines(lines, x, y - size, [1, 1], 'F', true);
}

/**
 * Descargar Contrato en PDF usando jsPDF con el estilo idéntico a CONTRATOASESOR.pdf
 * @param {Object} asesor 
 * @param {Array} [customClausulas] - Lista opcional de cláusulas modificadas por la IA
 */
export function descargarContratoPDF(asesor = {}, customClausulas = null) {
  const d = getContratoData(asesor);
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4' // A4 estándar idéntico al documento original
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const usableWidth = pageWidth - (margin * 2);
  let y = margin;

  // Paleta de colores oficial de Casa Legal
  const COLOR_PETROLEO = [11, 48, 58]; // #0B303A
  const COLOR_DORADO = [192, 160, 109]; // #C0A06D
  const COLOR_NEGRO = [0, 0, 0];
  const COLOR_GRIS = [80, 80, 80];

  const addHeader = (pageNum) => {
    if (pageNum === 1) {
      // Página 1: Banda horizontal superior en #0B303A
      doc.setFillColor(...COLOR_PETROLEO);
      doc.rect(margin, 22, usableWidth, 62, 'F');

      // Logo oficial de Casa Legal (logoinmo.png)
      try {
        doc.addImage(LOGO_INMO_BASE64, 'PNG', margin + 10, 29, 48, 48);
      } catch (e) {
        console.warn('No se pudo renderizar logo en pág 1:', e);
      }

      // Texto dentro de la banda en blanco
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('CASA LEGAL', margin + 66, 48);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('FIRMA LEGAL & INMOBILIARIA S.R.L.', margin + 66, 61);

      // Dirección a la derecha dentro de la barra
      doc.setFontSize(7.5);
      const dirText1 = 'Av. Satélite Nº 2020 Edificio Torre CAUSAE 6.º Piso El Alto';
      const dirText2 = 'NIT 708808027';
      doc.text(dirText1, margin + usableWidth - doc.getTextWidth(dirText1) - 12, 48);
      doc.text(dirText2, margin + usableWidth - doc.getTextWidth(dirText2) - 12, 60);
    } else {
      // Páginas 2 a 8: Encabezado corporativo con el icono del logo
      try {
        doc.addImage(LOGO_INMO_BASE64, 'PNG', margin, 24, 15, 15);
      } catch (e) {
        console.warn('No se pudo renderizar logo en cabecera:', e);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COLOR_PETROLEO);
      doc.text('CASA LEGAL', margin + 20, 36);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLOR_GRIS);
      const sub = 'CONTRATO PRIVADO DE PRESTACIÓN DE SERVICIOS';
      doc.text(sub, margin + usableWidth - doc.getTextWidth(sub), 36);

      // Línea separadora delgada en color petróleo
      doc.setDrawColor(...COLOR_PETROLEO);
      doc.setLineWidth(0.8);
      doc.line(margin, 42, margin + usableWidth, 42);
    }
  };

  const addFooter = (pageNum, totalPages = '') => {
    // Línea divisoria inferior
    doc.setDrawColor(...COLOR_PETROLEO);
    doc.setLineWidth(0.8);
    doc.line(margin, pageHeight - 38, margin + usableWidth, pageHeight - 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_NEGRO);
    doc.text('CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L.', margin, pageHeight - 25);
    const pageStr = totalPages ? `PÁGINA ${pageNum} DE ${totalPages}` : `PÁGINA ${pageNum}`;
    doc.text(pageStr, margin + usableWidth - doc.getTextWidth(pageStr), pageHeight - 25);
  };

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - margin - 25) {
      doc.addPage();
      y = margin + 15;
      return true;
    }
    return false;
  };

  // Posición inicial página 1
  y = 96;

  // Línea delgada decorativa
  doc.setDrawColor(...COLOR_PETROLEO);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + usableWidth, y);
  y += 18;

  // Título Principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR_PETROLEO);
  doc.text('CONTRATO DE AGENCIA INMOBILIARIA', pageWidth / 2, y, { align: 'center' });
  y += 16;

  doc.setFontSize(10.5);
  doc.text('CONTRATO PRIVADO DE PRESTACIÓN DE SERVICIOS', pageWidth / 2, y, { align: 'center' });
  y += 24;

  // Preámbulo Legal
  const preambulo = `Conste por el presente documento privado, que al solo reconocimiento de firmas y rubricas hará fe de documento público de conformidad al artículo 1297 del Código Civil, un Contrato de Agencia Inmobiliaria (en adelante, el "Contrato") que se suscribe en virtud de las disposiciones establecidas en Capítulo IV, Título VI, Libro Tercero del Código de Comercio y de acuerdo a las cláusulas y condiciones siguientes:`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_NEGRO);
  const preambuloLines = doc.splitTextToSize(preambulo, usableWidth);
  doc.text(preambuloLines, margin, y);
  y += (preambuloLines.length * 13) + 16;

  // Cláusulas a renderizar (originales o personalizadas por IA)
  const listaClausulas = customClausulas && customClausulas.length > 0 ? customClausulas : CLAUSULAS_CONTRATO_BASE;

  for (const c of listaClausulas) {
    const textoTitulo = `${c.num} ${c.titulo}`;
    const textoContenido = typeof c.contenido === 'function' ? c.contenido(d) : c.contenido;
    const lineasContenido = doc.splitTextToSize(textoContenido, usableWidth);
    const alturaTotal = 20 + (lineasContenido.length * 13) + 10;

    checkPageBreak(alturaTotal > 120 ? 50 : alturaTotal);

    // Dibujar rombo vectorialmente (sin caracteres unicode para evitar %Æ)
    drawSolidDiamond(doc, margin + 4, y - 3, 3, 11, 48, 58);

    // Título de la cláusula en negrita color petróleo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_PETROLEO);
    doc.text(textoTitulo, margin + 12, y);
    y += 15;

    // Cuerpo de la cláusula en negro puro
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_NEGRO);

    for (let i = 0; i < lineasContenido.length; i++) {
      checkPageBreak(14);
      doc.text(lineasContenido[i], margin, y);
      y += 13;
    }
    y += 10;
  }

  // Sección de Firmas al final
  checkPageBreak(140);
  y += 10;

  // Línea divisoria antes de firmas
  doc.setDrawColor(...COLOR_PETROLEO);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + usableWidth, y);
  y += 20;

  // Fecha y ciudad centrada
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_NEGRO);
  doc.text(`${d.ciudadFirma}, ${d.fechaFirmaTexto}`, pageWidth / 2, y, { align: 'center' });
  y += 55;

  const colWidth = usableWidth / 2;
  const col1X = margin + 20;
  const col2X = margin + colWidth + 20;

  // Líneas de firma
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(1);
  doc.line(col1X, y, col1X + 170, y);
  doc.line(col2X, y, col2X + 170, y);
  y += 14;

  // Bloque 1: Representante Legal Casa Legal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_NEGRO);
  doc.text(d.representante, col1X + 85, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`C.I. ${d.ciRepresentante}`, col1X + 85, y + 12, { align: 'center' });
  doc.text('GERENTE CASA LEGAL', col1X + 85, y + 24, { align: 'center' });
  doc.text('FIRMA LEGAL & INMOBILIARIA S.R.L.', col1X + 85, y + 36, { align: 'center' });

  // Bloque 2: Asesor Inmobiliario
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_NEGRO);
  doc.text(d.nombreAsesor, col2X + 85, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`C.I. ${d.ciAsesor}`, col2X + 85, y + 12, { align: 'center' });
  doc.text('ASESOR INMOBILIARIO', col2X + 85, y + 24, { align: 'center' });

  // Renderizar encabezados y pies de página finales
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeader(i);
    addFooter(i, totalPages);
  }

  // Descarga del PDF
  const filename = `Contrato_Asesor_${d.nombreAsesor.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
