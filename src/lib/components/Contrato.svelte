<!--
  Contrato.svelte — Contrato Privado de Prestación de Servicios
  CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L.

  Uso:
    <Contrato logo="/logoinmo.png"
              fecha="La Paz, Octubre 2026"
              asesor={{ nombre: '...', ci: '1234567 LP', domicilio: '...' }} />

  - El logo (logoinmo.png) va en /static de SvelteKit.
  - El componente reparte el texto en hojas oficio (con banda, marca de agua y "Página X de Y").
  - Para el PDF: botón "Imprimir / Guardar PDF" → destino "Guardar como PDF", tamaño Oficio,
    márgenes "Ninguno", activar "Gráficos de fondo".
-->
<script>
  import { onMount, tick } from 'svelte';

  let {
    logo = '/logoinmo.png',
    fecha = 'La Paz, Octubre 2026',
    asesor = {
      nombre: 'Miguel Angel Magne Luna',
      ci: '8463889 LP',
      domicilio: 'C. Cuarto Centenario No. 1067 Z. Villa Nueva Potosi'
    }
  } = $props();

  const EMPRESA = 'CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L.';
  const representante = { nombre: 'Msc. Hugo Santos Quelca Q.', ci: '6021044 LP' };

  // t: h = cláusula · p = párrafo · s = subtítulo · i = ítem (l = etiqueta, i = sangría, w = ancho etiqueta, en pt)
  let bloques = $derived.by(() => [
    { t: 'p', x: "Conste por el presente documento privado, que al solo reconocimiento de firmas y rubricas hará fe de documento público de conformidad al artículo 1297 del Código Civil, un Contrato de Agencia Inmobiliaria (en adelante, el “Contrato”) que se suscribe en virtud de las disposiciones establecidas en Capítulo IV, Título VI, Libro Tercero del Código de Comercio y de acuerdo a las cláusulas y condiciones siguientes:" },
    { t: 'h', n: "PRIMERA", x: "DE LAS PARTES" },
    { t: 'p', x: "Intervienen en la celebración del presente contrato:" },
    { t: 'i', l: "1.1.", i: 0, w: 26, x: `${EMPRESA}, con domicilio ubicado en la AV. Satélite N° 2020 Edificio Torre CAUSAE 6.° Piso, Zona 12 de Octubre de la ciudad de El Alto debidamente representada por el Gerente Inmobiliario, Msc. Hugo Santos Quelca Q., con C.I. N° 6021044, expedido en LP, hábil por ley; que de acuerdo a poder de representación, N° 358/2025, de fecha 05/11/ 2025, El Alto, otorgado ante la Notaria de Fe Publica 41 Dr. Paulo Cesar Paco Limachi Matricula de Comercio N° 708808027, actuará en favor de ${EMPRESA}, NIT. 708808027, en adelante y para efectos del presente contrato ${EMPRESA}` },
    { t: 'i', l: "1.2.", i: 0, w: 26, x: `${asesor.nombre} quien es mayor de edad, hábil por ley, titular de la Cedula de Identidad N° ${asesor.ci} con domicilio ${asesor.domicilio}, quien en adelante y para efectos del presente contrato se denominará simplemente EL ASESOR.` },
    { t: 'h', n: "SEGUNDA", x: "DEL OBJETO" },
    { t: 'p', x: `Por el presente contrato, de su libre y espontánea voluntad, sin que medie error, dolo, violencia o cualquier vicio del consentimiento que pueda invalidar la legalidad de este documento, ${EMPRESA} contrata al Asesor para operar dentro de la red de asesores en el rubro de los Bienes Raíces de Casa Legal, dicho acceso será a favor e interés de su persona únicamente.` },
    { t: 'i', l: "2.1.", i: 0, w: 26, x: `${EMPRESA} por su parte operará en conjunto con EL ASESOR brindando información sobre su cartera de clientes e inmuebles, extendiendo el derecho de uso de la marca ${EMPRESA} además de facilitar el uso de sus instalaciones a favor del ASESOR, quedando prohibido ceder o compartir usuario y contraseña y credenciales a terceros sin importar las circunstancias.` },
    { t: 'i', l: "2.2.", i: 0, w: 26, x: `EL ASESOR deberá utilizar la Marca ${EMPRESA} para toda captación de inmueble, requerimiento de clientes, la comercialización de dichos inmuebles y el desarrollo y posicionamiento en el mercado de bienes raíces dentro del territorio boliviano. Por tal motivo queda entendido que, a partir del presente contrato, cualquier operación comercial relacionada al rubro de bienes raíces constituye un trabajo en conjunto entre EL ASESOR y la Marca ${EMPRESA} y por tanto deberá ser reportada a la oficina a través de su LIDER. En caso de que EL ASESOR no reportarse esta información u omitiese la declaración y/o pago de cualquier concepto que corresponda por la venta, anticrético o alquiler de bienes inmuebles, será pasible a las sanciones civiles y penales que establece el ordenamiento jurídico boliviano y desvinculación directa de la red inmobiliaria ${EMPRESA}` },
    { t: 'p', x: `En este sentido, el Asesor podrá realizar todas las actividades de promoción, venta, corretaje, comercialización y asesoramiento en materia inmobiliaria, así como de negocios de bienes inmuebles a favor de ${EMPRESA} de igual manera, el Asesor podrá realizar las actividades que se detallan a continuación dentro del Área Prefijada (todas las actividades detalladas en la presente cláusula, en adelante se denominarán las “Actividades de Agencia”.` },
    { t: 'i', l: "a)", i: 0, w: 20, x: `Promoción e intermediación en actividades de comercialización de bienes raíces, aplicando los estándares de calidad y los “PROCEDIMIENTOS ESTABLECIDOS POR ${EMPRESA}”, los mismos que forman parte integrante e indisoluble del presente Contrato, así como las disposiciones y reglas que tenga a bien emitir en cada oportunidad.` },
    { t: 'i', l: "b)", i: 0, w: 20, x: `Atender, asesorar y servir a los clientes de ${EMPRESA} en general y a los que le fueren asignados por ésta, para su atención regular y continuada, manteniendo en orden toda la documentación que sea necesaria conforme a los procedimientos establecidos por ${EMPRESA}` },
    { t: 'i', l: "c)", i: 0, w: 20, x: `Captar nuevos clientes en favor y beneficio de ${EMPRESA} y elaborar un listado de los bienes inmuebles que reciba para la promoción de los servicios de bienes raíces y que se incorporan a la cartera de ${EMPRESA} a estos efectos, se deja claramente establecido que, todo servicio contratado por el propietario del inmueble (cliente) se encuentra alcanzado por los honorarios derivados del presente Contrato.` },
    { t: 'i', l: "d)", i: 0, w: 20, x: `Entregar un informe mensual a ${EMPRESA} relativo a los contratos celebrados, promovidos y cerrados con relación a la comercialización de bienes raíces como intermediario de ${EMPRESA}` },
    { t: 'i', l: "e)", i: 0, w: 20, x: `Informar acerca de cualquier anomalía que sea de su conocimiento en la atención de los clientes o bien en las promociones y negocios de ${EMPRESA}` },
    { t: 'i', l: "f)", i: 0, w: 20, x: `Actuar como depositario de todo el material publicitario que le provea ${EMPRESA} y la documentación relacionada con las actividades de ésta última, velando porque el material distribuido esté en buenas condiciones y sea exhibido con las calidades requeridas por ${EMPRESA} obligándose desde ya, a devolver todo material que esté en su poder al momento de finalización del presente Contrato;` },
    { t: 'i', l: "g)", i: 0, w: 20, x: `Reunirse obligatoriamente cada vez que sea convocado, con el personal de ${EMPRESA} con el objeto de realizar seguimiento a los proyectos de ${EMPRESA}` },
    { t: 'i', l: "h)", i: 0, w: 20, x: `Ajustarse fielmente a las políticas de promociones de ${EMPRESA} y a las cláusulas del presente Contrato;` },
    { t: 'i', l: "i)", i: 0, w: 20, x: `Asistir puntualmente a las citas con los clientes de ${EMPRESA}` },
    { t: 'i', l: "j)", i: 0, w: 20, x: `Asistir a reuniones semanales, quincenales o mensuales con la gerencia de ${EMPRESA} en el horario estipulado;` },
    { t: 'i', l: "k)", i: 0, w: 20, x: `Asistir a los cursos de capacitación de manera obligatoria debido a la inversión que realiza ${EMPRESA}` },
    { t: 'i', l: "l)", i: 0, w: 20, x: `Visitar propiedades de ${EMPRESA} o propiedades en que ${EMPRESA} tenga interés.` },
    { t: 'p', x: `Las Actividades de Agencia antes indicadas, tienen carácter enunciativo y no limitativo, por lo que se establece que el asesor deberá realizar todas las actividades que sean necesarias para cumplir con los objetivos establecidos por ${EMPRESA} para los fines del presente Contrato, comprometiéndose a realizar las actividades de intermediación antes descritas, con el más alto nivel de eficiencia y efectividad, en forma tal que logre los fines deseados por ${EMPRESA}` },
    { t: 'p', x: "En consecuencia, aportar y proporcionar todos sus conocimientos sobre el mercado de bienes raíces y contactos que sean necesarios." },
    { t: 'h', n: "TERCERA", x: "DE LAS CAPTACIONES Y CLIENTES" },
    { t: 'p', x: `Al pertenecer a la red EL ASESOR a ${EMPRESA} acuerdan las partes que todo cliente o inmueble captado durante la duración del presente contrato serán de exclusiva y única propiedad de la red a través de su franquicia ${EMPRESA}` },
    { t: 'i', l: "3.1", i: 0, w: 26, x: `Toda captación de inmueble de EL ASESOR deberá tener obligatoriamente un contrato de exclusividad o sin exclusividad, documentación en orden y un avaluó que respalde el precio correcto de mercado del inmueble y aprobado por ${EMPRESA} así mismo el contrato de captación deberá contar con la firma del Representante Legal de ${EMPRESA} como captador y el cliente. Puesto que son normas de ${EMPRESA} EL ASESOR se compromete a publicitar únicamente inmuebles con contratos.` },
    { t: 'i', l: "3.2", i: 0, w: 26, x: `Por lo tanto al término del presente contrato o con la rescisión del mismo; El ASESOR deberá comunicar a todos y cada uno de sus clientes que sus inmuebles serán traspasados a otro asesor de la red ${EMPRESA}` },
    { t: 'i', l: "3.3", i: 0, w: 26, x: `El ASESOR reconoce que el uso de la Marca ${EMPRESA} le permitirá una mayor captación de inmuebles y clientes, que el manejo de la información de la cartera de clientes e inmuebles de ${EMPRESA} le permitirán mantenerse a la vanguardia en el mercado de los Bienes Raíces en su ciudad y en Bolivia.` },
    { t: 'h', n: "CUARTA", x: "DE LOS GASTOS DE COMERCIALIZACIÓN DE LOS INMUEBLES" },
    { t: 'p', x: "EL ASESOR correrá con los gastos de comercialización de los inmuebles que haya captado y los referidos por otros asesores y que hayan sido aceptados por su persona." },
    { t: 'i', l: "4.1.", i: 0, w: 26, x: "Se entiende por gastos de comercialización de los inmuebles de manera enunciativa y no limitativa a los siguientes:" },
    { t: 'i', l: "4.1.1.", i: 26, w: 36, x: `Avalúos y letreros de venta, alquiler u anticrético que se coloca en el inmueble. El mismo deberá llevar obligatoriamente el nombre de EL ASESOR y el nombre de la Inmobiliaria, el diseño debe ser aprobado por Oficina, números de contacto, dirección de página WEB y el logotipo de la Marca ${EMPRESA}` },
    { t: 'i', l: "4.2.2.", i: 26, w: 36, x: "Avisos clasificados. (Prensa escrita)" },
    { t: 'i', l: "4.2.3.", i: 26, w: 36, x: "Publicaciones por medios digitales. (Facebook, Redes Sociales, Portales Inmobiliarios, páginas web especializadas, etc.)" },
    { t: 'i', l: "4.2.4.", i: 26, w: 36, x: "Llamadas telefónicas. (Contactos con clientes e interesados)" },
    { t: 'i', l: "4.2.5.", i: 26, w: 36, x: "Transporte y logística. (Del asesor y clientes)" },
    { t: 'h', n: "QUINTA", x: "CUOTA MENSUAL OPERATIVA Y USO DE MARCA" },
    { t: 'p', x: `El ASESOR se compromete a pagar a ${EMPRESA} la suma mensual establecida por la oficina en la modalidad de mes adelantado hasta el día 5 de cada mes, dicho monto constituye una cuota mensual operativa que será destinada a capacitaciones bonos premios incentivos etc.` },
    { t: 'p', x: `Se deja claramente establecido que cualquier contenido visual, publicación, letrero, arte de redes sociales o diseños deberán ser acompañados obligatoriamente y sin excepción alguna con el nombre del asesor y en este caso “${EMPRESA}”` },
    { t: 'h', n: "SEXTA", x: "DISTRIBUCION DE INGRESOS" },
    { t: 'p', x: `Como fruto del esfuerzo y trabajo en conjunto entre EL ASESOR y ${EMPRESA}` },
    { t: 'p', x: "Se destinará un 10% del total de la comisión cobrada a favor de la inmobiliaria correspondiente al derecho de uso de marca, soporte corporativo y gastos administrativos." },
    { t: 'p', x: "El porcentaje del ASESOR es el 20 % del total de la comisión por la intermediación y asesoría, dicho porcentaje se regula de la siguiente manera: percibirá la totalidad." },
    { t: 's', b: "A) OPERACIÓN DIRECTA:", x: "En caso que el ASESOR realice la operación sin intervención de terceros" },
    { t: 'i', l: "6.1.", i: 0, w: 26, x: "EL ASESOR se comprometen a pagar EL 10% DESTINADO a GASTOS DE ADMINISTRACION por cada operación comercial en el rubro de Bienes Raíces y el uso de marca." },
    { t: 'i', l: "6.2.", i: 0, w: 26, x: `EL ASESOR y ${EMPRESA} acuerdan que cada parte emitirá la factura correspondiente al CLIENTE por el valor de los ingresos percibidos. En el caso de EL ASESOR dicho valor no contemplará el 10% pagado a CASA LEGAL FIRMA por parte del cliente & INMOBILIARIA S.R.L. puesto que dicho pago es operatizado por ${EMPRESA} por tanto pagara el 20% recibido en la comisión.` },
    { t: 'p', x: "La distribución de los porcentajes señalados se ejecutará de manera inmediata tras la recepción efectiva y total del pago de los honorarios por parte del cliente o comprador." },
    { t: 'h', n: "SEPTIMA", x: "CONFIDENCIALIDAD" },
    { t: 'p', x: "Respecto a la confidencialidad, las Partes establecen lo detallado a continuación:" },
    { t: 'i', l: "7.1", i: 0, w: 26, x: `El ASESOR se obliga a utilizar toda la información oral y escrita recibida por ${EMPRESA} únicamente a efectos del cumplimiento de este Contrato y a tratar dicha información como confidencial y no transmitirla a terceros sin el previo por escrito de ${EMPRESA}` },
    { t: 'i', l: "7.2", i: 0, w: 26, x: `El Asesor limitará el acceso a la información oral y escrita recibida por a ${EMPRESA} aquellos empleados y funcionarios que por sus tareas deban tener conocimiento de ella y/o que cumplan actividades relacionadas con las operaciones objeto de este contrato.` },
    { t: 'i', l: "7.3", i: 0, w: 26, x: `El Asesor será responsable frente a ${EMPRESA} por el mantenimiento de la confidencialidad de sus empleados y funcionarios, debiendo resarcir a ${EMPRESA} los eventuales perjuicios del caso.` },
    { t: 'i', l: "7.4", i: 0, w: 26, x: "La obligación de confidencialidad resultante de la presente cláusula no se aplica en los siguientes casos:" },
    { t: 'i', l: "a)", i: 26, w: 20, x: "Respecto a aquella información que al momento de ser develada ya fuera de dominio público por hechos o actos no imputables al Asesor." },
    { t: 'i', l: "b)", i: 26, w: 20, x: "Respecto de aquella información que el Asesor pudiera probar en forma fehaciente que era legítimamente de su conocimiento al momento de recibirla." },
    { t: 'i', l: "c)", i: 26, w: 20, x: "Respecto de aquella información que el Asesor pudiera probar en forma fehaciente que ha sido recibida en forma legítima de un tercero." },
    { t: 'i', l: "7.5", i: 0, w: 26, x: "La obligación de confidencialidad resultante de esta cláusula regirá también de manera indefinida hasta después de la expiración del presente Contrato." },
    { t: 'i', l: "7.6", i: 0, w: 26, x: `A la terminación o vencimiento del presente Contrato, el Asesor inmediatamente devolverá a ${EMPRESA} todos los documentos y copias recibidos de acuerdo con el presente Contrato.` },
    { t: 'h', n: "OCTAVA", x: "TERMINACIÓN DE CONTRATO" },
    { t: 'p', x: "Las Partes acuerdan que el presente Contrato será terminado en caso de darse cualquiera de las causales estipuladas por el Art. 1255 del Código de Comercio." },
    { t: 'i', l: "8.1", i: 0, w: 26, x: "Asimismo, se establece que cualquiera de las Partes podrá finalizar el presente Contrato sin necesidad de darse ninguna de las causales mencionadas en el párrafo anterior, enviando el debido preaviso por escrito a la otra Parte, con una anticipación de (30) días a la fecha efectiva de terminación del Contrato con el fin de formalizar un documento privado de resolución de contrato de agencia." },
    { t: 'i', l: "8.2", i: 0, w: 26, x: `La rescisión de contrato no eximirá de cualquier deuda pendiente de EL ASESOR con la oficina de ${EMPRESA} así como no disolverá la distribución de ingresos fruto de cualquier cuenta por cobrar de alguna operación en el rubro de bienes raíces anterior a la fecha de la presentación de la carta y notificación vía correo. Dichas operaciones deberán ser documentadas de forma escrita. El asesor inmobiliario tendrá un plazo de cinco días hábiles después de la recisión de contrato para dar de baja su fan page, retirar letreros, publicaciones de redes sociales y toda publicidad que lo relacione con ${EMPRESA} caso contrario se iniciaran las acciones legales pertinentes para hacer cumplir el cese de uso de marca y pago de las deudas pendientes, además el asesor autoriza a ${EMPRESA} a publicar que el mismo dejo de trabajar en la red con el fin evitar confusiones con los clientes, así mismo el asesor bajo ningún concepto podrá copiar el sistema de trabajo de ${EMPRESA} el uso de letreros, colores, marca, redes sociales, sistema de trabajo y otros propios de la red que pusieran interpretarse por su uso inadecuado y no autorizado como competencia desleal para el desvió de clientela penado por nuestro código penal boliviano.` },
    { t: 'h', n: "NOVENA", x: "RELACIÓN CONTRACTUAL" },
    { t: 'p', x: `Se deja claramente establecido que entre ${EMPRESA} y el ASESOR no existe ningún tipo de relación obrero patronal. Por lo tanto, al término del presente contrato o su rescisión no quedara ningún tipo de obligación adicional entre las partes.` },
    { t: 'h', n: "DECIMA", x: "DE LA VIGENCIA" },
    { t: 'p', x: "El presente contrato tendrá una duración de 1 (UN) año calendario desde la fecha de la celebración y será renovado automáticamente si las partes no desistieran y comunicaran a la contraparte con 7 (SIETE) días de anticipación." },
    { t: 'h', n: "UNDÉCIMA", x: "CONCILIACIÓN Y ARBITRAJE" },
    { t: 'p', x: "Todas las controversias o diferencias con relación a la interpretación, aplicación, cumplimiento y ejecución del presente contrato, se resolverán en el Centro de Conciliación y Arbitraje Comercial de la Cámara de Industria, Comercio, conforme a los siguientes medios:" },
    { t: 'p', x: `Como primer medio de solución se establece la Conciliación, la cual se regirá de acuerdo al Reglamento Interno de la institución ${EMPRESA} del, vigente al momento de la presentación de la conciliación.` },
    { t: 'p', x: "Si la controversia no ha sido resuelta a través de la conciliación o persistiera parte de ella, como segundo medio se aplicará el arbitraje institucional a efectuarse en el Centro de Conciliación y Arbitraje Comercial de la CAMARA DE COMERCIO de la ciudad de LA PAZ, al que se encomienda la administración del arbitraje conforme al Reglamento vigente a la fecha en que se presente la solicitud de arbitraje." },
    { t: 'p', x: "El presente acuerdo implica la renuncia expresa a iniciar cualquier proceso judicial." },
    { t: 'h', n: "DECIMA SEGUNDA", x: "PACTO DE NO COMPETENCIA" },
    { t: 'p', x: `En virtud de lo establecido por el Art. 1249 del Código de Comercio, el ASESOR está prohibido de promover o explotar durante un año dentro del Área Prefijada, línea de negocios de otras empresas y/o empresarios competidores en el rubro de los bienes raíces, bajo pena de resarcir a ${EMPRESA} los daños ocasionados pagando una multa de US$ 5000. Sin embargo, se aclara que el Asesor tiene toda la libertad para dedicarse a cualquier otra actividad comercial que no se encuentre relacionada con el rubro y las líneas de negocios.` },
    { t: 'h', n: "DÉCIMA TERCERA", x: "DEBERES DEL ASESOR" },
    { t: 'p', x: "Además de cumplir con las obligaciones establecidas en las otras cláusulas de este Contrato, el Asesor está obligado al cumplimiento de los deberes detallados a continuación, de conformidad con lo establecido por el Art. 1254 del Código de Comercio:" },
    { t: 'i', l: "a)", i: 0, w: 20, x: `Cumplir con el encargo encomendado por ${EMPRESA} conforme a las instrucciones recibidas de parte de éste;` },
    { t: 'i', l: "b)", i: 0, w: 20, x: `Hacer conocer a ${EMPRESA} las informaciones acerca de las condiciones del mercado en el Área Prefijada y las que sean útiles para que aquel pueda apreciar la conveniencia del negocio;` },
    { t: 'i', l: "c)", i: 0, w: 20, x: `Cobrar los créditos de ${EMPRESA} solamente cuando estuviera autorizado expresamente por el Bróker de manera escrita para ello; caso contrario no podrá hacerlo bajo ninguna circunstancia; y,` },
    { t: 'i', l: "d)", i: 0, w: 20, x: "Rendir cuentas e informes de todos los negocios encomendados, dentro de las fechas previstas y de los plazos previstos." },
    { t: 'i', l: "e)", i: 0, w: 20, x: `El Asesor deberá asistir de manera obligatoria a la Convención ${EMPRESA} que se realiza anualmente, la cual será asumida por cuenta y cargo del Asesor según el monto que establezca ${EMPRESA}` },
    { t: 'i', l: "f)", i: 0, w: 20, x: `Deberá cumplir con todos los procedimientos internos sin excepción alguna establecidos por la ${EMPRESA} que le serán comunicados al asesor mediante capacitación. Habría que mencionar que, cada cierto tiempo se actualizan los procedimientos de acuerdo a los establecido por ${EMPRESA}` },
    { t: 'h', n: "DÉCIMA CUARTA", x: "PROHIBICIONES DEL ASESOR" },
    { t: 'p', x: "Además de la prohibición establecida en las Cláusulas precedentes, queda expresamente señalado que el ASESOR estará sujeto a las siguientes prohibiciones:" },
    { t: 'i', l: "a)", i: 0, w: 20, x: `Suscribir a nombre de la Inmobiliaria ${EMPRESA} contratos o pactos de cualquier clase o naturaleza.` },
    { t: 'i', l: "b)", i: 0, w: 20, x: `Modificar marcas, precios fijados y procedimientos establecidos por ${EMPRESA} conceder créditos, descuentos, rebajas o prórrogas de plazo, sin autorización previa de ${EMPRESA}` },
    { t: 'i', l: "c)", i: 0, w: 20, x: `Entablar o participar en polémicas por cualquier medio publicitario, con cualquier oficina, agencia y/o compañía del ramo de bienes raíces, que me comprometan la reputación y la confianza de los clientes de ${EMPRESA}` },
    { t: 'i', l: "d)", i: 0, w: 20, x: `Ejecutar actos o emitir declaraciones que originen reclamos o litigios contra ${EMPRESA}` },
    { t: 'i', l: "e)", i: 0, w: 20, x: `Traspasar o ceder sin el consentimiento previo y por escrito de ${EMPRESA} cualquier derecho que en virtud del presente Contrato le corresponda;` },
    { t: 'i', l: "f)", i: 0, w: 20, x: "Denigrar en cualquier forma a otras oficinas franquiciadas y/o compañías del ramo de bienes raíces;" },
    { t: 'i', l: "g)", i: 0, w: 20, x: "Ceder sus comisiones o remuneración a terceros, total o parcialmente, directa o indirectamente;" },
    { t: 'i', l: "h)", i: 0, w: 20, x: `Propiciar o facilitar el traslado de personal de ${EMPRESA} o el traslado de órdenes e información de ${EMPRESA} a otras compañías competidoras;` },
    { t: 'i', l: "i)", i: 0, w: 20, x: `Extender recibos en formularios ajenos a los de ${EMPRESA}` },
    { t: 'i', l: "j)", i: 0, w: 20, x: `Divulgar cualquier secreto o información reservada de ${EMPRESA} que conozca a los que tenga conocimiento como consecuencia del presente Contrato que pueda perjudicar a ${EMPRESA} o a sus clientes.` },
    { t: 'p', x: "En caso de que la oficina reciba llamadas de atención o multas económicas por causa de alguna falta mencionada, el ASESOR será responsable de cancelar directamente la multa." },
    { t: 'h', n: "DÉCIMA QUINTA", x: "DIVISIBILIDAD" },
    { t: 'p', x: "Si por cualquier motivo legal, se considera que alguna disposición del presente contrato es inválida, nula o inaplicable por algún motivo, en forma total o parcial, se interpretará dicha disposición de un modo más acotado de modo tal que pase a ser legal y aplicable, y la totalidad del contrato no perderá valor debido a ello, y el resto del contrato seguirá teniendo pleno vigor y efecto, en el máximo grado permitido por la Ley, pero siempre preservando, en el máximo grado posible, su intención original." },
    { t: 'h', n: "DÉCIMA SEXTA", x: "CONTRATO COMPLETO" },
    { t: 'p', x: "Este Contrato constituye el único convenio entre las Partes en relación al objeto del mismo. Las Partes declaran que no existen acuerdos orales o implícitos de ningún tipo, ni se han otorgado garantías orales o implícitas fuera de las aquí establecidas. Cualquier modificación a este Contrato deberá realizarse por escrito y será firmada por representantes debidamente autorizados de ambas Partes." },
    { t: 'h', n: "DECIMA SEPTIMA", x: "DE LA ACEPTACIÓN Y CONFORMIDAD" },
    { t: 'p', x: "Las partes, de común acuerdo manifiestan su aceptación y conformidad con todas y cada una de las cláusulas del presente Contrato, reconocimiento que es único e indivisible, en todas sus partes.", k: true },
  ]);

  let todos = $derived.by(() => [{ t: 'titulo' }, ...bloques, { t: 'cierre' }]);

  // ---------- Paginación en hojas oficio ----------
  let paginas = $state([{ items: [], medir: true }]);
  let secs = $state([]);
  let contenedor;
  let montado = false;
  let ocupado = false;
  let pendiente = false;
  let escala = 1;

  const CM = { alto: 33.0, banda1: 4.4, banda2: 1.55, gap1: 0.9, gap2: 0.7, pie: 2.5 };
  const LINEA = (14.4 * 96) / 72; // interlineado en px

  const alto = (el) => {
    const cs = getComputedStyle(el);
    return el.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
  };
  const divisible = (b) => (b.t === 'p' && !b.k) || b.t === 'i';
  const siguiente = (b) => b.t === 'h' || b.k;

  async function repaginar() {
    if (ocupado) {
      pendiente = true;
      return;
    }
    ocupado = true;
    paginas = [{ items: todos, medir: true }];
    await tick();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;

    const zoomPrev = contenedor.style.zoom;
    contenedor.style.zoom = '1';

    const sonda = document.createElement('div');
    sonda.style.cssText = 'position:absolute;visibility:hidden;height:10cm;width:1px';
    document.body.appendChild(sonda);
    const pxCm = sonda.offsetHeight / 10;
    sonda.remove();
    const H1 = (CM.alto - CM.banda1 - CM.gap1 - CM.pie) * pxCm - 2;
    const HN = (CM.alto - CM.banda2 - CM.gap2 - CM.pie) * pxCm - 2;

    const cuerpo = secs[0].querySelector('.cuerpo');
    const els = Array.from(cuerpo.children);

    const medirTexto = (el, b, texto, sup) => {
      const c = el.cloneNode(true);
      const tgt = b.t === 'i' ? c.querySelector('.it-x') : c;
      tgt.textContent = texto;
      if (sup) c.classList.add('sup');
      cuerpo.appendChild(c);
      const h = alto(c);
      const lineas = Math.round(c.getBoundingClientRect().height / LINEA);
      c.remove();
      return { h, lineas };
    };

    const cola = todos.map((b, i) => ({ b, el: els[i], h: alto(els[i]) }));
    const minimo = (i) => {
      const c = cola[i];
      if (!c) return 0;
      if (divisible(c.b)) return Math.min(c.h, 2 * LINEA);
      return c.h + (siguiente(c.b) ? minimo(i + 1) : 0);
    };

    const out = [[]];
    let rem = H1;
    const nueva = () => {
      out.push([]);
      rem = HN;
    };

    let guarda = 0;
    while (cola.length && guarda++ < 2000) {
      const c = cola[0];
      const necesita = c.h + (siguiente(c.b) ? minimo(1) : 0);
      const actual = out[out.length - 1];

      if (necesita <= rem) {
        actual.push(c.b);
        rem -= c.h;
        cola.shift();
        continue;
      }

      if (divisible(c.b)) {
        const palabras = c.b.x.split(' ');
        let lo = 1,
          hi = palabras.length - 1,
          mejor = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          const r = medirTexto(c.el, c.b, palabras.slice(0, mid).join(' '), true);
          if (r.h <= rem) {
            mejor = mid;
            lo = mid + 1;
          } else hi = mid - 1;
        }
        let pre = null,
          resto = null,
          preTxt = '',
          restoTxt = '';
        while (mejor > 0) {
          preTxt = palabras.slice(0, mejor).join(' ');
          restoTxt = palabras.slice(mejor).join(' ');
          pre = medirTexto(c.el, c.b, preTxt, true);
          resto = medirTexto(c.el, c.b, restoTxt, false);
          if (pre.lineas >= 2 && resto.lineas >= 2) break;
          if (pre.lineas < 2) {
            mejor = 0;
            break;
          }
          mejor--;
        }
        if (mejor > 0) {
          actual.push({ ...c.b, x: preTxt, sup: true });
          cola[0] = { b: { ...c.b, x: restoTxt, cont: true }, el: c.el, h: resto.h };
          nueva();
          continue;
        }
      }

      if (actual.length === 0) {
        actual.push(c.b);
        rem -= c.h;
        cola.shift();
      } else {
        nueva();
      }
    }

    contenedor.style.zoom = zoomPrev;
    paginas = out.map((items) => ({ items }));
    ocupado = false;
    if (pendiente) {
      pendiente = false;
      repaginar();
    }
  }

  const ajustarEscala = () => {
    const ancho = (216 * 96) / 25.4;
    escala = Math.min(1, (window.innerWidth - 24) / ancho);
  };

  onMount(() => {
    montado = true;
    ajustarEscala();
    window.addEventListener('resize', ajustarEscala);
    return () => window.removeEventListener('resize', ajustarEscala);
  });

  $effect(() => {
    if (montado && todos) {
      repaginar();
    }
  });
</script>

<svelte:head>
  {@html `<style>@page { size: legal; margin: 0; }</style>`}
</svelte:head>

<div class="doc">
  <button class="imprimir" type="button" on:click={() => window.print()}>Imprimir / Guardar PDF</button>

  <div class="paginas" bind:this={contenedor} style="zoom:{escala}">
    {#each paginas as pg, i}
      <section class="pagina" class:primera={i === 0} class:medir={pg.medir} bind:this={secs[i]}>
        <img class="marca-agua" src={logo} alt="" />

        {#if i === 0}
          <header class="banda">
            <img class="b-logo" src={logo} alt="Casa Legal Inmobiliaria" />
            <span class="b-sep"></span>
            <div class="b-txt">
              <div class="b-nombre">CASA LEGAL</div>
              <div class="b-sub">FIRMA LEGAL &amp; INMOBILIARIA S.R.L.</div>
              <div class="b-filete"></div>
              <div class="b-dir">Av. Satélite N° 2020 · Edificio Torre CAUSAE 6.° Piso · El Alto</div>
              <div class="b-dir b-nit">NIT 708808027</div>
            </div>
          </header>
        {:else}
          <header class="run-head">
            <img src={logo} alt="" />
            <span class="rh-marca">CASA LEGAL</span>
            <span class="rh-titulo">CONTRATO PRIVADO DE PRESTACIÓN DE SERVICIOS</span>
          </header>
        {/if}

        <div class="cuerpo">
          {#each pg.items as b}
            {#if b.t === 'titulo'}
              <div class="titulo">
                <div class="kicker">CONTRATO DE AGENCIA INMOBILIARIA</div>
                <h1>CONTRATO PRIVADO DE<br />PRESTACIÓN DE SERVICIOS</h1>
                <div class="orn" aria-hidden="true">
                  <i class="ln"></i><i class="d s"></i><i class="d"></i><i class="d s"></i><i class="ln"></i>
                </div>
              </div>
            {:else if b.t === 'h'}
              <h2 class="cl">
                <span class="cl-d"></span>
                <span class="cl-n">{b.n}</span>
                <span class="cl-sep"></span>
                <span class="cl-nm">{b.x}</span>
                <span class="cl-ln"></span>
              </h2>
            {:else if b.t === 'p'}
              <p class:sup={b.sup}>{b.x}</p>
            {:else if b.t === 's'}
              <p class="sub"><strong>{b.b}</strong> {b.x}</p>
            {:else if b.t === 'i'}
              <div class="item" class:sup={b.sup} style="margin-left:{b.i}pt">
                <span class="it-l" style="width:{b.w}pt">{b.cont ? '' : b.l}</span>
                <span class="it-x">{b.x}</span>
              </div>
            {:else if b.t === 'cierre'}
              <div class="cierre">
                <div class="orn" aria-hidden="true">
                  <i class="ln"></i><i class="d s"></i><i class="d"></i><i class="d s"></i><i class="ln"></i>
                </div>
                <p class="fecha">{fecha}</p>
                <div class="firmas">
                  <div class="firma">
                    <div class="linea"></div>
                    <div class="f-nombre">{representante.nombre}</div>
                    <div class="f-ci">C.I. {representante.ci}</div>
                    <div class="f-rol">GERENTE CASA LEGAL<br />FIRMA LEGAL &amp; INMOBILIARIA S.R.L.</div>
                  </div>
                  <div class="firma">
                    <div class="linea"></div>
                    <div class="f-nombre">{asesor.nombre}</div>
                    <div class="f-ci">C.I. {asesor.ci}</div>
                    <div class="f-rol">ASESOR INMOBILIARIO</div>
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>

        <footer class="pie">
          <span class="pie-n">CASA LEGAL FIRMA LEGAL &amp; INMOBILIARIA S.R.L.</span>
          <span class="pie-p">PÁGINA {i + 1} DE {paginas.length}</span>
        </footer>
      </section>
    {/each}
  </div>
</div>

<style>
  .doc {
    --verde: #0a2a1e;
    --verde-2: #103a29;
    --oro: #c9a24d;
    --oro-l: #e3c77e;
    --oro-t: #8f7127;
    --oro-linea: #d9c28a;
    --tinta: #1b1b1b;
    --serif: 'Times New Roman', 'Liberation Serif', Tinos, Georgia, serif;
    --sans: Poppins, 'Segoe UI', system-ui, -apple-system, sans-serif;

    background: #e6e3da;
    padding: 28px 12px 40px;
    font-family: var(--serif);
    color: var(--tinta);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .imprimir {
    position: fixed;
    top: 14px;
    right: 16px;
    z-index: 20;
    background: var(--verde);
    color: var(--oro-l);
    border: 1px solid var(--oro);
    padding: 9px 16px;
    font: 500 11px var(--sans);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .imprimir:hover {
    background: var(--verde-2);
  }

  /* ---------- Hoja oficio ---------- */
  .pagina {
    position: relative;
    width: 216mm;
    height: 330mm;
    margin: 0 auto 22px;
    background: #fff;
    box-shadow: 0 6px 30px rgba(10, 42, 30, 0.22);
    box-sizing: border-box;
    overflow: hidden;
  }
  .pagina.medir {
    position: absolute;
    left: 0;
    top: 0;
    height: auto;
    overflow: visible;
    visibility: hidden;
    pointer-events: none;
  }

  .marca-agua {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 14cm;
    transform: translate(-50%, -48%);
    opacity: 0.13;
    pointer-events: none;
  }

  .cuerpo {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0 2.3cm;
    margin-top: 0.7cm;
    box-sizing: border-box;
  }
  .primera .cuerpo {
    margin-top: 0.9cm;
  }

  /* ---------- Banda de portada ---------- */
  .banda {
    position: relative;
    height: 4.4cm;
    background: var(--verde);
    border-bottom: 1.6pt solid var(--oro);
    display: flex;
    align-items: center;
    padding: 0 2.1cm;
    box-sizing: border-box;
    gap: 0.35cm;
  }
  .banda::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 0.35cm;
    background: var(--verde-2);
  }
  .banda::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -5pt;
    border-top: 0.5pt solid var(--oro);
  }
  .b-logo {
    height: 3.35cm;
    width: 3.35cm;
    object-fit: contain;
    position: relative;
    z-index: 1;
  }
  .b-sep {
    width: 0.6pt;
    align-self: stretch;
    margin: 1.05cm 0.2cm 1.05cm 0;
    background: var(--oro);
    position: relative;
    z-index: 1;
  }
  .b-txt {
    position: relative;
    z-index: 1;
  }
  .b-nombre {
    font-weight: 700;
    font-size: 27pt;
    line-height: 1;
    letter-spacing: 0.09em;
    color: var(--oro-l);
  }
  .b-sub {
    font: 500 7.6pt var(--sans);
    letter-spacing: 0.25em;
    color: #f2ebd6;
    margin-top: 9pt;
  }
  .b-filete {
    width: 3.2cm;
    border-top: 0.4pt solid var(--oro);
    margin: 8pt 0 7pt;
  }
  .b-dir {
    font: 400 6.4pt var(--sans);
    letter-spacing: 0.03em;
    color: #c9d3cc;
    line-height: 1.6;
  }
  .b-nit {
    letter-spacing: 0.12em;
  }

  /* ---------- Encabezado corrido ---------- */
  .run-head {
    position: relative;
    height: 1.55cm;
    background: var(--verde);
    border-bottom: 1.2pt solid var(--oro);
    display: flex;
    align-items: center;
    padding: 0 2.3cm;
    box-sizing: border-box;
  }
  .run-head::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -4.5pt;
    border-top: 0.4pt solid var(--oro);
  }
  .run-head img {
    height: 1.15cm;
    width: 1.15cm;
    object-fit: contain;
    margin-left: -0.1cm;
  }
  .rh-marca {
    margin-left: 0.35cm;
    font-weight: 700;
    font-size: 11.5pt;
    letter-spacing: 0.16em;
    color: var(--oro-l);
  }
  .rh-titulo {
    margin-left: auto;
    font: 500 6.2pt var(--sans);
    letter-spacing: 0.21em;
    color: #f2ebd6;
  }

  /* ---------- Título ---------- */
  .titulo {
    padding-top: 4pt;
  }
  .kicker {
    text-align: center;
    font: 500 6.8pt var(--sans);
    letter-spacing: 0.35em;
    color: var(--oro-t);
    margin-bottom: 5pt;
  }
  h1 {
    margin: 0;
    text-align: center;
    font-weight: 700;
    font-size: 19.5pt;
    line-height: 25pt;
    color: var(--verde);
  }
  .orn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5pt;
    margin: 8pt 0 10pt;
  }
  .orn .ln {
    display: block;
    width: 83pt;
    height: 0.7pt;
    background: var(--oro);
  }
  .orn .d {
    display: block;
    width: 6pt;
    height: 6pt;
    background: var(--oro);
    transform: rotate(45deg);
    margin: 0 3pt;
  }
  .orn .d.s {
    width: 3pt;
    height: 3pt;
    margin: 0 1pt;
  }

  /* ---------- Cuerpo ---------- */
  p,
  .item {
    font-size: 10.2pt;
    line-height: 14.4pt;
    text-align: justify;
  }
  p {
    margin: 0 0 5.5pt;
  }
  .sub {
    color: var(--verde);
    margin-top: 3pt;
  }
  .item {
    display: flex;
    margin-bottom: 4.5pt;
  }
  .it-l {
    flex: none;
    font-weight: 700;
    color: var(--oro-t);
  }
  .it-x {
    flex: 1;
    min-width: 0;
    text-align: justify;
  }
  /* primer tramo de un párrafo partido entre hojas */
  .sup {
    margin-bottom: 0;
    text-align-last: justify;
  }
  .sup .it-x {
    text-align-last: justify;
  }

  .cl {
    display: flex;
    align-items: center;
    gap: 7pt;
    margin: 13pt 0 5pt;
    font-size: 10.2pt;
    font-weight: 700;
    line-height: 17pt;
    white-space: nowrap;
  }
  .cl-d {
    width: 5pt;
    height: 5pt;
    background: var(--oro);
    transform: rotate(45deg);
    margin: 0 3pt 0 1pt;
    flex: none;
  }
  .cl-n {
    color: var(--oro-t);
    letter-spacing: 0.16em;
  }
  .cl-sep {
    width: 0.6pt;
    height: 11pt;
    background: var(--oro);
    flex: none;
  }
  .cl-nm {
    color: var(--verde);
    letter-spacing: 0.09em;
  }
  .cl-ln {
    flex: 1;
    height: 0.5pt;
    background: var(--oro-linea);
    margin-left: 2pt;
  }

  /* ---------- Cierre y firmas ---------- */
  .cierre {
    margin-top: 10pt;
  }
  .fecha {
    text-align: center;
    font-style: italic;
    margin: 6pt 0;
  }
  .firmas {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-top: 64pt;
  }
  .firma {
    text-align: center;
  }
  .linea {
    position: relative;
    width: 164pt;
    margin: 0 auto 8pt;
    border-top: 0.8pt solid var(--verde);
  }
  .linea::after {
    content: '';
    position: absolute;
    left: 50%;
    top: -2.6pt;
    width: 4pt;
    height: 4pt;
    background: var(--oro);
    transform: translateX(-50%) rotate(45deg);
  }
  .f-nombre {
    font-weight: 700;
    font-size: 10.5pt;
    line-height: 14pt;
  }
  .f-ci {
    font-size: 9.5pt;
    letter-spacing: 0.03em;
    line-height: 14pt;
  }
  .f-rol {
    font: 500 6.2pt var(--sans);
    letter-spacing: 0.18em;
    color: var(--oro-t);
    line-height: 10pt;
    margin-top: 4pt;
  }

  /* ---------- Pie ---------- */
  .pie {
    position: absolute;
    left: 2.3cm;
    right: 2.3cm;
    bottom: 1.1cm;
    border-top: 0.6pt solid var(--oro);
    padding-top: 7pt;
    display: flex;
    justify-content: space-between;
    font: 500 6.2pt var(--sans);
  }
  .pie::before {
    content: '';
    position: absolute;
    left: 50%;
    top: -2.4pt;
    width: 4pt;
    height: 4pt;
    background: var(--oro);
    transform: translateX(-50%) rotate(45deg);
  }
  .pie-n {
    letter-spacing: 0.16em;
    color: var(--verde);
  }
  .pie-p {
    letter-spacing: 0.18em;
    color: var(--oro-t);
  }

  /* ---------- Impresión ---------- */
  @media print {
    .imprimir {
      display: none;
    }
    .doc {
      background: none;
      padding: 0;
    }
    .paginas {
      zoom: 1 !important;
    }
    .pagina {
      margin: 0;
      box-shadow: none;
      height: 296.6mm;
      break-after: page;
      page-break-after: always;
    }
    .pagina:last-child {
      break-after: auto;
      page-break-after: auto;
    }
  }
</style>
