# Tron Wallet Service

This is a Tron Wallet Service built with Bun and Elysia, providing functionality for creating and managing Tron wallets, as well as handling deposits and withdrawals. test mnemonic in .env.example has some tron on nile testnet for testing purposes

## Prerequisites

- [Bun](https://bun.sh/) installed on your system

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/tron-wallet-service.git
   cd tron-wallet-service
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```
   PORT=3000
   FULL_NODE=https://nile.trongrid.io
   MNEMONIC="pottery sorry maple plunge video jar post time diagram clip fiber coil"
   ```

## Running the Service

To start the service, run:

```
bun run index.ts
```

The server will start running on `http://localhost:3000` (or the port specified in your `.env` file).

## Deployment

To deploy this service, you can use a platform that supports Bun applications, such as [Railway](https://railway.app/) or [Fly.io](https://fly.io/). Here are general steps for deployment:

1. Set up an account on your chosen platform.
2. Install the platform's CLI tool if required.
3. Configure your project for deployment (this may involve creating a `Procfile` or similar configuration file).
4. Deploy your application using the platform's deployment commands.

For example, using Railway:

1. Install the Railway CLI: `npm i -g @railway/cli`
2. Login to your Railway account: `railway login`
3. Initialize your project: `railway init`
4. Deploy your project: `railway up`

Always refer to the specific platform's documentation for the most up-to-date deployment instructions.

## API Endpoints

### 1. Create Wallet

- **URL**: `/create-wallet`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "index": number
  }
  ```
- **Response**:
  ```json
  {
    "address": string,
    "privateKey": string
  }
  ```

### 2. Get Parent Wallet

- **URL**: `/parent-wallet`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "address": string
  }
  ```

### 3. Deposit TRX

- **URL**: `/deposit/trx`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "to": string,
    "amount": number
  }
  ```
- **Response**:
  ```json
  {
    "success": boolean,
    "transaction": object
  }
  ```

### 4. Withdraw TRX

- **URL**: `/withdraw/trx`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "to": string,
    "amount": number,
    "fromIndex": number
  }
  ```
- **Response**:
  ```json
  {
    "success": boolean,
    "transaction": object
  }
  ```

### 5. Get Balance

- **URL**: `/balance/:address`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "trx": string
  }
  ```

## Security Considerations

- Ensure that your private keys and mnemonics are securely stored and never exposed.
- Implement proper authentication and authorization mechanisms before deploying this service in a production environment.
- Use HTTPS in production to encrypt data in transit.
- Regularly update dependencies to patch any security vulnerabilities.

## License

[MIT License](LICENSE)