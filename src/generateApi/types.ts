import { Type } from "@apparts/types";
export { Type };

export type ReturnError = { status: number; error: string };
export type ReturnSuccess = { status: number } & Type;
export type Return = ReturnError | ReturnSuccess;

export type EndpointDefinition = {
  method: string;
  path: string;
  assertions?: {
    params?: Record<string, Type>;
    query?: Record<string, Type>;
    body?: Record<string, Type>;
  };
  returns?: Return[];
  title?: string;
  description?: string;
};
