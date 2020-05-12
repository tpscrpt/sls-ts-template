import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { sessionExpiry } from "./utils";
import { AWSLambdaResponse, AWSLambdaEvent } from "../types";

import { default as data } from "../../data";

const { tables, projectName } = data();
const { stage } = process.env;

const DynamoDB = new AWS.DynamoDB.DocumentClient();

export type SigninResponse = string;
export type SigninBody = {
  email: string;
  password: string;
};

type GetUserResponseData = {
  userId: string;
  password: string;
};
async function getUser(email: string): Promise<GetUserResponseData> {
  try {
    const { userId, password } = (
      await DynamoDB.get({
        TableName: `${projectName}-${tables.users.name}-${stage}`,
        Key: {
          email,
        },
        ProjectionExpression: "password,userId",
      }).promise()
    ).Item as GetUserResponseData;

    return { userId, password };
  } catch (e) {
    // 404
    return { userId: "", password: "" };
  }
}

async function putSession(token: string, userId: string): Promise<void> {
  await DynamoDB.put({
    TableName: `${projectName}-${tables.sessions.name}-${stage}`,
    Item: {
      token,
      userId,
      expiresAt: sessionExpiry(),
    },
  }).promise();
}

export async function handler(event: AWSLambdaEvent): Promise<AWSLambdaResponse<SigninResponse>> {
  try {
    const { email, password } = JSON.parse(event.body) as SigninBody;

    if (!email || !password) return { statusCode: 400 };

    const { userId, password: dbPassword } = await getUser(email);

    if (!userId && !dbPassword) return { statusCode: 404 };
    if (dbPassword !== password) return { statusCode: 403 };

    const token = uuidv4();

    await putSession(token, userId);

    return {
      statusCode: 200,
      body: token,
    };
  } catch (e) {
    console.log(e);
    return { statusCode: 500 };
  }
}
