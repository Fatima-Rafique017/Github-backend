const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const uri = process.env.MONGODB_URI;

let client;

async function connectClient() {
  if (!uri) {
    throw new Error("MONGODB_URI is missing in .env file");
  }

  if (!client) {
    client = new MongoClient(uri);
  }

  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
}

// SIGNUP
async function signup(req, res) {
  const { username, password, email } = req.body;

  try {
    if (!username || !password || !email) {
      return res.status(400).json({
        message: "Username, email and password are required!",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !password.trim()) {
      return res.status(400).json({
        message: "Please enter valid details!",
      });
    }

    await connectClient();

    const db = client.db("githubproject");
    const usersCollection = db.collection("users");

    // Check username
    const existingUsername = await usersCollection.findOne({
      username: cleanUsername,
    });

    if (existingUsername) {
      return res.status(400).json({
        message: "Username already exists!",
      });
    }

    // Check email
    const existingEmail = await usersCollection.findOne({
      email: cleanEmail,
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already registered! Please login.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      repositories: [],
      followedUsers: [],
      starRepos: [],
      StarRepos: [],
    };

    const result = await usersCollection.insertOne(newUser);

    // Generate token
    const token = jwt.sign(
      { id: result.insertedId.toString() },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      message: "Signup successful!",
      token,
      userId: result.insertedId.toString(),
    });

  } catch (err) {
    console.error("Error during signup:", err);

    return res.status(500).json({
      message: "Server error during signup!",
      error: err.message,
    });
  }
}

// LOGIN
async function login(req, res) {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required!",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    await connectClient();

    const db = client.db("githubproject");
    const usersCollection = db.collection("users");

    // Find user through email
    const user = await usersCollection.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password!",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password!",
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      userId: user._id.toString(),
    });

  } catch (err) {
    console.error("Error during login:", err);

    return res.status(500).json({
      message: "Server error during login!",
      error: err.message,
    });
  }
}

// GET ALL USERS
async function getAllUsers(req, res) {
  try {
    await connectClient();

    const db = client.db("githubproject");
    const usersCollection = db.collection("users");

    const users = await usersCollection
      .find({})
      .project({ password: 0 })
      .toArray();

    return res.status(200).json(users);

  } catch (err) {
    console.error("Error during fetching users:", err.message);

    return res.status(500).json({
      message: "Server error!",
    });
  }
}

// GET USER PROFILE
async function getUserProfile(req, res) {
  const currentID = req.params.id;

  try {
    if (!ObjectId.isValid(currentID)) {
      return res.status(400).json({
        message: "Invalid User ID!",
      });
    }

    await connectClient();

    const db = client.db("githubproject");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne(
      { _id: new ObjectId(currentID) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found!",
      });
    }

    return res.status(200).json(user);

  } catch (err) {
    console.error("Error during fetching profile:", err.message);

    return res.status(500).json({
      message: "Server error!",
    });
  }
}

// UPDATE USER PROFILE
async function updateUserProfile(req, res) {
  const currentID = req.params.id;
  const { email, password } = req.body;

  try {
    if (!ObjectId.isValid(currentID)) {
      return res.status(400).json({
        message: "Invalid User ID!",
      });
    }

    await connectClient();

    const db = client.db("githubproject");
    const usersCollection = db.collection("users");

    let updateFields = {};

    if (email) {
      updateFields.email = email.trim().toLowerCase();
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(currentID) },
      { $set: updateFields },
      {
        returnDocument: "after",
        projection: { password: 0 },
      }
    );

    if (!result.value) {
      return res.status(404).json({
        message: "User not found!",
      });
    }

    return res.status(200).json(result.value);

  } catch (err) {
    console.error("Error during updating profile:", err.message);

    return res.status(500).json({
      message: "Server error!",
    });
  }
}

// DELETE USER PROFILE
async function deleteUserProfile(req, res) {
  const currentID = req.params.id;

  try {
    if (!ObjectId.isValid(currentID)) {
      return res.status(400).json({
        message: "Invalid User ID!",
      });
    }

    await connectClient();

    const db = client.db("githubproject");
    const usersCollection = db.collection("users");

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(currentID),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "User not found!",
      });
    }

    return res.status(200).json({
      message: "User Profile Deleted!",
    });

  } catch (err) {
    console.error("Error during deleting profile:", err.message);

    return res.status(500).json({
      message: "Server error!",
    });
  }
}

module.exports = {
  getAllUsers,
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};

