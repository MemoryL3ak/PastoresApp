/**
 * geography.js
 * Países → Regiones → Comunas
 * Foco principal: Chile (completo). Otros países con regiones/provincias.
 */

export const COUNTRIES = [
  { code: "CL", name: "Chile" },
  { code: "AR", name: "Argentina" },
  { code: "AO", name: "Angola" },
  { code: "AU", name: "Australia" },
  { code: "BO", name: "Bolivia" },
  { code: "BR", name: "Brasil" },
  { code: "CO", name: "Colombia" },
  { code: "CR", name: "Costa Rica" },
  { code: "CU", name: "Cuba" },
  { code: "DO", name: "República Dominicana" },
  { code: "EC", name: "Ecuador" },
  { code: "SV", name: "El Salvador" },
  { code: "ES", name: "España" },
  { code: "US", name: "Estados Unidos" },
  { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" },
  { code: "MX", name: "México" },
  { code: "NI", name: "Nicaragua" },
  { code: "PA", name: "Panamá" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Perú" },
  { code: "PR", name: "Puerto Rico" },
  { code: "SE", name: "Suecia" },
  { code: "UY", name: "Uruguay" },
  { code: "VE", name: "Venezuela" },
  { code: "OTHER", name: "Otro" },
];

/**
 * Countries of the IEP presbyter banner — used in pastor/church country selectors.
 * Matches PRESBYTER_COUNTRIES in credentialShared.js (alphabetical by name).
 */
export const IEP_COUNTRIES = [
  { code: "AO", name: "Angola" },
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "BO", name: "Bolivia" },
  { code: "BR", name: "Brasil" },
  { code: "CL", name: "Chile" },
  { code: "CR", name: "Costa Rica" },
  { code: "EC", name: "Ecuador" },
  { code: "SV", name: "El Salvador" },
  { code: "ES", name: "España" },
  { code: "US", name: "Estados Unidos" },
  { code: "MX", name: "México" },
  { code: "PA", name: "Panamá" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Perú" },
  { code: "SE", name: "Suecia" },
  { code: "UY", name: "Uruguay" },
  { code: "VE", name: "Venezuela" },
];

/** Nombre del documento de identidad por país + placeholder de ejemplo */
export const DOCUMENT_INFO = {
  CL: { label: "RUT",       placeholder: "12.345.678-9"       },
  AR: { label: "DNI",       placeholder: "12.345.678"          },
  BO: { label: "CI",        placeholder: "1234567"             },
  BR: { label: "CPF",       placeholder: "123.456.789-09"      },
  CO: { label: "Cédula",    placeholder: "1.234.567.890"       },
  CR: { label: "Cédula",    placeholder: "1-2345-6789"         },
  CU: { label: "Carné",     placeholder: "12345678901"         },
  DO: { label: "Cédula",    placeholder: "001-1234567-8"       },
  EC: { label: "Cédula",    placeholder: "1234567890"          },
  SV: { label: "DUI",       placeholder: "12345678-9"          },
  GT: { label: "DPI",       placeholder: "1234 56789 0101"     },
  HN: { label: "DNI",       placeholder: "1234-1234-12345"     },
  MX: { label: "CURP",      placeholder: "XXXX000000XXXXXX00"  },
  NI: { label: "Cédula",    placeholder: "001-123456-7890X"    },
  PA: { label: "Cédula",    placeholder: "8-123-456"           },
  PY: { label: "Cédula",    placeholder: "1.234.567"           },
  PE: { label: "DNI",       placeholder: "12345678"            },
  PR: { label: "SSN",       placeholder: "123-45-6789"         },
  UY: { label: "CI",        placeholder: "1.234.567-8"         },
  VE: { label: "Cédula",    placeholder: "V-12.345.678"        },
  US: { label: "ID",        placeholder: ""                    },
  ES: { label: "DNI",       placeholder: "12345678A"           },
};

export function getDocumentInfo(countryCode) {
  return DOCUMENT_INFO[countryCode] ?? { label: "N° Documento", placeholder: "" };
}

// Regiones por país
export const REGIONS = {
  CL: [
    "Arica y Parinacota",
    "Tarapacá",
    "Antofagasta",
    "Atacama",
    "Coquimbo",
    "Valparaíso",
    "Metropolitana de Santiago",
    "O'Higgins",
    "Maule",
    "Ñuble",
    "Biobío",
    "La Araucanía",
    "Los Ríos",
    "Los Lagos",
    "Aysén",
    "Magallanes",
  ],
  AR: [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba",
    "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa",
    "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
    "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
    "Santiago del Estero", "Tierra del Fuego", "Tucumán",
  ],
  BO: [
    "Beni", "Chuquisaca", "Cochabamba", "La Paz", "Oruro",
    "Pando", "Potosí", "Santa Cruz", "Tarija",
  ],
  BR: [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará",
    "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão",
    "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará",
    "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro",
    "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", "Roraima",
    "Santa Catarina", "São Paulo", "Sergipe", "Tocantins",
  ],
  CO: [
    "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.",
    "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare",
    "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca",
    "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena",
    "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío",
    "Risaralda", "San Andrés y Providencia", "Santander", "Sucre",
    "Tolima", "Valle del Cauca", "Vaupés", "Vichada",
  ],
  CR: [
    "Alajuela", "Cartago", "Guanacaste", "Heredia",
    "Limón", "Puntarenas", "San José",
  ],
  CU: [
    "Artemisa", "Camagüey", "Ciego de Ávila", "Cienfuegos",
    "Granma", "Guantánamo", "Holguín", "La Habana",
    "Las Tunas", "Matanzas", "Mayabeque", "Pinar del Río",
    "Sancti Spíritus", "Santiago de Cuba", "Villa Clara",
  ],
  DO: [
    "Azua", "Bahoruco", "Barahona", "Dajabón", "Duarte",
    "El Seibo", "Elías Piña", "Espaillat", "Hato Mayor",
    "Hermanas Mirabal", "Independencia", "La Altagracia",
    "La Romana", "La Vega", "María Trinidad Sánchez",
    "Monseñor Nouel", "Monte Cristi", "Monte Plata",
    "Pedernales", "Peravia", "Puerto Plata", "Samaná",
    "San Cristóbal", "San José de Ocoa", "San Juan",
    "San Pedro de Macorís", "Sánchez Ramírez", "Santiago",
    "Santiago Rodríguez", "Santo Domingo", "Valverde",
  ],
  EC: [
    "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo",
    "Cotopaxi", "El Oro", "Esmeraldas", "Galápagos", "Guayas",
    "Imbabura", "Loja", "Los Ríos", "Manabí", "Morona Santiago",
    "Napo", "Orellana", "Pastaza", "Pichincha", "Santa Elena",
    "Santo Domingo de los Tsáchilas", "Sucumbíos", "Tungurahua",
    "Zamora Chinchipe",
  ],
  SV: [
    "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán",
    "La Libertad", "La Paz", "La Unión", "Morazán",
    "San Miguel", "San Salvador", "San Vicente", "Santa Ana",
    "Sonsonate", "Usulután",
  ],
  GT: [
    "Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula",
    "El Progreso", "Escuintla", "Guatemala", "Huehuetenango",
    "Izabal", "Jalapa", "Jutiapa", "Petén", "Quetzaltenango",
    "Quiché", "Retalhuleu", "Sacatepéquez", "San Marcos",
    "Santa Rosa", "Sololá", "Suchitepéquez", "Totonicapán", "Zacapa",
  ],
  HN: [
    "Atlántida", "Choluteca", "Colón", "Comayagua", "Copán",
    "Cortés", "El Paraíso", "Francisco Morazán", "Gracias a Dios",
    "Intibucá", "Islas de la Bahía", "La Paz", "Lempira",
    "Ocotepeque", "Olancho", "Santa Bárbara", "Valle", "Yoro",
  ],
  MX: [
    "Aguascalientes", "Baja California", "Baja California Sur",
    "Campeche", "Chiapas", "Chihuahua", "Ciudad de México",
    "Coahuila", "Colima", "Durango", "Estado de México",
    "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán",
    "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
    "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
    "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz",
    "Yucatán", "Zacatecas",
  ],
  NI: [
    "Boaco", "Carazo", "Chinandega", "Chontales", "Estelí",
    "Granada", "Jinotega", "León", "Madriz", "Managua",
    "Masaya", "Matagalpa", "Nueva Segovia", "Río San Juan",
    "Rivas", "RACCN", "RACCS",
  ],
  PA: [
    "Bocas del Toro", "Chiriquí", "Coclé", "Colón",
    "Darién", "Emberá", "Herrera", "Kuna Yala",
    "Los Santos", "Ngäbe-Buglé", "Panamá", "Panamá Oeste",
    "Veraguas",
  ],
  PY: [
    "Alto Paraguay", "Alto Paraná", "Amambay", "Asunción",
    "Boquerón", "Caaguazú", "Caazapá", "Canindeyú",
    "Central", "Concepción", "Cordillera", "Guairá",
    "Itapúa", "Misiones", "Ñeembucú", "Paraguarí",
    "Presidente Hayes", "San Pedro",
  ],
  PE: [
    "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho",
    "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco",
    "Ica", "Junín", "La Libertad", "Lambayeque", "Lima",
    "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura",
    "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali",
  ],
  PR: [
    "Adjuntas", "Aguada", "Aguadilla", "Aguas Buenas", "Aibonito",
    "Añasco", "Arecibo", "Arroyo", "Barceloneta", "Barranquitas",
    "Bayamón", "Cabo Rojo", "Caguas", "Camuy", "Canóvanas",
    "Carolina", "Cataño", "Cayey", "Ceiba", "Ciales",
    "Cidra", "Coamo", "Comerío", "Corozal", "Culebra",
    "Dorado", "Fajardo", "Florida", "Guánica", "Guayama",
    "Guayanilla", "Guaynabo", "Gurabo", "Hatillo", "Hormigueros",
    "Humacao", "Isabela", "Jayuya", "Juana Díaz", "Juncos",
    "Lajas", "Lares", "Las Marías", "Las Piedras", "Loíza",
    "Luquillo", "Manatí", "Maricao", "Maunabo", "Mayagüez",
    "Moca", "Morovis", "Naguabo", "Naranjito", "Orocovis",
    "Patillas", "Peñuelas", "Ponce", "Quebradillas", "Rincón",
    "Río Grande", "Sabana Grande", "Salinas", "San Germán",
    "San Juan", "San Lorenzo", "San Sebastián", "Santa Isabel",
    "Toa Alta", "Toa Baja", "Trujillo Alto", "Utuado",
    "Vega Alta", "Vega Baja", "Vieques", "Villalba",
    "Yabucoa", "Yauco",
  ],
  UY: [
    "Artigas", "Canelones", "Cerro Largo", "Colonia",
    "Durazno", "Flores", "Florida", "Lavalleja",
    "Maldonado", "Montevideo", "Paysandú", "Río Negro",
    "Rivera", "Rocha", "Salto", "San José",
    "Soriano", "Tacuarembó", "Treinta y Tres",
  ],
  VE: [
    "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas",
    "Bolívar", "Carabobo", "Cojedes", "Delta Amacuro",
    "Dependencias Federales", "Distrito Capital", "Falcón",
    "Guárico", "La Guaira", "Lara", "Mérida", "Miranda",
    "Monagas", "Nueva Esparta", "Portuguesa", "Sucre",
    "Táchira", "Trujillo", "Yaracuy", "Zulia",
  ],
  US: [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California",
    "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
    "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
  ],
  ES: [
    "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias",
    "Cantabria", "Castilla-La Mancha", "Castilla y León", "Cataluña",
    "Ceuta", "Comunidad de Madrid", "Comunidad Valenciana",
    "Extremadura", "Galicia", "La Rioja", "Melilla", "Murcia",
    "Navarra", "País Vasco",
  ],
  OTHER: [],
};

// Comunas por región (Chile completo)
export const COMMUNES = {
  // ─── Arica y Parinacota ───────────────────────────────
  "Arica y Parinacota": ["Arica", "Camarones", "General Lagos", "Putre"],

  // ─── Tarapacá ─────────────────────────────────────────
  "Tarapacá": ["Alto Hospicio", "Camiña", "Colchane", "Huara", "Iquique", "Pica", "Pozo Almonte"],

  // ─── Antofagasta ──────────────────────────────────────
  "Antofagasta": [
    "Antofagasta", "Calama", "María Elena", "Mejillones",
    "Ollagüe", "San Pedro de Atacama", "Sierra Gorda", "Taltal", "Tocopilla",
  ],

  // ─── Atacama ──────────────────────────────────────────
  "Atacama": [
    "Alto del Carmen", "Caldera", "Chañaral", "Copiapó",
    "Diego de Almagro", "Freirina", "Huasco", "Tierra Amarilla", "Vallenar",
  ],

  // ─── Coquimbo ─────────────────────────────────────────
  "Coquimbo": [
    "Andacollo", "Canela", "Combarbalá", "Coquimbo", "Illapel",
    "La Higuera", "La Serena", "Los Vilos", "Monte Patria",
    "Ovalle", "Paiguano", "Punitaqui", "Río Hurtado",
    "Salamanca", "Vicuña",
  ],

  // ─── Valparaíso ───────────────────────────────────────
  "Valparaíso": [
    "Algarrobo", "Cabildo", "Calera", "Calle Larga", "Cartagena",
    "Casablanca", "Catemu", "Concón", "El Quisco", "El Tabo",
    "Hijuelas", "Isla de Pascua", "Juan Fernández", "La Cruz",
    "La Ligua", "Limache", "Llaillay", "Los Andes", "Nogales",
    "Olmué", "Panquehue", "Papudo", "Petorca", "Puchuncaví",
    "Putaendo", "Quillota", "Quilpué", "Quintero", "Rinconada",
    "San Antonio", "San Esteban", "San Felipe", "Santa María",
    "Santo Domingo", "Valparaíso", "Villa Alemana", "Viña del Mar",
    "Zapallar",
  ],

  // ─── Metropolitana de Santiago ────────────────────────
  "Metropolitana de Santiago": [
    "Alhué", "Buin", "Calera de Tango", "Cerrillos", "Cerro Navia",
    "Colina", "Conchalí", "Curacaví", "El Bosque", "El Monte",
    "Estación Central", "Huechuraba", "Independencia", "Isla de Maipo",
    "La Cisterna", "La Florida", "La Granja", "La Pintana",
    "La Reina", "Lampa", "Las Condes", "Lo Barnechea",
    "Lo Espejo", "Lo Prado", "Macul", "Maipú",
    "María Pinto", "Melipilla", "Ñuñoa", "Padre Hurtado",
    "Paine", "Pedro Aguirre Cerda", "Peñaflor", "Peñalolén",
    "Pirque", "Providencia", "Pudahuel", "Puente Alto",
    "Quilicura", "Quinta Normal", "Recoleta", "Renca",
    "San Bernardo", "San Joaquín", "San José de Maipo",
    "San Miguel", "San Pedro", "San Ramón", "Santiago",
    "Talagante", "Tiltil", "Vitacura",
  ],

  // ─── O'Higgins ────────────────────────────────────────
  "O'Higgins": [
    "Chimbarongo", "Chépica", "Codegua", "Coinco", "Coltauco",
    "Doñihue", "Graneros", "La Estrella", "Las Cabras",
    "Litueche", "Lolol", "Machalí", "Malloa", "Marchigüe",
    "Mostazal", "Nancagua", "Navidad", "Olivar", "Palmilla",
    "Paredones", "Peralillo", "Peumo", "Pichidegua", "Pichilemu",
    "Placilla", "Pumanque", "Quinta de Tilcoco", "Rancagua",
    "Rengo", "Requínoa", "San Fernando", "San Vicente",
    "Santa Cruz",
  ],

  // ─── Maule ────────────────────────────────────────────
  "Maule": [
    "Cauquenes", "Chanco", "Colbún", "Constitución", "Curepto",
    "Curicó", "Empedrado", "Hualañé", "Licantén", "Linares",
    "Longaví", "Maule", "Molina", "Parral", "Pelarco",
    "Pelluhue", "Pencahue", "Rauco", "Retiro", "Río Claro",
    "Romeral", "Sagrada Familia", "San Clemente", "San Javier",
    "San Rafael", "Talca", "Teno", "Vichuquén", "Villa Alegre",
    "Yerbas Buenas",
  ],

  // ─── Ñuble ────────────────────────────────────────────
  "Ñuble": [
    "Bulnes", "Chillán", "Chillán Viejo", "Cobquecura",
    "Coelemu", "Coihueco", "El Carmen", "Ninhue", "Ñiquén",
    "Pemuco", "Pinto", "Portezuelo", "Quillón", "Quirihue",
    "Ranquil", "San Carlos", "San Fabián", "San Ignacio",
    "San Nicolás", "Treguaco", "Yungay",
  ],

  // ─── Biobío ───────────────────────────────────────────
  "Biobío": [
    "Alto Biobío", "Antuco", "Arauco", "Cabrero", "Cañete",
    "Chiguayante", "Concepción", "Contulmo", "Coronel",
    "Curanilahue", "Florida", "Hualpén", "Hualqui",
    "Laja", "Lebu", "Los Álamos", "Los Ángeles",
    "Lota", "Mulchén", "Nacimiento", "Negrete", "Penco",
    "Quilaco", "Quilleco", "San Pedro de la Paz",
    "San Rosendo", "Santa Bárbara", "Santa Juana",
    "Talcahuano", "Tirúa", "Tomé", "Tucapel", "Yumbel",
  ],

  // ─── La Araucanía ─────────────────────────────────────
  "La Araucanía": [
    "Angol", "Carahue", "Cholchol", "Collipulli", "Cunco",
    "Curacautín", "Curarrehue", "Ercilla", "Freire", "Galvarino",
    "Gorbea", "Lautaro", "Loncoche", "Lonquimay", "Los Sauces",
    "Lumaco", "Melipeuco", "Nueva Imperial", "Padre las Casas",
    "Perquenco", "Pitrufquén", "Pucón", "Purén", "Renaico",
    "Saavedra", "Temuco", "Teodoro Schmidt", "Toltén",
    "Traiguén", "Victoria", "Vilcún", "Villarrica",
  ],

  // ─── Los Ríos ─────────────────────────────────────────
  "Los Ríos": [
    "Corral", "Futrono", "La Unión", "Lago Ranco",
    "Lanco", "Los Lagos", "Máfil", "Mariquina",
    "Paillaco", "Panguipulli", "Río Bueno", "Valdivia",
  ],

  // ─── Los Lagos ────────────────────────────────────────
  "Los Lagos": [
    "Ancud", "Castro", "Chaitén", "Chonchi", "Cochamó",
    "Curaco de Vélez", "Dalcahue", "Fresia", "Frutillar",
    "Futaleufú", "Hualaihué", "Llanquihue", "Los Muermos",
    "Maullín", "Osorno", "Palena", "Puerto Montt",
    "Puerto Octay", "Puerto Varas", "Puqueldón", "Purranque",
    "Puyehue", "Queilén", "Quellón", "Quemchi", "Quinchao",
    "Río Negro", "San Juan de la Costa", "San Pablo",
  ],

  // ─── Aysén ────────────────────────────────────────────
  "Aysén": [
    "Aysén", "Chile Chico", "Cisnes", "Cochrane",
    "Coyhaique", "Guaitecas", "Lago Verde",
    "O'Higgins", "Río Ibáñez", "Tortel",
  ],

  // ─── Magallanes ───────────────────────────────────────
  "Magallanes": [
    "Antártica", "Cabo de Hornos", "Laguna Blanca",
    "Natales", "Porvenir", "Primavera", "Punta Arenas",
    "Río Verde", "San Gregorio", "Timaukel", "Torres del Paine",
  ],
};

/**
 * Retorna las regiones para un país dado.
 * Para países distintos de Chile, devuelve solo strings (sin comunas).
 */
export function getRegions(countryCode) {
  return REGIONS[countryCode] ?? [];
}

/**
 * Retorna las comunas para una región dada (solo Chile).
 */
export function getCommunes(region) {
  return COMMUNES[region] ?? [];
}
