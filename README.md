# 🛒 Checkout Full-Stack – Serverless Monorepo

Proyecto **Full-Stack** para un flujo de **checkout y pagos**, implementado con:

- **Backend:** NestJS + Serverless Framework + AWS Lambda + DynamoDB  
- **Frontend:** React + Vite + TypeScript  
- **Arquitectura:** Serverless, orientada a eventos y polling de estado de pago

El sistema permite:
1. Listar productos
2. Iniciar un checkout
3. Procesar un pago con proveedor externo
4. Consultar el estado de la transacción hasta su finalización

---

## 📁 Estructura del monorepo

```
.
├── backend/
│   ├── src/
│   │   ├── application/        # Casos de uso / servicios
│   │   ├── common/             # Funciones comunes
│   │   ├── config/             # Configuración de varables de ambiente
│   │   ├── infrastructure/     # Repositorios, clientes externos, dynamo
│   │   ├── interfaces/         # Controllers HTTP
│   │   ├── domain/             # DTOs, types y validaciones
│   │   ├── app.module.ts
│   │   ├── lambda.ts           # Entry point Lambda
│   │   └── main.ts
│   ├── scripts/                # Seeds y creación de tablas local
│   ├── serverless/             # Archivos custom de serverless
│   ├── assets/                 # Archivo html estatico para servir swagger      
│   ├── serverless.yml          # Archivo central de deploy por IAC
│   ├── jest.config.ts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                # Hooks y stores
│   │   ├── components/         # Componentes individuales
│   │   ├── features/           # Características de la aplicación (Products, Checkout, Status)
│   │   ├── pages/              # Pages (Products, Status)
│   │   ├── services/           # Servicios del front
│   │   └── App.tsx
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## 🧠 Arquitectura (visión general)

### Backend
- **NestJS** ejecutándose en **AWS Lambda**
- **API Gateway HTTP API**
- **DynamoDB** como base de datos
- **Serverless Framework** para infraestructura
- **Swagger** para documentación
- **Polling server-side** para refrescar estado de pagos
- **Idempotencia** para evitar doble descuento de stock

### Frontend
- **React + Vite**
- Comunicación vía REST API
- **Polling del estado de transacción**
- Manejo de errores y loading states

---

## 🚀 Backend

### Requisitos
- Node.js ≥ 18
- Docker (para DynamoDB local)
- AWS CLI configurado (para deploy)
- Serverless Framework

---

### 📦 Instalación

```bash
cd backend
npm install
```

---

### 🧪 DynamoDB local (desarrollo)

#### Levantar DynamoDB con Docker
La aplicación cuenta con el archivo ya definido para la creación del contenedor para dynamo en local
```bash
docker-compose up -d
```

#### Crear tablas localmente
```bash
npm run create:tables:local
```

#### Ejecutar seeds
```bash
npm run seed:products:local
```

---

### ▶️ Ejecutar backend en local

```bash
npm run build
IS_OFFLINE=true \
PRODUCTS_TABLE=products-local \
TRANSACTIONS_TABLE=transactions-local \
node dist/src/main.js
```

Backend disponible en:
```
http://localhost:3001
```

---

### 📚 Swagger
- UI: `GET /docs`
- JSON: `GET /docs-json`

---

### 🧪 Tests unitarios (Jest)

```bash
npm test
npm run test:cov
```

Los tests cubren:
- Inicialización de checkout
- Flujo de pago
- Refresco de estado de transacciones
- Idempotencia de stock

### 🧪 Evidencias de Coverage > 80% (Jest)
<p align="center">
  <img src="docs\coverage-back.png" alt="Logo" width="1000" />
</p>

---

### ☁️ Deploy a AWS (Serverless)

#### Variables de entorno requeridas

```bash
APIPAY_PRIVATE_KEY
APIPAY_PUBLIC_KEY
APIPAY_BASE_URL
APIPAY_INTEGRITY_SECRET
```

#### Deploy
```bash
npx serverless deploy --stage dev
```

#### Ver logs
```bash
npx serverless logs -f api -t --stage dev
```

---

## 🎨 Frontend

### Requisitos
- Node.js ≥ 18

---

### 📦 Instalación

```bash
cd frontend
npm install
```

---

### ⚙️ Variables de entorno

Crear `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Para AWS:
```env
VITE_API_BASE_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/dev
```

---

### ▶️ Ejecutar frontend

```bash
npm run dev
```

Disponible en:
```
http://localhost:5173
```

---

## 🔄 Flujo funcional

1. **Listar productos**
   ```
   GET /products
   ```
2. **Iniciar checkout**
   ```
   POST /checkout/init
   ```
3. **Pagar**
   ```
   POST /checkout/pay
   ```
4. **Consultar estado**
   ```
   GET /transactions/:txId
   ```

El frontend realiza **polling** hasta que la transacción sea:
- `APPROVED`
- `DECLINED`
- `ERROR`

---

### 🧪 Tests unitarios (vitest)

```bash
npm run test
npm run test:coverage
```

Los tests cubren:
- Inicialización de checkout
- Flujo de pago
- Refresco de estado de transacciones
- Idempotencia de stock

### 🧪 Evidencias de Coverage > 80% (vitest)
<p align="center">
  <img src="docs\coverage-front.png" alt="Logo" width="1000" />
</p>

---

## 🔐 Consideraciones de seguridad
- Secrets **no se versionan**
- Variables sensibles inyectadas vía env
- Validaciones estrictas con `class-validator`
- Manejo de errores controlado

---

## 🧩 Decisiones técnicas destacadas
- **Serverless** para escalabilidad y costo
- **Polling** en vez de webhooks para simplificar la prueba
- **Idempotencia** para evitar efectos secundarios duplicados
- **Separación clara de capas** (controller → service → repository)
- **Tests unitarios enfocados en lógica de negocio**

---

## 📌 Mejoras futuras
- Webhooks del proveedor de pagos
- Cache (Redis / DAX)
- Autenticación de usuarios
- UI/UX más avanzada
- Observabilidad (tracing)

---

## 👨‍💻 Autor
**José Antonio Moreno**  
Software Engineer – Full Stack  
NestJS | React | AWS | Serverless

