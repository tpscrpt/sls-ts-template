import { readFileSync } from "fs";
import { join } from "path";
import AWS from "aws-sdk";
import Axios, { AxiosError } from "axios";

import { default as data } from "../../../src/data/index.js";

const { tables, projectName } = data();

const DynamoDB = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

const apiUrl = readFileSync(join(__dirname, "../.apiUrl")).toString();
const stageString = readFileSync(join(__dirname, "../.stage")).toString();

describe("signin test", () => {
  beforeAll(async () => {
    await DynamoDB.put({
      TableName: `${projectName}-${tables.users.name}-${stageString}`,
      Item: {
        email: "test@abc.com",
        password: "my secure password",
      },
    }).promise();
  });

  it("should return 400 bad request for a missing parameter", async () => {
    try {
      await Axios.post(`${apiUrl}/signin`, {
        email: "test@abc.com",
        password: undefined,
      });
    } catch (e) {
      const _e = e as AxiosError;
      expect(_e.response?.status).toBe(400);
    }
  });

  it("should return 404 not found for an email not present in the Users table", async () => {
    try {
      await Axios.post(`${apiUrl}/signin`, {
        email: "doesntexist@who.co",
        password: "somepaswordhash",
      });
    } catch (e) {
      const _e = e as AxiosError;
      expect(_e.response?.status).toBe(404);
    }
  });

  it("should return 403 unauthorized for a wrong password", async () => {
    try {
      await Axios.post(`${apiUrl}/signin`, {
        email: "test@abc.com",
        password: "my wrong password",
      });
    } catch (e) {
      const _e = e as AxiosError;
      expect(_e.response?.status).toBe(403);
    }
  });

  it("should return 500 internal error for the body being invalid JSON", async () => {
    try {
      await Axios.post(`${apiUrl}/signin`, null);
    } catch (e) {
      const _e = e as AxiosError;
      expect(_e.response?.status).toBe(500);
    }
  });

  it("should succeed and return a session token", async () => {
    const response = await Axios.post(`${apiUrl}/signin`, {
      email: "test@abc.com",
      password: "my secure password",
    });
    expect(response.status).toBe(200);
    expect(response.data).toMatch(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  });
});
