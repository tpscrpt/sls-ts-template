export type AWSLambdaResponse<T> = {
  statusCode: number;
  body?: T | string;
};
