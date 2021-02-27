import request from "supertest";
import { getConnection } from "typeorm";
import { app } from "../app";
import createConnection from "../database";

describe("Users", () => {
    beforeAll(async () => {
        const connection = await createConnection();
        await connection.runMigrations();
    });

    afterAll(async () => {
        const connection = getConnection();
        await connection.dropDatabase();
        await connection.close();
    }); // encerra a conexão e exclui o bd de testes.

    it("Should be able to create a new user", async () => {
        const response = await request(app).post("/users").send({
            name: "User Example",
            email: "user@example.com",
        });

        expect(response.status).toBe(201);
    });

    it("Should not be able to create a new user with an existent email", async () => {
        const response = await request(app).post("/users").send({
            name: "User Example",
            email: "user@example.com",
        });

        expect(response.status).toBe(400);
    });

});
