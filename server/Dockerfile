# 1. Build stage
FROM golang:1.23-alpine AS builder

# Install ca-certificates for HTTPS requests during build
RUN apk update && apk --no-cache add ca-certificates git

WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary with optimizations
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o main ./cmd/main.go

# 2. Runtime stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk update && apk --no-cache add ca-certificates

WORKDIR /root/

# Copy ONLY the binary from builder
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]