# Potros GYM — Gestor de membresías (Frontend)

Proyecto inicial para un gestor de socios de gimnasio. Interfaz moderna creada con React + Vite y Tailwind CSS. La persistencia inicial usa `localStorage`; en el futuro se integrará con MongoDB.

Tecnologías:

- React + Vite
- Tailwind CSS
- LocalStorage (placeholder para persistencia)

Rápido inicio:

1. Instala dependencias:

```bash
npm install
```

2. Si hace falta, instala Tailwind y autoprefixer (la plantilla ya los añadió en package.json):

```bash
npm install -D tailwindcss postcss autoprefixer
npm install react-icons
```

3. Arranca en modo desarrollo:

```bash
npm run dev
```

Qué incluye esta versión inicial:

- Configuración de Tailwind (`tailwind.config.cjs`, `postcss.config.cjs`).
- Componentes: `Header`, `MemberList`, `MemberCard`, `MemberForm`.
- Servicio `src/services/membersService.js` que implementa CRUD en `localStorage` y cálculo de vencimiento de membresía.

Próximos pasos sugeridos:

- Integrar backend con MongoDB y exponer API REST/GraphQL.
- Añadir autenticación (admins), roles y permisos.
- Mejorar validaciones de formulario y tests.

## Integración de Biometría (Futuro)

El sistema está preparado para integrar lectores de huella dactilar o reconocimiento facial.

### Puntos de integración:

1. **Servicio:** `src/services/membersService.js`
   - Método placeholder: `registerVisitByBiometric(biometricData)`
   - Este método debe:
     - Comunicarse con el SDK del dispositivo biométrico
     - Recibir ID de usuario desde el dispositivo
     - Buscar miembro en la base de datos
     - Registrar visita con `method: 'biometric'`

2. **Componente UI:** Crear `BiometricCheckin.jsx`
   - Botón para activar lector
   - Animación de escaneo
   - Mostrar `MemberStatusModal` al identificar usuario

3. **Hardware sugerido:**
   - Lector de huella: ZKTeco, HID, eSSL
   - Reconocimiento facial: Hikvision, Dahua, dispositivos con SDK

4. **Consideraciones técnicas:**
   - Los SDK suelen proveer APIs WebSocket o HTTP
   - Almacenar hash biométrico (nunca datos raw) en MongoDB
   - Cumplir con regulaciones de privacidad (GDPR, LFPDPPP)

### Ejemplo de flujo:

```javascript
// Pseudocódigo de integración
const biometricDevice = new BiometricSDK(config)

biometricDevice.onScan(async (data) => {
  const result = await membersService.registerVisitByBiometric(data)
  if (result.success) {
    showMemberStatusModal(result.member)
  } else {
    showError(result.message)
  }
})
```
