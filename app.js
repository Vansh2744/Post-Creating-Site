const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const userModel = require("./model/user");
const postModel = require("./model/post");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
require("dotenv").config();
const upload = require("./config/multerconfig");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieparser());

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const { name, username, email, password, phone } = req.body;
  const user = await userModel.findOne({ email });
  if (user) {
    res.redirect("/signup");
  } else {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        const user = await userModel.create({
          name,
          username,
          email,
          password: hash,
          phone,
        });
        const token = jwt.sign({ email, id: user._id }, process.env.SECRET_KEY);
        res.cookie("token", token);
        res.redirect("/login");
      });
    });
  }
});

app.get("/login", async (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (user) {
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign(
          { email: user.email, id: user._id },
          process.env.SECRET_KEY
        );
        res.cookie("token", token);
        res.redirect("/");
      } else {
        res.redirect("/login");
      }
    });
  } else {
    res.redirect("/login");
  }
});

const Middleware = (req, res, next) => {
  if (req.cookies.token === "") {
    res.redirect("/login");
  } else {
    const data = jwt.verify(req.cookies.token, process.env.SECRET_KEY);
    req.user = data;
    next();
  }
};

app.get("/", Middleware, async (req, res) => {
  const user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  res.render("index", { user });
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.post("/create", Middleware, async (req, res) => {
  const { text } = req.body;
  const user = await userModel.findOne({ email: req.user.email });
  if (user) {
    const post = await postModel.create({
      content: text,
      user: user._id,
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/");
  } else {
    res.redirect("/");
  }
});

app.get("/like", Middleware, async (req, res) => {
  const post = await postModel.findOne({ _id: req.query.id }).populate("user");
  if (post.like.indexOf(req.user.id) === -1) {
    post.like.push(req.user.id);
    await post.save();
    res.redirect("/");
  } else {
    post.like.splice(post.like.indexOf(req.user.id), 1);
    await post.save();
    res.redirect("/");
  }
});

app.get("/edit", Middleware, async (req, res) => {
  const post = await postModel.findOne({
    _id: req.query.id,
  });
  res.render("update", { post });
});

app.post("/update", async (req, res) => {
  const { text } = req.body;
  await postModel.findOneAndUpdate({ _id: req.query.id }, { content: text });
  res.redirect("/");
});

app.get("/delete", async (req, res) => {
  await postModel.findOneAndDelete({ _id: req.query.id });
  res.redirect("/");
});

app.get("/profile", (req, res) => {
  res.render("profile");
});

app.post("/upload", Middleware, upload.single("image"), async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email });
  user.profilepic = req.file.filename;
  await user.save();
  res.redirect("/");
});

mongoose
  .connect(process.env.MONGO_DB)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`listening to port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
