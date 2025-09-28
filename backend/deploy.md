# Deploy Obbo Backend Online

## 🚀 Quick Deployment Options

### Option 1: Railway (Recommended)
1. **Sign up**: Go to [railway.app](https://railway.app)
2. **Connect GitHub**: Link your repository
3. **Deploy**: Select the `backend` folder
4. **Add MongoDB**: Use Railway's MongoDB service
5. **Set Environment Variables**:
   ```
   MONGODB_URI=your_railway_mongodb_url
   JWT_SECRET=your_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

### Option 2: Render
1. **Sign up**: Go to [render.com](https://render.com)
2. **New Web Service**: Connect GitHub
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment Variables**: Add all required vars

### Option 3: Vercel
1. **Sign up**: Go to [vercel.com](https://vercel.com)
2. **Import Project**: Connect GitHub
3. **Root Directory**: Set to `backend`
4. **Environment Variables**: Add all required vars

### Option 4: Heroku
1. **Install Heroku CLI**: Download from [heroku.com](https://heroku.com)
2. **Login**: `heroku login`
3. **Create App**: `heroku create your-app-name`
4. **Add MongoDB**: `heroku addons:create mongolab:sandbox`
5. **Deploy**: `git push heroku main`

## 🔧 Environment Variables Needed

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/obbo
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📱 Frontend Integration

Once deployed, update your React Native app to use the online backend:

```javascript
// In your React Native app
const API_BASE_URL = 'https://your-backend-url.railway.app/api';
// or
const API_BASE_URL = 'https://your-backend-url.onrender.com/api';
// or
const API_BASE_URL = 'https://your-backend-url.vercel.app/api';
```

## 🗄️ Database Setup

### MongoDB Atlas (Free)
1. **Sign up**: Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create Cluster**: Free tier available
3. **Get Connection String**: Copy the MongoDB URI
4. **Update Environment**: Use the Atlas URI in your deployment

### Railway MongoDB
1. **Add Service**: In Railway dashboard
2. **Select MongoDB**: Choose the database service
3. **Get Connection String**: Copy from Railway dashboard
4. **Update Environment**: Use the Railway MongoDB URI

## 🔒 Security Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure CORS_ORIGIN
- [ ] Use HTTPS (automatic on most platforms)
- [ ] Set up rate limiting
- [ ] Configure Cloudinary security

## 📊 Monitoring

Most platforms provide:
- **Logs**: View application logs
- **Metrics**: CPU, memory usage
- **Uptime**: Service availability
- **Errors**: Error tracking

## 🚀 After Deployment

1. **Test API**: Use Postman or curl
2. **Check Logs**: Monitor for errors
3. **Update Frontend**: Point to new backend URL
4. **Test Integration**: Verify all features work

## 🔧 Troubleshooting

### Common Issues:
- **Port**: Use `process.env.PORT || 5000`
- **CORS**: Set correct CORS_ORIGIN
- **Database**: Check MongoDB connection string
- **Environment**: Verify all variables are set

### Debug Commands:
```bash
# Check if server starts locally
npm start

# Test database connection
node -e "require('./models/User'); console.log('DB connected')"

# Check environment variables
node -e "console.log(process.env)"
```

