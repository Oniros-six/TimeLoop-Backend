# Sistema de Autenticación y Autorización

## Descripción General

El sistema de autenticación está implementado usando **Passport.js** con estrategia local y sesiones basadas en cookies. Incluye autorización basada en roles para proteger las rutas de la API.

## Componentes Principales

### 1. Estrategia de Autenticación (`LocalStrategy`)
- Ubicación: `src/infrastructure/auth/local.strategy.ts`
- Valida credenciales usando email y contraseña
- Utiliza bcrypt para comparar contraseñas hasheadas

### 2. Serializador de Sesión (`SessionSerializer`)
- Ubicación: `src/infrastructure/auth/session.serializer.ts`
- Maneja la serialización/deserialización de usuarios en sesiones
- Retorna información segura del usuario (sin contraseña)

### 3. Guard de Autenticación (`AuthGuard`)
- Ubicación: `src/infrastructure/auth/auth.guard.ts`
- Verifica que el usuario esté autenticado
- Lanza `UnauthorizedException` si no hay sesión activa

### 4. Guard de Roles (`RolesGuard`)
- Ubicación: `src/infrastructure/auth/roles.guard.ts`
- Verifica permisos basados en roles
- Utiliza decoradores para especificar roles requeridos

### 5. Decoradores de Roles
- Ubicación: `src/infrastructure/auth/roles.decorator.ts`
- `@RequireAdmin()` - Solo administradores
- `@RequireEmployee()` - Solo empleados
- `@RequireAdminOrEmployee()` - Administradores o empleados
- `@Roles(1, 2)` - Roles específicos

## Endpoints de Autenticación

### POST `/auth/login`
Inicia sesión con email y contraseña.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "name": "Usuario Ejemplo",
    "email": "usuario@ejemplo.com",
    "role": 1,
    "commerceId": 1,
    "active": true
  }
}
```

### GET `/auth/me`
Verifica el estado de autenticación del usuario actual.

**Respuesta:**
```json
{
  "message": "Usuario autenticado",
  "user": {
    "id": 1,
    "name": "Usuario Ejemplo",
    "email": "usuario@ejemplo.com",
    "role": 1,
    "commerceId": 1,
    "active": true
  }
}
```

### POST `/auth/logout`
Cierra la sesión del usuario.

**Respuesta:**
```json
{
  "message": "Logout exitoso"
}
```

## Roles Disponibles

```typescript
enum Roles {
  ADMIN = 1,    // Administrador
  EMPLOYEE = 2  // Empleado
}
```

## Cómo Proteger Rutas

### 1. Protección Básica (Solo Autenticación)
```typescript
@UseGuards(AuthGuard)
@Get('ruta-protegida')
async rutaProtegida() {
  // Solo usuarios autenticados pueden acceder
}
```

### 2. Protección con Roles
```typescript
@UseGuards(AuthGuard, RolesGuard)
@RequireAdmin()
@Post('solo-admin')
async soloAdmin() {
  // Solo administradores pueden acceder
}
```

### 3. Múltiples Roles
```typescript
@UseGuards(AuthGuard, RolesGuard)
@RequireAdminOrEmployee()
@Get('admin-o-empleado')
async adminOEmpleado() {
  // Administradores o empleados pueden acceder
}
```

### 4. Roles Específicos
```typescript
@UseGuards(AuthGuard, RolesGuard)
@Roles(Roles.ADMIN, Roles.EMPLOYEE)
@Get('roles-especificos')
async rolesEspecificos() {
  // Solo los roles especificados pueden acceder
}
```

## Ejemplo Completo de Controlador Protegido

```typescript
@ApiTags('Users')
@ApiBearerAuth()
@Controller('user')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  
  @Post()
  @RequireAdmin()
  async createUser(@Body() dto: CreateUserDto) {
    // Solo administradores pueden crear usuarios
  }

  @Get()
  @RequireAdminOrEmployee()
  async getUsers() {
    // Administradores y empleados pueden ver usuarios
  }

  @Put(':id')
  @RequireAdmin()
  async updateUser(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    // Solo administradores pueden actualizar usuarios
  }
}
```

## Configuración de Sesiones

Las sesiones están configuradas en `src/main.ts`:

```typescript
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24, // 1 día
    },
  }),
);
```

## Variables de Entorno

```env
SESSION_SECRET=tu-secreto-super-seguro
NODE_ENV=production
```

## Seguridad

### Características Implementadas:
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Sesiones seguras con cookies httpOnly
- ✅ Validación de roles
- ✅ Protección CSRF con sameSite
- ✅ Cookies seguras en producción (HTTPS)

### Recomendaciones:
1. Cambiar `SESSION_SECRET` en producción
2. Usar HTTPS en producción
3. Implementar rate limiting
4. Considerar JWT para APIs stateless
5. Implementar refresh tokens para sesiones largas

## Testing

Para probar la autenticación:

1. **Crear un usuario** (si no existe)
2. **Hacer login** con `POST /auth/login`
3. **Verificar sesión** con `GET /auth/me`
4. **Acceder a rutas protegidas**
5. **Hacer logout** con `POST /auth/logout`

## Troubleshooting

### Error: "Debe iniciar sesión para acceder a este recurso"
- Verificar que se haya hecho login correctamente
- Verificar que la cookie de sesión esté presente
- Verificar que la sesión no haya expirado

### Error: "No tiene permisos para acceder a este recurso"
- Verificar que el usuario tenga el rol requerido
- Verificar que el usuario esté activo
- Verificar la configuración de roles en el decorador

### Error: "Credenciales inválidas"
- Verificar email y contraseña
- Verificar que el usuario exista y esté activo
- Verificar que la contraseña esté hasheada correctamente
