export type AWSLambdaResponse<T> = {
  statusCode: number;
  body?: T | string;
};

export type AWSLambdaEvent = {
  body: string;
};
