const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const multer  = require('multer'); // Uploaded file handling
const path = require('path');
// const upload = multer({ dest: 'uploads/' }) ;
let {PythonShell} = require('python-shell')

// variables for future
let name = "";
let mail = "";
let imageName = "profileBackground.png";
let updatedImageName = null;

// Handling Uploads
var Storage = multer.diskStorage({
    destination: "../public/uploads",
    filename:(req,file,cb)=>{
        cb(null, file.fieldname+"_"+Date.now()+path.extname(file.originalname ));
    }
})

var upload = multer({
    storage:Storage
}).single('file');  // here "file" is the same name provided in the name value of the form 


// Set up the mongodb and connect to the cluster

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://ctrlaltconquer:ctrlaltconquer@cluster0.xiam5xr.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

let rasta = path.join(__dirname, "../views");


const app = express();

app.set('views', rasta);
app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("../public"));

app.get("/", function(req, res){
    res.render('index');
});


// LOGIN MODULE

app.get("/login", function(req, res){
    res.render('login');
});

app.post("/login", function(req, res){
    const data = req.body;
    console.log(data);

    const { MongoClient } = require("mongodb");

    // Replace the following with your Atlas connection string
    const url = "mongodb+srv://ctrlaltconquer:ctrlaltconquer@cluster0.xiam5xr.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(url);

    
    // Reference the database to use
    const dbName = "Freeversity";

    async function run() {
        try {
            // Connect to the Atlas cluster
            await client.connect();
            const db = client.db(dbName);

            // Reference the "signup" collection in the specified database
            const col = db.collection("signup");

            // Check if the email already exists

            const user = await col.findOne({
                "Email": data.email,
                "Password": data.password
            });

            
            if (user) {
                // Email already exists, reject signup
                name = user.Fname;
                mail = user.Email;
                imageName = user.Image;
                console.log("Login Successful");
                res.redirect("/userIndex");
                // res.render("userIndex", {name:name, mail:mail, imageName:imageName}); // You can render a rejection page or redirect as needed
            } 
            
            else {
                
                console.log("user name or password wrong");
                res.render("failLogin");
            }
        } catch (err) {
            console.log(err.stack);
        } finally {
            await client.close();
        }
    }

    run().catch(console.dir);
});

app.get("/userIndex", function(req, res){
    res.render("userIndex", {name:name, mail:mail, imageName:imageName});
})


// Sign Up Module

app.get("/signup", function(req, res){
    res.render('signup');
});


app.post("/signup",upload, async function (req, res, next) {
    const data = req.body;
    console.log(data);

  

    const { MongoClient } = require("mongodb");

    // Replace the following with your Atlas connection string
    const url = "mongodb+srv://ctrlaltconquer:ctrlaltconquer@cluster0.xiam5xr.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(url);

    // Reference the database to use
    const dbName = "Freeversity";

    async function run() {
        try {
            // Connect to the Atlas cluster
            await client.connect();
            const db = client.db(dbName);

            // Reference the "signup" collection in the specified database
            const col = db.collection("signup");

            // Check if the email already exists
            const existingUser = await col.findOne({ "Email": data.email });

            if (existingUser) {
                // Email already exists, reject signup
                console.log("User with this email already exists.");
                res.render("signupRejected"); // You can render a rejection page or redirect as needed
            } else {
                // Create a new document
                let personDocument = {
                    "Fname": data.firstName,
                    "Lname": data.lastName,
                    "Email": data.email,
                    "College": data.college,
                    "gradYear": data.gradYear,
                    "contactNumber": data.contactNumber,
                    "Password": data.password,
                    "Image": "profileBackground.png"
                };

                // Insert the document into the specified collection
                const result = await col.insertOne(personDocument);
                console.log("User registered successfully:", result.insertedId);
                res.render("loginSignupSuccessfull");
            }
        } catch (err) {
            console.log(err.stack);
        } finally {
            await client.close();
        }
    }

    await run().catch(console.dir);
});


// Profile Picture

app.post('/upload', upload, function(req, res, next){
    var success = req.file.fieldname+ "Uplaoded Successfully";

    // name and email

    const { MongoClient } = require("mongodb");

    // Replace the following with your Atlas connection string
    const url = "mongodb+srv://ctrlaltconquer:ctrlaltconquer@cluster0.xiam5xr.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(url);

    
    // Reference the database to use
    const dbName = "Freeversity";

    async function run() {
        try {
            // Connect to the Atlas cluster
            await client.connect();
            const db = client.db(dbName);

            // Reference the "signup" collection in the specified database
            const col = db.collection("signup");

            // Check if the email already exists

            const user = await col.findOne({
                "Email": mail,
                "Fname": name
            });

            
            if (user) {
                // Email already exists, reject signup
                imageName = req.file.filename; 
                let id = user._id;

                let filter = { _id: id };

                const update = {
                    $set: {
                      'Image': imageName
                    }
                  };
                const result = await col.updateOne(filter, update);
                
                imageName = await col.findOne({
                    "Email":mail,
                    "Fname":name
                })

                if(imageName){
                    updatedImageName = imageName.Image;
                    // You can render a rejection page or redirect as needed
                    res.render('userIndex', {name:name, mail:mail, imageName:updatedImageName});
                    updatedImageName=null;
                }

                
            } 
            
            else {
                
                console.log("Profile Not Updated");
            }
        } catch (err) {
            console.log(err.stack);
        } finally {
            await client.close();
        }
    }

    run().catch(console.dir);
})




// Learning Path

app.get('/learningpath', function(req, res){
    res.render("LearningPath/personalizedLearningPath", {name:name, mail:mail, imageName:imageName})
})



// Running app on server 3000
app.listen(3000, function(){
    console.log("Server started running on port 3000");
});
