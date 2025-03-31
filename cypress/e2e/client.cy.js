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
            cy.get("input[label='Username']").should("exist");
            cy.get("input[label='Email']").should("exist");
            cy.get("input[label='Password']").should("exist");
            cy.contains("SIGN UP").should("exist");
        });

        it("Should allow a user to sign up", () => {
            cy.get("input[label='Username']").type("testuser");
            cy.get("input[label='Email']").type("testuser@example.com");
            cy.get("input[label='Password']").type("password123");
            cy.contains("SIGN UP").click();

            cy.url().should("include", "/login");
        });

        it("Should display an error for invalid signup", () => {
            cy.get("input[label='Username']").type(""); 
            cy.get("input[label='Email']").type("invalidemail"); 
            cy.get("input[label='Password']").type("123"); 
            cy.contains("SIGN UP").click();

         
            cy.get("Typography").contains("Signup failed. Please try again.").should("exist");
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
            cy.get("label").contains("Username").parent().find("input").type("testuser123456");
            cy.get("label").contains("Password").parent().find("input").type("password123456");
            cy.get("button").contains("LOG IN").click();

            cy.url().should("include", "/home", { timeout: 10000 });
        });
    });

});
