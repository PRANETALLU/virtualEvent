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

});
