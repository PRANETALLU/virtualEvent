describe("Frontend Tests", () => {

    context("Home Page", () => {
        it("Should load the home page successfully", () => {
            cy.visit("/");
            cy.contains("LIVE");
        });
    });

    context("Signup Page", () => {
        beforeEach(() => {
            cy.visit("/signup");
        });

        it("Should display the signup form", () => {
            cy.get("label").contains("Username").parent().find("input").should("exist");
            cy.get("label").contains("Email").parent().find("input").should("exist");
            cy.get("label").contains("Password").parent().find("input").should("exist");
            cy.get("button").contains("SIGN UP").should("exist");
        });

        it("Should allow a user to sign up", () => {
            cy.get("label").contains("Username").parent().find("input").type("testuser12345678");
            cy.get("label").contains("Email").parent().find("input").type("testuser12345678@example.com");
            cy.get("label").contains("Password").parent().find("input").type("password12345678");
            cy.get("button").contains("SIGN UP").click();

            cy.url().should("include", "/login", { timeout: 10000 });
        });
    });

    context("Login Page", () => {
        beforeEach(() => {
            cy.visit("/login");
        });

        it("Should display login form", () => {
            cy.get("label").contains("Username").parent().find("input").should("exist");
            cy.get("label").contains("Password").parent().find("input").should("exist");
            cy.get("button").contains("LOG IN").should("exist");
        });

        it("Should allow a user to log in", () => {
            cy.get("label").contains("Username").parent().find("input").type("testuser12345678");
            cy.get("label").contains("Password").parent().find("input").type("password12345678");
            cy.get("button").contains("LOG IN").click();

            cy.url().should("include", "/home", { timeout: 10000 });
        });
    });

    context("Event Creation", () => {
        beforeEach(() => {
            cy.visit("/home");
        });

        it("Should allow a user to create an event", () => {
            cy.contains("Create Event").click();

            cy.get("input[label='Title']").type("Cypress Test Event");
            cy.get("textarea[label='Description']").type("This is a test event created with Cypress.");
            cy.get("input[type='datetime-local']").type("2025-12-31T23:59");
            cy.get("input[label='Venue']").type("Virtual");
            cy.get("input[label='Price']").type("10");
            cy.get("div.MuiFormControl-root").contains("Category").click();
            cy.contains("Tech").click();

            cy.contains("Create").click();

            cy.contains("Cypress Test Event").should("exist");
        });
    });

    context("Search Page", () => {
        beforeEach(() => {
            cy.visit("/search");
        });

        it("Should display search bar and filters", () => {
            cy.get("input[placeholder='Search events...']").should("exist");
            cy.get("label").contains("Price").parent().should("exist");
            cy.get("label").contains("Date").parent().should("exist");
            cy.get("label").contains("Status").parent().should("exist");
        });

        it("Should allow searching for an event", () => {
            cy.get("input[placeholder='Search events...']").type("Tech Conference");
            cy.contains("Tech Conference").should("exist");
        });

        it("Should filter events by category", () => {
            cy.get("button").contains("Tech").click();
            cy.get(".Mui-selected").should("contain", "Tech");
        });

        it("Should filter events by price", () => {
            cy.get("label").contains("Price").parent().click();
            cy.get("li").contains("Free").click();
            cy.contains("Free").should("exist");
        });

        it("Should filter events by date", () => {
            cy.get("label").contains("Date").parent().click();
            cy.get("li").contains("Upcoming").click();
            cy.contains("Upcoming").should("exist");
        });

        it("Should filter events by status", () => {
            cy.get("label").contains("Status").parent().click();
            cy.get("li").contains("Ended").click();
            cy.contains("Ended").should("exist");
        });
    });

});

describe("Profile Page", () => {
    beforeEach(() => {
        cy.visit("/profile");
    });

    it("Should display user profile details", () => {
        cy.contains("Loading...").should("not.exist"); // Ensure user data loads
        cy.get("h5").should("exist"); // Username
        cy.get("p").contains("@").should("exist"); // Email
        cy.get("p").contains("No bio available.").should("exist"); // Default bio
    });

    it("Should allow updating preferences", () => {
        cy.get("input[type='checkbox']").first().check(); // Select the first preference
        cy.get("button").contains("Save Preferences").click();
        cy.on("window:alert", (text) => {
            expect(text).to.contains("Preferences updated successfully!");
        });
    });

    it("Should retain updated preferences", () => {
        cy.get("input[type='checkbox']").first().check();
        cy.get("button").contains("Save Preferences").click();
        cy.reload();
        cy.get("input[type='checkbox']").first().should("be.checked");
    });
});

describe("Event Card", () => {
    beforeEach(() => {
        cy.visit("/home"); 
    });

    it("Should navigate to event details when clicking 'View Details'", () => {
        cy.contains("View Details").first().click(); 
        cy.url().should("include", "/events/"); 
        cy.get("h1").should("exist"); 
    })
});
