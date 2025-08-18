# SignumLBRI

SignumLBRI is a comprehensive bookshop website designed specifically for school book fairs. The platform aims to provide an efficient and user-friendly solution for selling and managing school books. This README provides an overview of the project, its technologies, and instructions for setting up and running the application.

## Technologies Used

- Node.js
- TypeScript
- Pug.js
- Tailwind CSS
- Webpack
- MongoDB

## Features

- User registration and authentication
- Book listing and search functionality
- Seller management for adding, editing, and removing books
- Seamless stationary checkout process
- Responsive design for optimal user experience across devices

## Getting Started

To get started with SignumLBRI, follow these steps:

1. Clone the repository:

```
git clone https://github.com/PiRifle/SignumLBRI.git
```

2. Install dependencies:

```
cd SignumLBRI
npm install
```

3. Set up the environment variables:

Create a `.env` file in the project root directory and configure the following variables:

```
PORT=3000
MONGODB_URI=<your-mongodb-connection-string>
MAIL_HOST=<your-mail-host>
MAIL_USER=<your-mail-user>
MAIL_PASSWORD=<your-mail-password>
SESSION_SECRET=<your-session-secret>
```

4. Build the application:

```
npm run build
```

5. Start the server:

```
npm start
```

6. Open the application in your browser:

```
http://localhost:3000
```

## Docker Compose

SignumLBRI also provides a Docker Compose file for easy deployment and containerization. To use Docker Compose, make sure you have Docker installed on your machine, and follow these steps:

1. Make sure you are in the project directory.

2. Build and start the containers:

```shell
docker-compose up --build
```

3. Access the application in your browser at `http://localhost:3000`.


## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please feel free to submit a pull request or open an issue in the GitHub repository.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For any inquiries or further information, please reach out to ZSEL Opole at samorzad@elektryk.opole.pl

Let's make book fairs more efficient and enjoyable with SignumLBRI!
