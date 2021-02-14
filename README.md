# viciNITY
An app for users to discover best travel destinations in their vicinity

## MASTER BRANCH
### Installation
1. Clone the repository
2. Run `git pull origin master`
3. Run `npm install` in the terminal to install all related dependencies
4. Create "config" folder in root directory and ".env" file inside "config" folder
5. Insert `MONGODB_URL=mongodb+srv://vicinity2k21:<password>@vicinity.dzdde.mongodb.net/test?retryWrites=true&w=majority` in ".env" file. Also, replace **password** with actual password
6. Add `FLICKR_API_KEY`, `EMAIL` and `PASS` in ".env" file
7. Run `npm start` or `npm run dev` in the terminal

### Routes
- GET route to homepage  `/`
- POST route for searching matches by entering URL of preferred image and selecting state  `/searchbyurl`
- POST route for searching matches by uploading preferred image and selecting state  `/searchbyimage`
- POST route for searching matches from all over India by uploading preferred image  `/searchGlobal`
- POST route for sending feedback  `/send`
