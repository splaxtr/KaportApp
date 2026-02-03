export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "KaportApp API",
    description: "Kaportacı iş takip sistemi REST API dokümantasyonu",
    version: "1.0.0",
    contact: {
      name: "Vurthex",
      url: "https://kucukaga.vurthex.com",
    },
  },
  servers: [
    {
      url: "https://kucukaga.vurthex.com",
      description: "Production",
    },
  ],
  tags: [
    { name: "Auth", description: "Kimlik doğrulama işlemleri" },
    { name: "Users", description: "Kullanıcı yönetimi (Admin)" },
    { name: "Customers", description: "Müşteri yönetimi" },
    { name: "Vehicles", description: "Araç yönetimi" },
    { name: "Vehicle Files", description: "Araç dosyaları (iş emirleri)" },
    { name: "Parts", description: "Parça yönetimi" },
    { name: "Operations", description: "İşlem yönetimi" },
    { name: "Photos", description: "Fotoğraf yönetimi" },
    { name: "Experts", description: "Eksper yönetimi" },
    { name: "Review Links", description: "Müşteri inceleme linkleri" },
    { name: "Statuses", description: "Durum tanımları" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "kaporta_auth",
        description: "JWT token cookie ile gönderilir",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", description: "Hata mesajı" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          fullName: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string", nullable: true },
          role: { type: "string", enum: ["system_admin", "admin", "employee"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateUser: {
        type: "object",
        required: ["fullName", "email", "password", "roleKey"],
        properties: {
          fullName: { type: "string", minLength: 2, maxLength: 100 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, description: "En az 1 büyük, 1 küçük harf ve 1 rakam" },
          phone: { type: "string", maxLength: 20, nullable: true },
          roleKey: { type: "string", enum: ["system_admin", "admin", "employee"] },
        },
      },
      Customer: {
        type: "object",
        properties: {
          id: { type: "integer" },
          fullName: { type: "string" },
          email: { type: "string", format: "email", nullable: true },
          tcVkn: { type: "string", nullable: true },
          phones: { type: "array", items: { $ref: "#/components/schemas/Phone" } },
          addresses: { type: "array", items: { $ref: "#/components/schemas/Address" } },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateCustomer: {
        type: "object",
        required: ["fullName"],
        properties: {
          fullName: { type: "string", minLength: 2, maxLength: 100 },
          email: { type: "string", format: "email", nullable: true },
          tcVkn: { type: "string", pattern: "^[0-9]{10,11}$", nullable: true },
          note: { type: "string", maxLength: 1000, nullable: true },
          phones: { type: "array", items: { $ref: "#/components/schemas/CreatePhone" } },
          addresses: { type: "array", items: { $ref: "#/components/schemas/CreateAddress" } },
        },
      },
      Phone: {
        type: "object",
        properties: {
          id: { type: "integer" },
          label: { type: "string", nullable: true },
          phone: { type: "string" },
        },
      },
      CreatePhone: {
        type: "object",
        required: ["phone"],
        properties: {
          label: { type: "string", maxLength: 50, nullable: true },
          phone: { type: "string", minLength: 10, maxLength: 20 },
        },
      },
      Address: {
        type: "object",
        properties: {
          id: { type: "integer" },
          label: { type: "string", nullable: true },
          address: { type: "string" },
          city: { type: "string", nullable: true },
          district: { type: "string", nullable: true },
          postalCode: { type: "string", nullable: true },
        },
      },
      CreateAddress: {
        type: "object",
        required: ["address"],
        properties: {
          label: { type: "string", maxLength: 50, nullable: true },
          address: { type: "string", minLength: 5, maxLength: 500 },
          city: { type: "string", maxLength: 100, nullable: true },
          district: { type: "string", maxLength: 100, nullable: true },
          postalCode: { type: "string", maxLength: 10, nullable: true },
        },
      },
      Vehicle: {
        type: "object",
        properties: {
          id: { type: "integer" },
          plate: { type: "string" },
          plateNormalized: { type: "string" },
          firstVisitAt: { type: "string", format: "date-time" },
          lastVisitAt: { type: "string", format: "date-time" },
          visitCount: { type: "integer" },
          filesCount: { type: "integer" },
        },
      },
      VehicleFile: {
        type: "object",
        properties: {
          id: { type: "integer" },
          plate: { type: "string" },
          brandModel: { type: "string" },
          color: { type: "string", nullable: true },
          accidentDate: { type: "string", format: "date-time", nullable: true },
          fileNumber: { type: "string", nullable: true },
          quickNote: { type: "string", nullable: true },
          status: { type: "string", enum: ["open", "pending", "completed"] },
          customer: { $ref: "#/components/schemas/CustomerRef" },
          expert: { $ref: "#/components/schemas/ExpertRef", nullable: true },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateVehicleFile: {
        type: "object",
        required: ["plate", "brandModel", "customerId"],
        properties: {
          vehicleId: { type: "integer", nullable: true },
          plate: { type: "string", minLength: 5, maxLength: 15 },
          brandModel: { type: "string", minLength: 2, maxLength: 100 },
          color: { type: "string", maxLength: 50, nullable: true },
          accidentDate: { type: "string", format: "date-time", nullable: true },
          fileNumber: { type: "string", maxLength: 50, nullable: true },
          quickNote: { type: "string", maxLength: 500, nullable: true },
          customerId: { type: "integer" },
          expertId: { type: "integer", nullable: true },
        },
      },
      CustomerRef: {
        type: "object",
        properties: {
          id: { type: "integer" },
          fullName: { type: "string" },
        },
      },
      ExpertRef: {
        type: "object",
        properties: {
          id: { type: "integer" },
          fullName: { type: "string" },
        },
      },
      Part: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          quantity: { type: "integer" },
          statusId: { type: "integer" },
          vehicleFileId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreatePart: {
        type: "object",
        required: ["vehicleFileId", "name", "statusId"],
        properties: {
          vehicleFileId: { type: "integer" },
          name: { type: "string", minLength: 2, maxLength: 100 },
          description: { type: "string", maxLength: 500, nullable: true },
          quantity: { type: "integer", minimum: 1, default: 1 },
          statusId: { type: "integer" },
        },
      },
      Operation: {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          statusId: { type: "integer" },
          vehicleFileId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateOperation: {
        type: "object",
        required: ["vehicleFileId", "title", "statusId"],
        properties: {
          vehicleFileId: { type: "integer" },
          title: { type: "string", minLength: 2, maxLength: 100 },
          description: { type: "string", maxLength: 500, nullable: true },
          statusId: { type: "integer" },
        },
      },
      Photo: {
        type: "object",
        properties: {
          id: { type: "integer" },
          url: { type: "string" },
          title: { type: "string", nullable: true },
          note: { type: "string", nullable: true },
          vehicleFileId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Expert: {
        type: "object",
        properties: {
          id: { type: "integer" },
          fullName: { type: "string" },
          phone: { type: "string", nullable: true },
          email: { type: "string", format: "email", nullable: true },
          company: { type: "string", nullable: true },
          note: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateExpert: {
        type: "object",
        required: ["fullName"],
        properties: {
          fullName: { type: "string", minLength: 2, maxLength: 100 },
          phone: { type: "string", maxLength: 20, nullable: true },
          email: { type: "string", format: "email", nullable: true },
          company: { type: "string", maxLength: 100, nullable: true },
          note: { type: "string", maxLength: 500, nullable: true },
        },
      },
      ReviewLink: {
        type: "object",
        properties: {
          id: { type: "integer" },
          token: { type: "string" },
          vehicleFileId: { type: "integer" },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          status: { type: "string", enum: ["active", "expired", "revoked"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Status: {
        type: "object",
        properties: {
          id: { type: "integer" },
          label: { type: "string" },
          color: { type: "string", nullable: true },
          sortOrder: { type: "integer" },
        },
      },
      CreateStatus: {
        type: "object",
        required: ["label"],
        properties: {
          label: { type: "string", minLength: 2, maxLength: 50 },
          color: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$", nullable: true },
          sortOrder: { type: "integer", minimum: 0, default: 0 },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "integer" },
              email: { type: "string" },
              fullName: { type: "string" },
              role: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Oturum açmanız gerekiyor",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      Forbidden: {
        description: "Bu işlem için yetkiniz yok",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFound: {
        description: "Kayıt bulunamadı",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      BadRequest: {
        description: "Geçersiz istek",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      TooManyRequests: {
        description: "Çok fazla istek - rate limit aşıldı",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Giriş yap",
        description: "E-posta ve şifre ile giriş yapın. Başarılı girişte JWT cookie ayarlanır.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Başarılı giriş",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Kullanıcı listesi",
        description: "Tüm kullanıcıları listele (Admin yetkisi gerekli)",
        responses: {
          "200": {
            description: "Kullanıcı listesi",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Yeni kullanıcı oluştur",
        description: "Yeni kullanıcı kaydı oluştur (Admin yetkisi gerekli)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUser" },
            },
          },
        },
        responses: {
          "201": {
            description: "Kullanıcı oluşturuldu",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Kullanıcı detayı",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Kullanıcı bilgisi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Kullanıcı güncelle",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string" },
                  phone: { type: "string", nullable: true },
                  roleKey: { type: "string", enum: ["system_admin", "admin", "employee"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Güncellendi" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Kullanıcı sil",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Silindi" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/customers": {
      get: {
        tags: ["Customers"],
        summary: "Müşteri listesi",
        parameters: [
          { name: "q", in: "query", description: "Arama terimi", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Müşteri listesi",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Customer" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Customers"],
        summary: "Yeni müşteri oluştur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCustomer" },
            },
          },
        },
        responses: {
          "201": {
            description: "Müşteri oluşturuldu",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Customer" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/customers/{id}": {
      get: {
        tags: ["Customers"],
        summary: "Müşteri detayı",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Müşteri bilgisi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Customer" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Customers"],
        summary: "Müşteri güncelle",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Güncellendi" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Customers"],
        summary: "Müşteri sil",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Silindi" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/vehicles": {
      get: {
        tags: ["Vehicles"],
        summary: "Araç listesi",
        parameters: [
          { name: "q", in: "query", description: "Plaka arama", schema: { type: "string" } },
          { name: "limit", in: "query", description: "Limit", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          "200": {
            description: "Araç listesi",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Vehicle" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Vehicles"],
        summary: "Yeni araç oluştur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["plate"],
                properties: {
                  plate: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Araç oluşturuldu" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/vehicle-files": {
      get: {
        tags: ["Vehicle Files"],
        summary: "Dosya listesi",
        parameters: [
          { name: "status", in: "query", description: "Durum filtresi", schema: { type: "string", enum: ["open", "pending", "completed"] } },
          { name: "plate", in: "query", description: "Plaka filtresi", schema: { type: "string" } },
          { name: "limit", in: "query", description: "Limit", schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Dosya listesi",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/VehicleFile" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Vehicle Files"],
        summary: "Yeni dosya oluştur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateVehicleFile" },
            },
          },
        },
        responses: {
          "201": { description: "Dosya oluşturuldu" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/vehicle-files/parts": {
      post: {
        tags: ["Parts"],
        summary: "Yeni parça ekle",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePart" },
            },
          },
        },
        responses: {
          "201": { description: "Parça eklendi" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/parts/{id}": {
      patch: {
        tags: ["Parts"],
        summary: "Parça güncelle",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Güncellendi" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Parts"],
        summary: "Parça sil",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Silindi" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/vehicle-files/operations": {
      post: {
        tags: ["Operations"],
        summary: "Yeni işlem ekle",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOperation" },
            },
          },
        },
        responses: {
          "201": { description: "İşlem eklendi" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/operations/{id}": {
      patch: {
        tags: ["Operations"],
        summary: "İşlem güncelle",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Güncellendi" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Operations"],
        summary: "İşlem sil",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Silindi" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/upload": {
      post: {
        tags: ["Photos"],
        summary: "Fotoğraf yükle",
        description: "FormData veya Base64 JSON ile fotoğraf yükle",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file", "vehicleFileId"],
                properties: {
                  file: { type: "string", format: "binary" },
                  vehicleFileId: { type: "integer" },
                  title: { type: "string" },
                  note: { type: "string" },
                },
              },
            },
            "application/json": {
              schema: {
                type: "object",
                required: ["base64", "mimeType", "vehicleFileId"],
                properties: {
                  base64: { type: "string" },
                  mimeType: { type: "string", enum: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
                  vehicleFileId: { type: "integer" },
                  title: { type: "string" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Fotoğraf yüklendi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Photo" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/photos/{id}": {
      delete: {
        tags: ["Photos"],
        summary: "Fotoğraf sil",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Silindi" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/experts": {
      get: {
        tags: ["Experts"],
        summary: "Eksper listesi",
        responses: {
          "200": {
            description: "Eksper listesi",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Expert" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Experts"],
        summary: "Yeni eksper oluştur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateExpert" },
            },
          },
        },
        responses: {
          "201": { description: "Eksper oluşturuldu" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/review-links": {
      get: {
        tags: ["Review Links"],
        summary: "İnceleme linki listesi",
        responses: {
          "200": {
            description: "Link listesi",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ReviewLink" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Review Links"],
        summary: "Yeni inceleme linki oluştur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fileId"],
                properties: {
                  fileId: { type: "integer" },
                  expiresAt: { type: "string", format: "date-time", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Link oluşturuldu" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/review-links/view": {
      post: {
        tags: ["Review Links"],
        summary: "İnceleme linkini görüntüle (Public)",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "key"],
                properties: {
                  token: { type: "string" },
                  key: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Dosya bilgileri" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/api/part-statuses": {
      get: {
        tags: ["Statuses"],
        summary: "Parça durumları listesi",
        responses: {
          "200": {
            description: "Durum listesi",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Status" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Statuses"],
        summary: "Yeni parça durumu oluştur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStatus" },
            },
          },
        },
        responses: {
          "201": { description: "Durum oluşturuldu" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/operation-statuses": {
      get: {
        tags: ["Statuses"],
        summary: "İşlem durumları listesi",
        responses: {
          "200": {
            description: "Durum listesi",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Status" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Statuses"],
        summary: "Yeni işlem durumu oluştur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStatus" },
            },
          },
        },
        responses: {
          "201": { description: "Durum oluşturuldu" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/trash": {
      get: {
        tags: ["Trash"],
        summary: "Çöp kutusu",
        description: "Silinen kayıtları listele",
        responses: {
          "200": { description: "Silinen kayıtlar" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
  },
};
