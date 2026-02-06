# Comando: /sri-validate

Valida un XML de comprobante electrónico contra las reglas del SRI.

## Instrucciones
1. Invocar el agente `sri-specialist`
2. Verificar:
   - Estructura XML conforme al XSD
   - Clave de acceso de 49 dígitos válida
   - Dígito verificador Módulo 11 correcto
   - Campos obligatorios presentes
   - Formato de fechas (dd/mm/aaaa)
   - Códigos de catálogos válidos
   - Cálculos de impuestos correctos
3. Reportar errores y advertencias
