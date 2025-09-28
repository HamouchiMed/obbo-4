# Obbo Backend API

A comprehensive backend API for the Obbo food waste reduction mobile application.

## Features

- **User Authentication**: JWT-based auth for dealers and clients
- **Basket Management**: Full CRUD operations for food baskets
- **Real-time Updates**: WebSocket support for live updates
- **Image Upload**: Cloudinary integration for basket photos
- **Location Services**: Nearby offers and dealer discovery
- **Order Management**: Complete order lifecycle
- **Search & Filtering**: Advanced search capabilities

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Cloudinary** - Image storage
- **Socket.io** - Real-time communication
- **Multer** - File upload handling

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/obbo
   JWT_SECRET=your_super_secret_jwt_key_here
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or install MongoDB locally
   ```

5. **Run the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Baskets (Dealer)
- `GET /api/baskets` - Get dealer's baskets
- `GET /api/baskets/:id` - Get single basket
- `POST /api/baskets` - Create new basket
- `PUT /api/baskets/:id` - Update basket
- `DELETE /api/baskets/:id` - Delete basket
- `PUT /api/baskets/:id/status` - Update basket status
- `GET /api/baskets/:id/orders` - Get basket orders

### Offers (Client)
- `GET /api/offers` - Get nearby offers
- `GET /api/offers/categories` - Get categories
- `GET /api/offers/featured` - Get featured offers
- `GET /api/offers/search` - Search offers
- `GET /api/offers/:id` - Get offer details

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/orders` - Get user orders
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/nearby-dealers` - Get nearby dealers
- `DELETE /api/users/account` - Delete account

## Data Models

### User
- Authentication and profile information
- Separate fields for clients and dealers
- Location data for nearby searches

### Basket
- Food basket information
- Pricing and availability
- Collection details
- Image management
- Nutritional and dietary information

### Order
- Order management
- Payment tracking
- Communication system
- Rating system

## Real-time Features

The API includes WebSocket support for real-time updates:

- **Basket Created**: Notify clients of new baskets
- **Basket Updated**: Notify clients of basket changes
- **Basket Deleted**: Notify clients of basket removal
- **Status Updates**: Real-time status changes

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **Password Hashing**: bcrypt encryption

## Error Handling

Comprehensive error handling with:
- Validation errors
- Authentication errors
- Database errors
- File upload errors
- Custom error messages

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Environment Variables
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `CLOUDINARY_*` - Cloudinary configuration
- `CORS_ORIGIN` - Allowed CORS origin

## Deployment

1. **Set up production environment variables**
2. **Configure MongoDB Atlas or production database**
3. **Set up Cloudinary account**
4. **Deploy to your preferred platform** (Heroku, AWS, DigitalOcean, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

