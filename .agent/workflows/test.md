---
description: Revisa todos los archivos para asegurar 100% de cobertura de tests, genera tests faltantes, ejecuta la suite de pruebas y verifica la compilación (`npm run build`) y ejecución (`npm run dev`).
---

// turbo-all
1. **Auditoría de Cobertura**:
    - Leer las instrucciones de la skill 'testeos-automaticos' en `C:\Users\Marto\.gemini\antigravity\skills\testeos-automaticos\SKILL.md`.
    - Realizar un escaneo de TODO el proyecto (`Frontend` y `Backend`) para identificar archivos que no tengan archivos de test asociados (`.test.tsx`, `.test.ts`, `.spec.ts`, etc.).
    - Generar una lista de archivos críticos sin cobertura.

2. **Generación y Mejora de Tests**:
    - Para cada archivo identificado sin cobertura o con cobertura insuficiente, utilizar la skill `testeos-automaticos` para generar los tests unitarios e integración necesarios.
    - El objetivo es alcanzar el **100% de cobertura** en la lógica de negocio, componentes y servicios.
    - Revisar los tests existentes para identificar posibles mejoras en casos de borde (edge cases) y manejo de errores.

3. **Ejecución de Pruebas**:
    - Ejecutar los tests en el Backend: `npm run test` (dentro de `Backend`).
    - Ejecutar los tests en el Frontend: `npm run test` (dentro de `Frontend`).
    - Validar que el 100% de los tests pasen exitosamente.

4. **Verificación de Compilación y Ejecución**:
    - Ejecutar `npm run build` en la raíz del proyecto para asegurar que no hay errores de tipado o compilación en el monorepo.
    - Ejecutar `npm run dev` en la raíz del proyecto.
    - Verificar que los logs de la terminal indiquen que tanto el Frontend como el Backend se han iniciado correctamente sin errores fatales.

5. **Reporte Final**:
    - Generar un artifact `walkthrough.md` detallando:
        - Archivos nuevos de test creados.
        - Mejoras realizadas en tests existentes.
        - Resultados de `npm run build`.
        - Evidencia de que `npm run dev` funciona correctamente (screenshots o logs).
