require("dotenv").config();
const { Pool } = require("pg");
const express = require("express");
const app = express();
const port = 3000;

// Clears uploadfolder from images when users are created
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);

// Creates object of files and textcontent
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });

const { uploadFile, getFileStream, deleteFile, getAllFiles } = require("./s3");

app.use(express.static("public"));
app.use(express.json());

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
})

app.get("/users/:key", (req, res) => {
    const key = req.params.key;
    const readStream = getFileStream(key);

    readStream.pipe(res);
});

app.get("/users", (req, res) => {
    pool.query('SELECT * FROM users ORDER BY id', (error, results) => {
        if (error) {
            console.error('Error executing query', error);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            const users = results.rows;
            res.status(200).json({ info: users });
        }
    })
})

// Check if server crashes before giving acces keayes and that is why access denied

app.post('/createuser', upload.single("file-input"), async (req, res) => {
    const { username, email, full_name, lastId } = req.body;
    let firstPartQuery = 'INSERT INTO users (username, email, full_name';
    let secondPartQuery = `) VALUES ('${username}', '${email}', '${full_name}'`;
    let result = "";
    if (req.file) {
        result = await uploadFile(req.file);
        await unlinkFile(req.file.path)
        firstPartQuery += `, profile_picture${secondPartQuery}, '${result.Key}');`;
    } else {
        firstPartQuery += `${secondPartQuery});`
    }
    pool.query(firstPartQuery, (error, results) => {
        if (error) {
            console.error(`Error creating user: ${req.body.name}`, error);
        } else {
            res.status(200).json({
                imagePath: req.file ? `/users/${result.Key}` : null,
                user: {
                    username: username,
                    email: email,
                    full_name: full_name,
                    id: lastId,
                    profile_picture: result.Key ? result.Key : null
                }
            })
        }
    })
});

app.put("/updateuser/:id", upload.single("file-input"), async (req, res) => {
    const id = req.params.id;
    const { username, email, full_name, currentImage, fileToDelete } = req.body;
    let fileToSendBack = null;
    let updateQuery = 'UPDATE users SET username = CASE WHEN $1 <> username THEN $1 ELSE username END, email = CASE WHEN $2 <> email THEN $2 ELSE email END, full_name = CASE WHEN $3 <> full_name THEN $3 ELSE full_name END';
    const queryRowId = ' WHERE id = $4;';
    let values = [username, email, full_name, id];

    if (fileToDelete.length > 5 && !req.file) {
        await deleteFile(fileToDelete);
        values.push(null);
        updateQuery += ', profile_picture = $5';
        fileToSendBack = "deleted"
    }

    if (req.file) {
        const result = await uploadFile(req.file);
        await unlinkFile(req.file.path)
        values.push(result.Key)
        updateQuery += `, profile_picture = $5`
        if(currentImage != undefined && req.file) {
            await deleteFile(currentImage)
        }
        fileToSendBack = result.Key;
    }
    updateQuery += queryRowId

    pool.query(updateQuery, values, (error, results) => {
        if (error) {
            console.error('Error executing query', error);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.status(200).json({user: {
                username: username,
                email: email,
                full_name: full_name,
                id: id,
                file: fileToSendBack,
                isImageNew: !!req.file
            }})
        }
    });
})

app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
})