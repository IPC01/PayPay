# PayPay M-Pesa Request Examples

Use these examples to test the API in Postman, Insomnia, or cURL.

## Base URLs

- Local API: `http://localhost:8000`
- C2B route: `/api/v1/mpesa/c2b`
- B2C route: `/api/v1/mpesa/b2c`

## Headers

Common headers for payment requests:

```http
x-api-key: <YOUR_API_KEY>
Content-Type: application/json
```

Mock mode headers:

```http
x-mpesa-mode: mock
```

Live mode headers:

```http
x-mpesa-mode: live
```

You can also use:

```http
x-mpesa-test-mode: true
```

## 1) Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "123456"
  }'
```

Expected response:

```json
{
  "message": "Login successful",
  "token": "<JWT_TOKEN>"
}
```

## 2) Create Wallet

```bash
curl -X POST http://localhost:8000/api/wallets \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "Wallet Demo",
    "walletTypeId": 1,
    "currency": "MZN"
  }'
```

Expected response includes `wallet.walletCode`.

## 3) Create API Key

```bash
curl -X POST http://localhost:8000/api/keys/api-keys \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "postman-key",
    "scopes": ["wallet:deposit", "wallet:withdraw"]
  }'
```

Expected response:

```json
{
  "apiKey": "<RAW_API_KEY>"
}
```

## 4) C2B Mock

```bash
curl -X POST http://localhost:8000/api/v1/mpesa/c2b \
  -H "x-api-key: <RAW_API_KEY>" \
  -H "x-mpesa-mode: mock" \
  -H "Content-Type: application/json" \
  -d '{
    "walletCode": "000005",
    "amount": 10,
    "phone": "258841234567",
    "reference": "C2B-POSTMAN"
  }'
```

## 5) B2C Mock

```bash
curl -X POST http://localhost:8000/api/v1/mpesa/b2c \
  -H "x-api-key: <RAW_API_KEY>" \
  -H "x-mpesa-mode: mock" \
  -H "Content-Type: application/json" \
  -d '{
    "walletCode": "000005",
    "amount": 10,
    "phone": "258841234567",
    "reference": "B2C-POSTMAN"
  }'
```

## 6) C2B Live

```bash
curl -X POST http://localhost:8000/api/v1/mpesa/c2b \
  -H "x-api-key: <RAW_API_KEY>" \
  -H "x-mpesa-mode: live" \
  -H "Content-Type: application/json" \
  -d '{
    "walletCode": "000005",
    "amount": 10,
    "phone": "258841234567",
    "reference": "C2B-LIVE"
  }'
```

## 7) B2C Live

```bash
curl -X POST http://localhost:8000/api/v1/mpesa/b2c \
  -H "x-api-key: <RAW_API_KEY>" \
  -H "x-mpesa-mode: live" \
  -H "Content-Type: application/json" \
  -d '{
    "walletCode": "000005",
    "amount": 10,
    "phone": "258841234567",
    "reference": "B2C-LIVE"
  }'
```

## Postman / Insomnia import notes

- Import [docs/PayPay-MPesa.postman_collection.json](docs/PayPay-MPesa.postman_collection.json)
- In Postman, set `token`, `walletCode`, and `apiKey` after running Login, Create Wallet, and Create API Key.
- In Insomnia, import the same JSON file as a collection and map the variables manually.
