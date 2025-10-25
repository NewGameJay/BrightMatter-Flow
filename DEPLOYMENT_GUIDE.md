# 🚀 Deployment Guide - Fly.io

## ✅ **Project Completed and Ready for Deployment**

The Veri x Flow Integration is complete and ready for production deployment. All code has been pushed to GitHub: https://github.com/NewGameJay/BrightMatter-Flow

---

## 📋 **Deployment Checklist**

### **Prerequisites**
- [x] Git repository pushed to GitHub
- [x] Dockerfile created for backend
- [x] Frontend build configuration ready
- [x] Environment variables documented
- [x] TypeScript errors fixed

### **Backend Deployment**
1. **Install Fly CLI** (if not already installed):
   ```bash
   brew install flyctl
   ```

2. **Authenticate with Fly.io**:
   ```bash
   flyctl auth login
   ```

3. **Deploy Backend**:
   ```bash
   cd /path/to/bm-flow
   flyctl deploy --app brightmatter-oracle --dockerfile Dockerfile
   ```

4. **Set Environment Variables**:
   ```bash
   flyctl secrets set --app brightmatter-oracle \
     FLOW_SIGNER_KEY="your_private_key" \
     FLOW_ACCESS_NODE="https://access.mainnet.nodes.onflow.org:9000" \
     ORACLE_ADDRESS="0x14aca78d100d2001"
   ```

5. **Check Deployment Status**:
   ```bash
   flyctl status --app brightmatter-oracle
   flyctl logs --app brightmatter-oracle
   ```

### **Frontend Deployment**
1. **Deploy Frontend** (using Fly.io or other hosting):
   ```bash
   cd app
   npm run build
   # Deploy dist/ folder to hosting service
   ```

2. **Alternative: Deploy to Fly.io Static Hosting**:
   ```bash
   # Create a simple Node.js server for frontend
   cd app
   flyctl launch
   ```

---

## 🔧 **Local Development**

To test the backend locally before deploying:

```bash
cd verifier
npm install
npm run build
npm start
```

The server will start on `http://localhost:3000`

---

## 🌐 **Production URLs**

Once deployed:
- **Backend API**: https://brightmatter-oracle.fly.dev
- **Health Check**: https://brightmatter-oracle.fly.dev/api/health
- **Frontend**: (To be deployed)

---

## 📝 **Environment Variables**

### Required for Backend:
- `FLOW_SIGNER_KEY` - Private key for signing transactions
- `FLOW_ACCESS_NODE` - Flow mainnet access node URL
- `ORACLE_ADDRESS` - Oracle account address
- `PORT` - Server port (default: 3000)

### Required for Frontend:
- `VITE_FLOW_NETWORK` - "mainnet"
- `VITE_CAMPAIGN_ESCROW_ADDRESS` - Contract address
- `VITE_CREATOR_PROFILE_ADDRESS` - Contract address

---

## 🎯 **Next Steps**

1. **Deploy Backend**: Use Fly.io CLI to deploy the backend
2. **Deploy Frontend**: Deploy React app to hosting service
3. **Test End-to-End**: Run complete campaign flow
4. **Monitor**: Set up monitoring and alerting
5. **Scale**: Add more instances as needed

---

## 🆘 **Troubleshooting**

### Deployment Issues
- Check Fly.io authentication: `flyctl auth whoami`
- Verify app exists: `flyctl apps list`
- Check logs: `flyctl logs --app brightmatter-oracle`
- View app status: `flyctl status --app brightmatter-oracle`

### Build Issues
- Clear Docker cache: `docker system prune -a`
- Rebuild locally: `docker build -t brightmatter-oracle .`
- Check package versions in `verifier/package.json`

### Runtime Issues
- Check environment variables: `flyctl secrets list --app brightmatter-oracle`
- View live logs: `flyctl logs --app brightmatter-oracle`
- SSH into machine: `flyctl ssh console --app brightmatter-oracle`

---

## ✅ **Deployment Status**

**Current Status**: Ready for deployment

**Completed**:
- ✅ Code pushed to GitHub
- ✅ Dockerfile created
- ✅ TypeScript errors fixed
- ✅ Package versions updated
- ✅ Configuration files ready

**Pending**:
- ⏳ Fly.io deployment (manual step required)
- ⏳ Frontend deployment
- ⏳ Environment variables configuration
- ⏳ End-to-end testing in production

---

**Ready to deploy when you are!** 🚀
