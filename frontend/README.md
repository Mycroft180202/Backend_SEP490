# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Docker workflow

The frontend can be containerized with the provided `Dockerfile`. Build the production image and pass any API overrides as `--build-arg` values:

```bash
docker build -t g90-frontend 
  --build-arg REACT_APP_API_BASE_URL=https://hoalachandicraft-fmbmfmfcehdyeqgz.eastasia-01.azurewebsites.net
  --build-arg REACT_APP_API_TIMEOUT=30000 
  .
```

Run the container with Nginx serving the compiled bundle on port 80:

```bash
docker run --rm -p 8080:80 g90-frontend
```

> The `.env` file supplies defaults for local development. Only variables prefixed with `REACT_APP_` are baked into the bundle, so they must be provided before `docker build` if you need values other than those committed in `.env`.

### Push to Azure Container Registry (ACR)

1. Login and create the registry if needed:
   ```bash
   az login
   az acr create --resource-group <rg-name> --name <acr-name> --sku Basic
   az acr login --name <acr-name>
   ```
2. Tag and push the image:
   ```bash
   docker tag g90-frontend <acr-name>.azurecr.io/g90-frontend:latest
   docker push <acr-name>.azurecr.io/g90-frontend:latest
   ```

### Deploy to Azure Web App for Containers

1. Ensure an App Service plan exists (Linux, e.g. `B1`):
   ```bash
   az appservice plan create \
     --name <plan-name> \
     --resource-group <rg-name> \
     --is-linux \
     --sku B1
   ```
2. Create or update the Web App to consume the pushed image:
   ```bash
   az webapp create \
     --resource-group <rg-name> \
     --plan <plan-name> \
     --name <webapp-name> \
     --deployment-container-image-name <acr-name>.azurecr.io/g90-frontend:latest
   ```
3. Allow the Web App to pull from ACR (managed identity is recommended):
   ```bash
   az webapp identity assign --name <webapp-name> --resource-group <rg-name>
   PRINCIPAL_ID=$(az webapp identity show --name <webapp-name> --resource-group <rg-name> --query principalId -o tsv)
   az role assignment create \
     --assignee $PRINCIPAL_ID \
     --scope $(az acr show --name <acr-name> --resource-group <rg-name> --query id -o tsv) \
     --role "AcrPull"
   ```
4. Configure startup settings or environment variables as needed:
   ```bash
   az webapp config appsettings set \
     --name <webapp-name> \
     --resource-group <rg-name> \
     --settings WEBSITES_PORT=80
   az webapp config container set \
     --name <webapp-name> \
     --resource-group <rg-name> \
     --docker-custom-image-name <acr-name>.azurecr.io/g90-frontend:latest
   ```

After the container starts, the site is served via the Web App’s public URL on the default HTTP/HTTPS ports while proxying requests to port `80` inside the container.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
