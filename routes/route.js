// MODELS
const User = require("../models/user");
const Admin = require("../models/admin");
const Product = require("../models/product");
const Category = require("../models/category");

// CORE LIBRARIES
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const moment = require("moment");
const { ObjectId } = require("mongodb");

// AUTHENTICATION
const { authenticate } = require("../middleware/auth");

module.exports = app => {
  app.get("/", (req, res) => {
    res.status(200).send("Home directory");
  });

  // ADMIN SIGNUP
  app.post("/admin/signup", (req, res) => {
    console.log(
      req.body.username + " " + req.body.email + " " + req.body.password
    );

    const admin = new Admin({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    });

    Admin.find({})
      .then(doc => {
        if (doc.length > 0)
          return res.status(400).send("Admin is Already Exist!");

        admin
          .save()
          .then(user => {
            const token = jwt.sign(
              {
                id: user._id
              },
              "secretkey"
            );
            res.send({
              token,
              success: true
            });
          })
          .catch(e => res.status(403).send(e));
      })
      .catch(e => res.status(407).send(e));
  });

  // ADMIN LOGIN
  app.post("/admin/login", (req, res) => {
       const { email, password } = req.body;
    Admin.findByCredentials(email, password)
      .then(user => {
        const token = jwt.sign(
          {
            id: user._id
          },
          "secretkey"
        );
        res.header("autherization", token).send(user);
      })
      .catch(e => {
        res.status(400).send(e);
      });
  });

  // ADD PRODUCT
  app.post("/admin/add", authenticate, (req, res) => {
    var id = req.id;

    if (!ObjectId.isValid(id)) {
      return res.status(404).send();
    }

    Admin.findById(id)
      .then(doc => {
        if (!doc) return res.status(401).send("Unautherized..");

        var product = new Product({
          name: req.body.name,
          category: req.body.category,
          plans: req.body.plans
        });

        product
          .save()
          .then(list => {
            res.send(`${list.name} Product added Successfully`);
          })
          .catch(e => res.status(400).send(e));
      })
      .catch(e => res.status(401).send(e));
  });

  // USER SIGNUP
  app.post("/user/signup", (req, res) => {
    console.log("user/signup", req.body);
    const newUser = new User({
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password,
      empList: req.body.empList
    });

    newUser
      .save()
      .then(user => {
        if (!user) {
          return res.status(404).send("User Not Found");
        }
        console.log(user._id);
        const token = jwt.sign(
          {
            id: user._id
          },
          "secretkey"
        );
        res.send({ token });
        // res.header('autherization', token).send(user)
      })
      .catch(e => res.status(400).send(e));
  });

  // USER LOGIN
  app.post("/user/login", (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    User.findByCredentials(email, password)
      .then(user => {
        if (!user) {
          return res.status(400).send("Not Found");
        }
        const token = jwt.sign(
          {
            id: user._id
          },
          "secretkey"
        );
        res.send({ user, token });
        // res.header('autherization', token).send(user)
      })
      .catch(err => res.status(403).send(err));
  });

  app.get("/user/invite/:id", (req, res) => {
    // const id = req.id;
    const id = req.params.id;
    var name = "";

    if (!ObjectId.isValid(id)) {
      return res.status(404).send();
    }

    User.findById(id, (err, user) => {
      if (!user) {
        return res.status(404).send("No User Found");
      }
      name = user.userName;
      res.render("invite.hbs", {
        invitationFrom: name,
        id
      });
    });
  });
  // hbs form method POST.
  app.post("/user/employee", (req, res) => {
    User.findById({
      _id: req.body.creator
    })
      .then(user => {
        const isValid = user.empList.includes(req.body.email);

        if (isValid) {
          user.employees.push({
            name: req.body.empName,
            email: req.body.email,
            _creator: req.body.creator
          });

          user
            .save()
            .then(emp => {
              res.send("Invitation Accepted");
            })
            .catch(err => res.status(403).send(err));
        } else {
          res.status(404).send("Employee Not Valid");
        }
      })
      .catch(err => res.status(404).send("User Not Found"));
  });

  app.post("/user/buy", authenticate, (req, res) => {
    const id = req.id;
    let isBought = null;
    Product.findOne({
      name: req.body.saasName
    })
      .then(product => {
        if (!product) {
          res.status(404).send("Product Not Available");
        } else {
          User.findById(id)
            .then(user => {
              const newSaaS = {
                category: req.body.category,
                name: req.body.saasName,
                plan: req.body.plan,
                date: moment().format("MM/DD/YYYY")
              };

              if (user.SaaS.length > 0) {
                isBought = user.SaaS.filter(
                  saas => saas.name == req.body.saasName
                );
                if (isBought.length) {
                  return res
                    .status(403)
                    .send("You Already bought this Product");
                }
              }
              if (user.SaaS.length < 1 || !isBought.length) {
                user.SaaS.push(newSaaS);
                user
                  .save()
                  .then(doc => {
                    res.send(`Congrat's You buy a Product.`);
                  })
                  .catch(err => res.status(400).send(err));
              }
            })
            .catch(e => res.status(400).send(e));
        }
      })
      .catch(err => res.status(403).send(err));
  });

  app.get("/user/saas", authenticate, (req, res) => {
    const id = req.id;
    User.findById(id).then(
      user => {
        if (user.SaaS.length > 0) {
          return res.send(user.SaaS);
        }
        res.send("You Didn't Buy Anything Yet!");
      },
      e => res.status(400).send(e)
    );
  });

  //

  // ADDING EMPLOYEES TO THE PRODUCT....
  // NOTE: ONLY THE INVITED ONES....
  app.post("/user/add/employee", authenticate, (req, res) => {
    const id = req.id;
    const { product, employee } = req.body;

    User.findById(id)
      .then(user => {
        // const isInvited = user.employees.name.includes(employee)
        const isInvited = user.employees.filter(emp =>
          emp.name.includes(employee)
        );
        console.log(isInvited);
        // Product.findOne({
        //     name: product
        //   }).then((p) => {
        //     if (!p)
        //       return res.status(403).send("Product is Not Available..")
        //   })
        //   .catch((err) => res.status(400).send(err))

        if (!isInvited) {
          return res.status(403).send("Invite Him First.");
        }
        // User.updateOne(id, {$push:{SaaS.employeeList:[employee]}})

        user.SaaS.forEach(saas => {
          if (saas.name === product) {
            if (saas.plan.limit < saas.employeeList.length) {
              saas.employeeList.push(employee);
            } else {
              return res.send(`Limit Exceeds! Current Plan: ${sass}`); // plans details
            }
          }
        });

        user
          .save()
          .then(e => {
            res.send("Employee Added To the Product.");
          })
          .catch(err => res.status(403).send(err));
      })
      .catch(err => res.status(400).send(err));
  });

  //  CALCULATING COST FOR EACH USER.
  app.get("/user/expense", authenticate, (req, res) => {
    User.findById(req.id)
      .then(user => {
        if (user.SaaS.length > 0) {
          var total = null;
          user.SaaS.forEach(saas => {
            total = total + parseFloat(saas.plan.cost);
          });
          res.send(total);
        }

        // res.send({ total: 00 });
      })
      .catch(e => res.status(400).send(e));
  });
  //TESTING....
  app.get("/user", authenticate, (req, res) => {
    User.findOne({ _id: req.id })
      .then(user => {
        res.send(user);
      })
      .catch(e => res.send(e));
  });

  app.get("/products", (req, res) => {
    Product.find({}).then(product => {
      if (!product) {
        return res.status(403).send("No Products are Available");
      }
      res.send(product);
    });
  });
  app.post("/user/edit/employee", authenticate, (req, res) => {
    const id = req.id;
    User.findOneAndUpdate(
      id,
      { $set: { empList: req.body.empList } },
      { new: true }
    )
      .then(user => {
        console.log("uuuusr", user);
        if (!user) {
          res.status(403).send("User Not Found");
        }
        res.send(user);
      })
      .catch(err => res.status(400).send("Can't update the user..."));
  });

  app.post("/admin/add/category", (req, res) => {
    const newList = new Category({
      name: req.body.list
    });
    newList
      .save()
      .then(list => {
        if (!list) {
          res.status(403).send("No List Found");
        }
        res.send(list);
      })
      .catch(err => res.status(400).send(err));
  });

  app.get("/categoryList", (req, res) => {
    Category.find({}).then(product => {
      if (!product) {
        return res.status(403).send("No Item Found");
      }
      res.send(product);
    });
  });

  app.get("/test", (req, res) => {
    const id = req.query.message;
    res.send(typeof id);
  });
};
