/**
 * Valida un RUT chileno (Algoritmo Módulo 11)
 * @param {string} rut - El RUT a validar (con o sin puntos/guion)
 * @returns {boolean} - true si es válido, false si no
 */
export const validarRut = (rut) => {
  if (!rut) return true;
  
  // Limpiar puntos y guiones y pasar a mayúsculas
  const cleaned = rut.replace(/\./g, '').replace('-', '').toUpperCase().trim();
  
  if (cleaned.length < 2) return false;

  const cuerpo = cleaned.slice(0, -1);
  const dvIngresado = cleaned.slice(-1);

  // El cuerpo debe ser solo números
  if (!/^\d+$/.test(cuerpo)) return false;

  // Algoritmo Módulo 11
  let suma = 0;
  let multiplo = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo.charAt(i), 10);
    multiplo = (multiplo === 7) ? 2 : multiplo + 1;
  }
  
  const dvEsperado = 11 - (suma % 11);
  let dvFinal;
  
  if (dvEsperado === 11) {
    dvFinal = '0';
  } else if (dvEsperado === 10) {
    dvFinal = 'K';
  } else {
    dvFinal = dvEsperado.toString();
  }
  
  return dvFinal === dvIngresado;
};
