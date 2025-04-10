const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app"); 
const Event = require("../models/Event");
const User = require("../models/User");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

let mongoServer;
let token;
let user;
let event;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });

    user = await User.create({
        username: "testuser",
        email: "test@example.com",
        password: "testpassword",
    });

    token = jwt.sign({ id: user._id }, process.env.SECRET_KEY || "testsecret", { expiresIn: "1h" });

    event = await Event.create({
        title: "Test Event",
        description: "A test event",
        dateTime: new Date(),
        venue: "Online",
        price: 10,
        category: "Tech",
        organizer: user._id,
        attendees: [user._id],
    });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("Event Controller", () => {
    it("Should create an event", async () => {
        const res = await request(app)
            .post("/events/create")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "New Event",
                description: "This is a new event",
                dateTime: new Date(),
                venue: "Virtual",
                price: 0,
                category: "Education",
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("message", "Event created successfully");
        expect(res.body.event).toHaveProperty("title", "New Event");
    });

    it("Should get all events", async () => {
        const res = await request(app).get("/events");

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it("Should get an event by ID", async () => {
        const res = await request(app).get(`/events/${event._id}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe("Test Event");
    });

    it("Should update an event", async () => {
        const res = await request(app)
            .put(`/events/${event._id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Updated Event Title" });

        expect(res.statusCode).toBe(200);
        expect(res.body.event.title).toBe("Updated Event Title");
    });

    it("Should delete an event", async () => {
        const res = await request(app)
            .delete(`/events/${event._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Event deleted successfully");
    });

    it("Should add an attendee to an event", async () => {
        const newEvent = await Event.create({
            title: "Joinable Event",
            description: "An event for testing attendee addition",
            dateTime: new Date(),
            venue: "Online",
            price: 0,
            category: "Tech",
            organizer: user._id,
            attendees: [],
        });

        const res = await request(app)
            .post(`/events/${newEvent._id}/attendees`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Attendee added successfully");
    });

    it("Should start a livestream", async () => {
        const res = await request(app)
            .post(`/events/${event._id}/livestream/start`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Livestream started successfully");
    });

    it("Should stop a livestream", async () => {
        const res = await request(app)
            .post(`/events/${event._id}/livestream/stop`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "Livestream stopped and event ended successfully");
    });

    it("Should get a livestream URL", async () => {
        const res = await request(app).get(`/events/${event._id}/livestream`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("liveStreamUrl");
    });
});
