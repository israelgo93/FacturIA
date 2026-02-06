---
description: "Generación de XML para comprobantes electrónicos del SRI Ecuador conforme a la Ficha Técnica Offline v2.32. Usar cuando se construyan, validen, o debugueen XMLs de facturas, retenciones, notas de crédito, etc."
---

# Skill: XML Comprobantes Electrónicos SRI

## Cuándo Usar
- Generar XML de cualquier tipo de comprobante
- Validar estructura XML contra esquemas XSD
- Construir la clave de acceso de 49 dígitos
- Implementar el algoritmo Módulo 11

## Estructura XML Factura (versión 1.1.0)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">
  <infoTributaria>
    <ambiente>1</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>...</razonSocial>
    <ruc>1234567890001</ruc>
    <claveAcceso>[49 dígitos]</claveAcceso>
    <codDoc>01</codDoc>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>000000001</secuencial>
    <dirMatriz>...</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>06/02/2026</fechaEmision>
    <!-- ... campos obligatorios -->
  </infoFactura>
  <detalles>
    <detalle><!-- items --></detalle>
  </detalles>
</factura>
```

## Algoritmo Módulo 11
```javascript
function calcularDigitoVerificador(cadena48) {
  const factores = [2, 3, 4, 5, 6, 7];
  let suma = 0;
  let factorIndex = 0;

  for (let i = cadena48.length - 1; i >= 0; i--) {
    suma += parseInt(cadena48[i]) * factores[factorIndex];
    factorIndex = (factorIndex + 1) % factores.length;
  }

  const residuo = suma % 11;
  let digito = 11 - residuo;

  if (digito === 11) digito = 0;
  if (digito === 10) digito = 1;

  return digito;
}
```

## Reglas Críticas
- Campos alfanuméricos: SIN espacios entre caracteres
- Decimales: hasta 6 en versión 1.1.0
- Fechas: dd/mm/aaaa
- Secuenciales: SIEMPRE 9 dígitos con ceros
- Consumidor final: tipo 07, identificación 9999999999999
