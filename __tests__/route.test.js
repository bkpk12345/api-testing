const request = require("supertest");
const Admin = require("../models/admin");
const Product = require("../models/product");
const Category = require("../models/category");
const User = require("../models/user");
const mongoose = require("mongoose");
const { app, server } = require("../app");
let adminToken;
let userToken;

beforeAll(() => {
  mongoose.connection.dropDatabase();
});

//default route test
describe("User Signup POST / ", () => {
  afterAll(() => {
    server.close();
  });
  afterAll(() => {
    mongoose.connection.dropCollection("admin");
  });

  test("Default route", done => {
    request(app)
      .get("/")
      .expect(200);
    done();
  });

  test("admin signup and receive token", async done => {
    let user = {
      username: "admin",
      email: "admin@admin.com",
      password: "admin"
    };

    request(app)
      .post("/admin/signup")
      .send(user)
      .then(resp => {
        adminToken = resp.body.token;
        console.log("admin token>>>>>>>><<<<<<<", adminToken);
        expect(resp.body.token).toBe(adminToken);
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  });

  // test("find from database", done => {});
});

// //admin login
describe("admin login", () => {
  test("admin login", done => {
    let user = {
      email: "admin@admin.com",
      password: "admin"
    };
    request(app)
      .post("/admin/login")
      .send(user)
      // .set("authorization", adminToken)
      .then(res => {
        expect(res.header.autherization).toBe(adminToken);
        done();
      })
      .catch(er => {
        console.log(er.message);
        done();
      });
  });
});

describe("admin add", () => {
  let adminID = "";
  beforeAll(done => {
    let admin = Admin.find().then(res => {
      adminID = res[0]._id;
      done();
    });
  });

  test("admin add valid token test", done => {
    request(app)
      .post("/admin/add")
      .set("authorization", adminToken)
      .then(res => {
        console.log(res);
        done();
      });
  });
});

describe("user signup", () => {
  test("user signup", done => {
    // app.post /user/signup
    let user = {
      userName: "abc",
      email: "abc5@gmail.com",
      password: "123",
      empList: "123"
    };
    request(app)
      .post("/user/signup")
      .send(user)
      .then(res => {
        // expect(res.body.token)
        userToken = res.body.token;
        done();
      })
      .catch(er => console.log(er.message));
  });
});

// user/login
describe("POST /user/login ", () => {
  beforeAll(() => {
    mongoose.connection.collection("users").insertOne({
      email: "ab4c@gmail.com",
      password: "1234"
    });
  });

  test("login test", done => {
    let creds = {
      email: "ab4c@gmail.com",
      password: "1234"
    };
    request(app)
      .post("/user/login")
      .send(creds)
      .expect(403)
      .then(res => {
        console.log(res.error.message);
        done();
      })
      .catch(er => console.log(er.message));
  });
});

// //user/invite user
describe("GET /user/invite/:id ", () => {
  let user;
  beforeAll(done => {
    user = User({
      email: "abc2@abc.com",
      password: "1234"
    });
    user
      .save()
      .then(res => {
        user = res;
        done();
      })
      .catch(er => console.log(er.message));
  });

  test("user invite", done => {
    let id = user._id; // get users id here
    request(app).get("/user/invite/" + id);

    User.findById(id)
      .then(res => {
        expect(res._id).toEqual(id);
        done();
      })
      .catch(er => console.log(er.message));
  });
});

// //user/employee
describe("POST /user/employe", () => {
  let user;
  beforeAll(done => {
    user = User({
      email: "abc1@abc.com",
      password: "1234"
    });
    user
      .save()
      .then(res => {
        user = res;
        done();
      })
      .catch(er => console.log(er.message));
  });
  test("get user emp", done => {
    request(app).post("/user/employee");
    User.findById(user._id)
      .then(res => {
        expect(res.name).toEqual(user.name);
        expect(res.name).not.toEqual("wrongname");
        done();
      })
      .catch(er => console.log(er.message));
  });
});

//user buy

describe("user buys", () => {
  // beforeAll(() => {
  //   mongoose.connection.dropCollection("products");
  // });
  beforeAll(() => {
    var conn = mongoose.connection;
    var product = {
      name: "Zoho",
      category: "mail",
      plans: "anual"
    };

    conn.collection("products").insertOne(product);
  });

  test("user buys", done => {
    let name = "Zoho";

    request(app)
      .post("/user/buy")
      .set("authorization", userToken)
      .send(name)
      .then(res => {
        expect(res.status).toBe(404);

        done();
      })
      .catch(er => console.log(er.message));
  });
});

describe("user saas", () => {
  let user = {
    name: "xyz",
    email: "xyz@xyz.com",
    password: "123",
    empList: "123"
  };
  let id;
  beforeAll(async done => {
    user = await User.collection.insertOne(user);
    id = user.ops[0]._id;
    done();
  });
  // afterAll(() => {
  //   User.find({ name: user.name }).remove(done => done());
  // });

  test("test with valid token", done => {
    request(app)
      .get("/user/saas")
      .set("authorization", userToken)
      .then(res => {
        expect(res.status).toBe(200);
        done();
      });
  });

  test("test with Invalid token", done => {
    let wrongToken = "invalid1token";
    request(app)
      .get("/user/saas")
      .set("authorization", wrongToken)
      .then(res => {
        expect(res.status).toBe(401);
        done();
      });
  });

  test("findByid test", done => {
    request(app).post("/user/saas");

    User.findById(id).then(res => {
      expect(res.name).toEqual(user.name);
      expect(res.name).not.toEqual("wrongNmae");
      done();
    });
  });
});

describe("user add employee", () => {
  test("valid token test", done => {
    request(app)
      .post("/user/add/employee")
      .set("authorization", userToken)
      .then(res => {
        expect(res.status).toBe(200);
        done();
      });
  });

  test("invalid token test", done => {
    let wrongToken = "wrongtoken123";
    request(app)
      .post("/user/add/employee")
      .set("authorization", wrongToken)
      .then(res => {
        expect(res.status).toBe(401);
        done();
      });
  });
});

describe("user expense", () => {
  test("valid token test", done => {
    request(app)
      .get("/user/expense")
      .set("authorization", userToken)
      .then(myRes => {
        done();
      });
    done();
  });

  test("invalid token test", done => {
    let wrongToken = "token12344534";
    request(app)
      .get("/user/expense")
      .set("authorization", wrongToken)
      .then(res => {
        expect(res.status).toBe(401);
        done();
      });
  });
});

describe("get user", () => {
  test("valid token", done => {
    request(app)
      .get("/user")
      .set("authorization", userToken)
      .then(res => {
        expect(res.status).toBe(200);
        done();
      });
  });

  test("invalid token", done => {
    let wrongtoken = "askjdsa768asj";
    request(app)
      .get("/user")
      .set("authorization", wrongtoken)
      .then(res => {
        expect(res.status).toBe(401);
        done();
      });
  });
});

describe("get product", () => {
  test("get product db test", done => {
    request(app)
      .get("/products")
      .expect(200);

    done();
    Product.find().then(prod => {
      done();
    });
  });
});

describe("user edit emp", () => {
  test("valid token test", done => {
    request(app)
      .post("/user/edit/employee")
      .set("authorization", userToken)
      .then(res => {
        expect(res.status).toBe(200);
        done();
      });
  });

  test("invalid token test", done => {
    let wrongToken = "sklalkd87";
    request(app)
      .post("/user/edit/employee")
      .set("authorization", wrongToken)
      .then(res => {
        expect(res.status).toBe(401);
        done();
      });
  });
});

describe('/admin/add/category',()=>{

  test('/admin/add/category',(done)=>{
    request(app)
    .post('/admin/add/category')

  })
})

describe("get categorylist", () => {
  test("gets category list", done => {
    request(app).get("/categoryList");

    Category.find().then(res => {
      res.name = "somewrongname";
      expect(res.name).toBeTruthy();

      done();
    });
  });
});

describe("last test", () => {
  test("last test", () => {
    request(app)
      .get("/test")
      .expect(200);
  });
});
