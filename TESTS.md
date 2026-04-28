Pruebas manuales - Flujos críticos

Objetivo: verificar que el sistema separa correctamente "Entradas" (socios) y "Visitas" (pase diario $80).

1) Nuevo socio crea entrada automática
- Acción:
  - Ir al formulario de crear socio (frontend).
  - Crear socio con: Nombre: "Prueba Nuevo", Apellido Paterno: "Perez", Apellido Materno: "Lopez", Teléfono: "5512345678".
- Resultado esperado:
  - El endpoint `POST /members` devuelve el socio con `visits: []` en la respuesta (backend crea Visit internamente).
  - Ver en `Registro de Entrada` (CheckinPanel) que aparece una entrada con el nombre completo "PRUEBA NUEVO PEREZ LOPEZ" para la fecha actual.
  - No debe crearse ningún `Payment` por el registro del socio (solo la creación inicial del plan si aplica).

2) Registrar visita para NO-socio (pase diario)
- Acción:
  - Ir a "Registrar Visita" y escribir un nombre que NO coincida con ningún socio, por ejemplo: "Visitante Demo".
    - Enviar formulario (debe cobrar $80).
- Resultado esperado:
    - Se crea un registro en `quick-visits` con `amount: 80` y `at` con timestamp local.
  - Se crea una `Visit` con `memberId: 'visitor'`, método `quick-visit` y `paymentType: 'visita'`.
  - En `Registrar Visita` se debe listar esta visita en los movimientos de hoy.
    - En `Panel de Ingresos` y exportación, el pago aparece como tipo `visita` y suma +80 a ingresos.

3) Intentar registrar visita con nombre que coincide con socio
- Acción:
  - En "Registrar Visita" escribir exactamente el nombre completo de un socio (sistema hace comparación exacta, insensible a mayúsculas).
- Resultado esperado:
  - Frontend muestra advertencia y NO crea `quick-visit`.
  - Backend rechazará con 400 si se intenta por API directa.
  - Se debe usar `Registro de Entrada` para marcar la entrada del socio (no cobrarle $80 si es socio y no paga visita).

4) Registrar entrada de socio (Checkin)
- Acción:
  - En `Registro de Entrada` buscar un socio existente y abrir su modal.
  - Cerrar modal SIN registrar pago.
- Resultado esperado:
  - Se crea una `Visit` con `memberId` del socio, `method: 'manual'`, `paymentType: null`.
  - No se crea `Payment`.
  - El conteo de visitas de perfil incrementa en 1.

5) Registrar pago puntual para socio (renovación/plan)
- Acción:
  - En modal del socio, seleccionar plan (p. ej. `mensual`) y registrar pago.
- Resultado esperado:
  - Se crea `Payment` con tipo `mensual` y amount correspondiente.
  - Se actualiza `Member` con `joinDate` igual a la fecha de pago y `expiry` calculado desde esa fecha.
  - Se crea también una `Visit` si la lógica del front lo considera (opcional), pero lo importante es que el pago se registre correctamente.

6) Exportar pagos
- Acción:
  - Ir a `Panel de Ingresos` y click en `Exportar Base Completa a Excel`.
- Resultado esperado:
  - El CSV contiene solo registros de `payments` (miembros) y `quick-visits` con amount>0.
  - No incluye entradas gratuitas (visits con paymentType null).

Notas de depuración:
- Para inspeccionar colecciones en backend (si estás en dev): usar mongo shell o GUI para revisar `members`, `visits`, `payments`, `quickvisits`.
- Endpoints relevantes:
  - POST /members
  - POST /members/:id/visit
  - POST /members/:id/payment
  - GET /quick-visits
  - POST /quick-visits

Si quieres, puedo automatizar estas pruebas con pequeños scripts que llamen a los endpoints (curl/node) y validen respuestas. Dime si prefieres que genere esos scripts y los ejecute localmente.