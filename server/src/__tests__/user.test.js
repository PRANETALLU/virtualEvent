const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index"); 
const User = require("../models/User");

describe("User API Tests", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    await User.deleteMany(); // Cleanup users after each test
  });

  afterAll(async () => {
    await mongoose.connection.close(); // Close DB connection
  });

  test("✅ Should create a new user", async () => {
    const res = await request(app).post("/user/signup").send({
      username: "JohnDoe",
      email: "johndoe@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("email", "johndoe@example.com");
  });

  test("❌ Should not create a user with an existing email", async () => {
    await User.create({
      usernameame: "JohnDoe",
      email: "johndoe@example.com",
      password: "password123" // Hash password before saving
    });

    const res = await request(app).post("/user/signup").send({
      name: "Jane Doe",
      email: "johndoe@example.com",
      password: "password456",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("✅ Should log in an existing user", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await User.create({
      name: "John Doe",
      email: "johndoe@example.com",
      password: hashedPassword,
    });

    const res = await request(app).post("/user/login").send({
      email: "johndoe@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  test("❌ Should not log in with incorrect password", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await User.create({
      name: "John Doe",
      email: "johndoe@example.com",
      password: hashedPassword,
    });

    const res = await request(app).post("/user/login").send({
      email: "johndoe@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  test("✅ Should retrieve user profile when authenticated", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await User.create({
      name: "John Doe",
      email: "johndoe@example.com",
      password: hashedPassword,
    });

    const loginRes = await request(app).post("/user/login").send({
      email: "johndoe@example.com",
      password: "password123",
    });

    const token = loginRes.body.token;

    const res = await request(app)
      .get(`/user/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email", "johndoe@example.com");
  });

  test("❌ Should not retrieve profile without authentication", async () => {
    const user = await User.create({
      name: "John Doe",
      email: "johndoe@example.com",
      password: await bcrypt.hash("password123", 10),
    });

    const res = await request(app).get(`/user/${user._id}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });
});
