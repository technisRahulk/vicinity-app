// The main route (not in play currently)
router.post("/searchGlobal", upload.single('file1'), async (req, response) => {
    var state_, url_, district_, county_, city_, locality_;
    const tempPath = req.file.originalname;
    var uploadPath = __dirname + `./../../public/uploads/` + tempPath

    await imgur.uploadFile(uploadPath)
        .then(function (json) {
            url = json.data.link
        })
        .then(() => {
            fs.unlinkSync(uploadPath)
            console.log("Deleted file: " + uploadPath)
        })
        .catch(err => {
            console.log(err)
            return response.send('error', { err })
        })

    if (req.body.lat && req.body.long) {
        var lat_ = req.body.lat, long_ = req.body.long;

        var x;
        try {
            x = await city(lat_, long_);
        } catch (err) {
            response.render('error', { err })
        }

        state_ = x.State;
        district_ = x.District;
        county_ = x.County;
        town_ = x.town;
        city_ = x.city;
        locality_ = x.locality;

    } else {
        state_ = req.body.state;
        district_ = req.body.district;
    }



    async function cb(globalArr) {
        const customDistComparator = (a, b) => {
            return a.dist - b.dist;
        }
        var finalAns = [];
        let myMap = new Map();
        var temp = [];
        finalAns.push(globalArr[0]);
        for (i = 0; i < globalArr[0].length; i++) {
            myMap.set(globalArr[0][i].url, 1);
        }
        for (i = 0; i < globalArr[1].length; i++) {
            if (myMap.has(globalArr[1][i].url)) {
                continue;
            }
            else temp.push(globalArr[1][i]);
        }
        finalAns.push(temp);
        temp = [];
        myMap.clear();
        for (i = 0; i < globalArr[1].length; i++) {
            myMap.set(globalArr[1][i].url, 1);
        }
        for (i = 0; i < globalArr[2].length; i++) {
            if (myMap.has(globalArr[2][i].url)) {
                continue;
            }
            else temp.push(globalArr[2][i]);
        }
        finalAns.push(temp);
        temp = [];
        myMap.clear();
        for (i = 0; i < globalArr[2].length; i++) {
            myMap.set(globalArr[2][i].url, 1);
        }
        for (i = 0; i < globalArr[3].length; i++) {
            if (myMap.has(globalArr[3][i].url)) {
                continue;
            }
            else temp.push(globalArr[3][i]);
        }
        finalAns.push(temp);
        for (i = 0; i < finalAns.length; i++) finalAns[i].sort(customDistComparator);
        var res = []
        response.render('index', { finalAns, res, url, state_ });
    }

    trackData(state_.toLowerCase(), district_, url, cb);
})