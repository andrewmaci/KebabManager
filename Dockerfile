# Stage 1: Build the React frontend
FROM node:22-slim AS build-frontend
WORKDIR /app
COPY package.json ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY index.html ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Create the Python backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
COPY --from=build-frontend /app/dist ./static
EXPOSE 4000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4000"]