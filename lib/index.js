import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import unzip from "unzip";
import childProcess from "child_process";

const fs = require('fs-extra');
const app = express();
const upload = multer({
    dest: ".uploads/",
    limits: {fileSize: 10 * 1024 * 1024},
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "application/zip" && file.mimetype !== "application/octet-stream") {
            cb(new Error("Only accept zip or octet-stream bundle"), false);
        } else {
            cb(null, true);
        }
    }
});

app.use(bodyParser.json({limit: "10mb"}));
app.use(bodyParser.urlencoded({
    extended: false,
    limit: "10mb"
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/", (req, res) => res.send("Hello World!"));

app.post("/upload", upload.single("bundle"), (req, res, next) => {
    let extractPath = `.tmp/${req.file.filename}`;
    // extract file
    let extractStream = unzip.Extract({path: extractPath});
    extractStream.on("close", function () {
        fs.unlink(`.uploads/${req.file.filename}`);
        let configFilePath = `${extractPath}/app.json`;
        // try to find app.json
        fs.exists(configFilePath, function (exists) {
            if (exists) {
                // read app.json
                fs.readFile(configFilePath, "utf8", function (err, data) {
                    if (err) {
                        fs.removeSync(extractPath);
                        next(err);
                    } else {
                        let appConfig = JSON.parse(data);
                        let mainCppPath = `${extractPath}/${appConfig.main}`;
                        // compile main entry file to app.wast
                        childProcess.exec(`gxbcpp -o ${extractPath}/app.wast ${mainCppPath}`, function (err, stdout, stderr) {
                            if (err) {
                                fs.removeSync(extractPath);
                                res.send({
                                    status: "error",
                                    stdout: `${stdout}`,
                                    stderr: `${stderr}`
                                });
                            } else {
                                let _stdout = stdout;
                                let _stderr = stderr;
                                // compile main entry file to app.abi
                                childProcess.exec(`gxbcpp -g ${extractPath}/app.abi ${mainCppPath}`, function (err, stdout, stderr) {
                                    if (err) {
                                        res.send({
                                            status: "error",
                                            stdout: `${_stdout}\n${stdout}`,
                                            stderr: `${_stderr}\n${stderr}`
                                        });
                                    } else {
                                        res.send({
                                            status: "success",
                                            abi: fs.readFileSync(`${extractPath}/app.abi`, "utf8"),
                                            wast: fs.readFileSync(`${extractPath}/app.wast`, "utf8"),
                                            wasm: fs.readFileSync(`${extractPath}/app.wasm`, "hex"),
                                            stdout: `${_stdout}\n${stdout}`,
                                            stderr: `${_stderr}\n${stderr}`
                                        });
                                    }
                                    fs.removeSync(extractPath);
                                });
                            }
                        });
                    }
                });
            } else {
                next(new Error(`file not exists: ${extractPath}/app.json`));
            }
        });
    });
    fs.createReadStream(req.file.path).pipe(extractStream);
});


app.use(function (req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

if (app.get("env") === "development") {
    app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err.stack
        });
    });
} else {
    app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
        res.status(err.status || 500);
        res.send({
            message: err.message
        });
    });
}

let port = process.env.PORT || 3000;
app.listen(port, () => console.log("Example app listening on port ", port));
