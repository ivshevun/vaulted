# Vaulted

**Vaulted** is a next-generation **cloud storage** platform built on a **microservices architecture** with
**RabbitMQ**.
The project focuses on **security**, **scalability**, and **developer-friendly workflows**.

---

## ✨ Features

- 🔐 **Secure authentication** with dual **JWT tokens** for login and session management.
- 📂 **Safe file upload & storage** with **AWS S3** and **automatic virus scanning**.
- 📧 **Email notifications** powered by **SendGrid API** and **React Emails**.
- 🤝 **File sharing** (only after virus scan) ***(To Do)***.
- 🗂 **Folder organization** for files ***(To Do)***.
- ☁️ **Deployment on AWS with Kubernetes** for elastic scalability ***(To Do)***.

---

## 🔧 Key Highlights

- ✅ Full test coverage: **unit, integration, and e2e tests**.
- 📖 Well-documented API with **OpenAPI (Swagger)**.
- 🗃 **Isolated databases** per microservice for clean microservice architecture.
- 🧪 **Test-Driven Development (TDD)** as the core methodology.
- 📝 Commit linting and validation using **Commitlint + Husky**.
- ⚙️ Fully automated **CI/CD pipeline** built with **GitHub Actions**.

---

## 🛠️ Tech Stack

- **Languages & Frameworks**: TypeScript, NestJS
- **Database**: PostgreSQL
- **Infrastructure**: Docker, Docker Compose, Kubernetes *(To Do)*
- **Deployment & Networking**: Nginx *(To Do)*, Ingress *(To Do)*
- **Messaging**: RabbitMQ
- **Emailing**: SendGrid API, React Emails
- **Version Control & CI/CD**: Git, GitHub Actions

---

## 🚀 Status

The project is under active development. Some features are already implemented, while others are in progress or planned
for future releases.

---

## 📌 Roadmap

- [x] Authentication with JWT
- [x] File upload + virus scanning
- [x] Email notifications
- [ ] File sharing
- [ ] Folder organization
- [ ] AWS deployment with Kubernetes
- [ ] Ingress + Nginx setup

---

## 🎬 How to run locally

1.**Clone the repository**

```bash
git clone <repository-url>
cd vaulted
```

2. **Fill in environment variables**

```bash
cp .env.example .env
cd apps/antivirus && cp .env.example .env
cd ../auth && cp .env.example .env
cd ../notifications && cp .env.example .env
cd ../files && cp .env.example .env
cd ../api-gateway && cp .env.example .env
cd ../..
   ```

3. **Run databases**

```bash
docker compose up postgres-files postgres-auth
```

4. **Apply migrations for databases**

```bash
DATABASE_URL="<your-files-database-url>" npx prisma db push --schema=apps/files/src/prisma/schema.prisma

DATABASE_URL="<your-auth-database-url>" npx prisma db push --schema=apps/auth/src/prisma/schema.prisma
```

5. **Shut down databases**

```bash
docker compose down
```

6. **Run application**

```bash
docker comopose up 
```

